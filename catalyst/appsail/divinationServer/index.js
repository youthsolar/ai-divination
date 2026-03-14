// =============================================================================
// Catalyst AppSail: divinationServer
// 用途：占卜異步橋接服務（免費 + 付費占卜）+ LIFF CORS 代理
//
// 架構：
//   [免費] Flow → POST /divination（立即 200）
//     → AppSail 背景呼叫 Creator predictFromLine → LLM → LINE Push
//
//   [付費] ecPayReturn → POST /paid-divination（立即 200）
//     → AppSail 背景呼叫 Creator generatePaidInterpretation → LLM → LINE Push
//
//   [LIFF代理] Zoho Creator Custom API 在瀏覽器端有 CORS 限制（UNAUTHORIZED_CORS_REQUEST）
//     → LIFF 改呼叫 AppSail，由 AppSail server-to-server 轉發給 Creator
//     GET  /liff-prefill   → getClientByLineUID（回訪預填）
//     POST /liff-submit    → liffDivinationMvp（送出占卜，同步等待 LLM）
//     POST /liff-order     → createTalismanOrder（建立付款訂單）
//
// 為何用 AppSail：
//   Express.js 持續運行，res.send() 後背景任務繼續跑
//   不像 Lambda/BasicIO 回應後即終止
// =============================================================================

const express = require('express');
const https = require('https');
const crypto = require('crypto');

// 暫存付款 HTML（LINE WebView 無法直接 form.submit，改用外部瀏覽器）
const paymentStore = new Map(); // token → {html, expiresAt}

const app = express();
app.use(express.json());
// text/plain 支援：LIFF 用 text/plain 送 JSON 以避免 CORS preflight
app.use(express.text({ type: 'text/plain' }));
// ECPay 回調用 application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// Creator API 設定
// =============================================================================
const PREDICT_API_URL  = 'https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine';
const PREDICT_PUBLIC_KEY = '8FfAVOwV4QyJUBvOUkYEYt16C';

const PAID_API_URL     = 'https://www.zohoapis.com/creator/custom/uneedwind/generatePaidInterpretation';
const PAID_PUBLIC_KEY  = 'rCvOuJWpDHE9wq1v3mRhAZBhw';

// LIFF CORS 代理用
const LIFF_MVP_URL     = 'https://www.zohoapis.com/creator/custom/uneedwind/liffDivinationMvp';
const LIFF_MVP_KEY     = 'wqWnHTZqhSTFBNTARwwNjAERw';
const LIFF_PREFILL_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/getClientByLineUID';
const LIFF_PREFILL_KEY = 'XsW9ENZWBgDC7Jbua9JbQYXpu';
const LIFF_ORDER_URL   = 'https://www.zohoapis.com/creator/custom/uneedwind/createTalismanOrder';
const LIFF_ORDER_KEY   = 'FrOCmCUszzMjTZOeaDNAwETkA';
const LIFF_STATUS_URL  = 'https://www.zohoapis.com/creator/custom/uneedwind/liffGetLatestStatus';
const LIFF_STATUS_KEY  = '6bQPVRAGPUu2RxX46hjZpNN6F';

// ECPay 付款回調 → Creator ecPayReturn
const ECPAY_RETURN_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/ecPayReturn';
const ECPAY_RETURN_KEY = 'FBkXOAvTNkFgyZevwbST4ga4x';

// LIFF 來源（GitHub Pages）
const LIFF_ORIGIN = 'https://youthsolar.github.io';

// LINE Messaging API（推播付款按鈕用）
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_CHANNEL_TOKEN = 'Z8xxDDn3v+BNPmyiZ/ZAuJ8/sGH1eFyBpnDsn0OYgS+zQNVkv1wIDf6eDCwQ8K/qkMfK62WGlK/IiaBYXJobgtmiXkcrINzjpCK+at9yXJpedzkiWYiMZi4VQFWvpqhT4Lxs/zWfqSw39L4Ht8pKkAdB04t89/1o/w1cDnyilFU=';

// AppSail 自己的 URL（供 /pay/:token 生成外部連結）
const APPSAIL_BASE_URL = 'https://divinationserver-10121308063.development.catalystappsail.com';

// 推播 LINE Flex Message 付款按鈕
function pushLinePaymentButton(lineUserId, paymentToken, amount, merchantTradeNo) {
  const payUrl = `${APPSAIL_BASE_URL}/pay/${paymentToken}`;
  const flexMessage = {
    to: lineUserId,
    messages: [{
      type: 'flex',
      altText: '🏮 您的符令訂單已建立，請點擊付款按鈕完成付款',
      contents: {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '🏮 找風問幸福',
            color: '#8B4513',
            weight: 'bold',
            size: 'sm'
          }],
          backgroundColor: '#FFF8DC',
          paddingAll: '12px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '符令訂單已建立',
              weight: 'bold',
              size: 'md',
              color: '#333333'
            },
            {
              type: 'text',
              text: `金額：NT$${amount}`,
              size: 'sm',
              color: '#666666',
              margin: 'sm'
            },
            {
              type: 'text',
              text: `訂單：${merchantTradeNo}`,
              size: 'xxs',
              color: '#999999',
              margin: 'xs'
            }
          ],
          paddingAll: '16px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'button',
            action: {
              type: 'uri',
              label: '💳 前往付款 NT$' + amount,
              uri: payUrl
            },
            style: 'primary',
            color: '#C0392B',
            height: 'sm'
          }],
          paddingAll: '12px',
          backgroundColor: '#FFF8DC'
        }
      }
    }]
  };

  const body = JSON.stringify(flexMessage);
  return new Promise((resolve) => {
    const req = https.request('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`[LINE push payment] status=${res.statusCode} body=${data}`);
        resolve({ ok: res.statusCode === 200 });
      });
    });
    req.on('error', (e) => { console.error('[LINE push payment] error:', e.message); resolve({ ok: false }); });
    req.write(body);
    req.end();
  });
}

// =============================================================================
// CORS helper（LIFF 端點專用）
// =============================================================================
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', LIFF_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// OPTIONS preflight for all /liff-* routes
app.options('/liff-*', (req, res) => {
  setCORSHeaders(res);
  res.status(204).end();
});

// =============================================================================
// Creator HTTP helper（server-to-server，無 CORS 限制）
// =============================================================================
function callCreatorPOST(apiUrl, publicKey, payload, timeoutMs = 90000) {
  const body = JSON.stringify(payload);
  const url = new URL(`${apiUrl}?publickey=${publicKey}`);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: timeoutMs,
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[Creator POST ${apiUrl.split('/').pop()}] status=${res.statusCode} body=${data.slice(0, 200)}`);
        try { resolve({ ok: true, data: JSON.parse(data) }); }
        catch(e) { resolve({ ok: false, raw: data }); }
      });
    });
    req.on('error', (err) => {
      console.error(`[Creator POST] error: ${err.message}`);
      resolve({ ok: false, error: err.message });
    });
    req.on('timeout', () => {
      console.error('[Creator POST] timeout');
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    req.write(body);
    req.end();
  });
}

function callCreatorGET(apiUrl, publicKey, params = {}) {
  const qs = new URLSearchParams({ publickey: publicKey, ...params }).toString();
  const urlStr = `${apiUrl}?${qs}`;
  return new Promise((resolve) => {
    https.get(urlStr, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[Creator GET ${apiUrl.split('/').pop()}] status=${res.statusCode}`);
        try { resolve({ ok: true, data: JSON.parse(data) }); }
        catch(e) { resolve({ ok: false, raw: data }); }
      });
    }).on('error', (err) => {
      console.error(`[Creator GET] error: ${err.message}`);
      resolve({ ok: false, error: err.message });
    });
  });
}

// =============================================================================
// LIFF CORS 代理端點
// =============================================================================

// GET /liff-prefill?lineUserId=XXX → getClientByLineUID
app.get('/liff-prefill', async (req, res) => {
  setCORSHeaders(res);
  const lineUserId = req.query.lineUserId || '';
  if (!lineUserId) return res.json({ result: { found: false } });
  const result = await callCreatorGET(LIFF_PREFILL_URL, LIFF_PREFILL_KEY, { lineUserId });
  res.json(result.ok ? result.data : { result: { found: false } });
});

// POST /liff-submit → liffDivinationMvp（非同步：立即回 pending，背景執行 LLM）
app.post('/liff-submit', (req, res) => {
  setCORSHeaders(res);
  const payload = (typeof req.body === 'string') ? (() => { try { return JSON.parse(req.body); } catch(e) { return {}; } })() : (req.body || {});

  if (!payload.lineUserId) {
    return res.status(400).json({ success: false, message: 'missing lineUserId' });
  }

  // 立即回應，避免 AppSail timeout
  res.json({ success: true, pending: true, lineUserId: payload.lineUserId });

  // 背景執行 liffDivinationMvp（LLM 約 30-60 秒）
  callCreatorPOST(LIFF_MVP_URL, LIFF_MVP_KEY, payload, 120000).then((result) => {
    console.log(`[/liff-submit] liffDivinationMvp done: ok=${result.ok} data=${JSON.stringify(result.data || result).slice(0, 200)}`);
  });
});

// GET /liff-status?lineUserId=XXX → 查詢最新占卜結果（LIFF polling 用）
app.get('/liff-status', async (req, res) => {
  setCORSHeaders(res);
  const lineUserId = req.query.lineUserId || '';
  if (!lineUserId) return res.json({ ready: false });

  if (LIFF_STATUS_KEY === 'LIFF_STATUS_PUBLIC_KEY') {
    // public key 未設定，回傳 not_configured
    return res.json({ ready: false, error: 'status_api_not_configured' });
  }

  const result = await callCreatorGET(LIFF_STATUS_URL, LIFF_STATUS_KEY, { lineUserId });
  if (result.ok && result.data && result.data.result) {
    res.json(result.data.result);
  } else {
    res.json({ ready: false });
  }
});

// POST /liff-order → createTalismanOrder（建立 ECPay 付款訂單，Creator API 用 GET）
app.post('/liff-order', async (req, res) => {
  setCORSHeaders(res);
  const body = (typeof req.body === 'string') ? (() => { try { return JSON.parse(req.body); } catch(e) { return {}; } })() : (req.body || {});
  // Creator Custom API 設定為 GET，用 query params 傳遞
  const result = await callCreatorGET(LIFF_ORDER_URL, LIFF_ORDER_KEY, body);
  if (result.ok) {
    // 攤平 Creator 兩層回傳：{result:{success,data:{payment_form,...}}} → {success,data:{paymentHtml,...}}
    const inner = (result.data && result.data.result) ? result.data.result : result.data;
    if (inner && inner.success && inner.data && inner.data.payment_form) {
      // 暫存付款 HTML，給 /pay/:token 端點服務（讓 liff.openWindow 外部瀏覽器開啟）
      const token = crypto.randomBytes(16).toString('hex');
      paymentStore.set(token, { html: inner.data.payment_form, expiresAt: Date.now() + 30 * 60 * 1000 });

      // 推播 LINE Flex Message 付款按鈕（背景執行，不阻塞回應）
      const lineUserId = body.lineUserId || '';
      const amount = inner.data.amount || 360;
      const merchantTradeNo = inner.data.merchant_trade_no || '';
      if (lineUserId) {
        pushLinePaymentButton(lineUserId, token, amount, merchantTradeNo)
          .then(r => console.log(`[/liff-order] LINE push result: ok=${r.ok}`));
      }

      res.json({
        success: true,
        message: '訂單建立成功，付款連結已傳送到您的 LINE，請返回對話點擊付款按鈕',
        data: {
          paymentToken:     token,
          merchantTradeNo:  merchantTradeNo,
          paymentUrl:       inner.data.payment_url,
          amount:           amount,
          orderId:          inner.data.order_id,
          linePushSent:     !!lineUserId
        }
      });
    } else {
      res.json({ success: false, message: (inner && inner.message) || '建立訂單失敗' });
    }
  } else {
    res.status(500).json({ success: false, message: result.error || 'Creator error' });
  }
});

// GET /pay/:token → 伺服付款 HTML（供 liff.openWindow 外部瀏覽器直接 submit 到 ECPay）
app.get('/pay/:token', (req, res) => {
  const entry = paymentStore.get(req.params.token);
  if (!entry || Date.now() > entry.expiresAt) {
    return res.status(404).send('<h1>付款連結已過期或不存在</h1>');
  }
  paymentStore.delete(req.params.token); // 一次性使用
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(entry.html);
});

// =============================================================================
// ECPay 付款回調端點（取代 Vercel proxy）
// ECPay ServerNotify → AppSail → 立即回 "1|OK" → 背景呼叫 Creator ecPayReturn
// =============================================================================
app.post('/ecpay-notify', (req, res) => {
  // ECPay 送 application/x-www-form-urlencoded
  const params = req.body || {};
  const merchantTradeNo = params.MerchantTradeNo || '';
  const rtnCode = params.RtnCode || '';
  console.log(`[/ecpay-notify] MerchantTradeNo=${merchantTradeNo} RtnCode=${rtnCode}`);

  // 立即回傳 "1|OK"（ECPay 規定格式，純文字）
  res.setHeader('Content-Type', 'text/plain');
  res.send('1|OK');

  // 背景呼叫 Creator ecPayReturn 處理訂單更新
  if (ECPAY_RETURN_KEY === '__ECPAY_RETURN_PUBLIC_KEY__') {
    console.error('[/ecpay-notify] ecPayReturn public key 尚未設定！');
    return;
  }

  // 把 ECPay 表單參數轉成 JSON payload 送給 Creator
  const payload = {};
  for (const [k, v] of Object.entries(params)) {
    payload[k] = v;
  }
  callCreatorPOST(ECPAY_RETURN_URL, ECPAY_RETURN_KEY, payload, 120000)
    .then((result) => {
      console.log(`[/ecpay-notify] ecPayReturn result: ok=${result.ok} data=${JSON.stringify(result.data || result).slice(0, 200)}`);
    });
});

// =============================================================================
// 原有端點（Zoho Flow 呼叫，不需要 CORS）
// =============================================================================

// 背景呼叫 predictFromLine（fire-and-forget）
function callPredictFromLine(payload) {
  const body = JSON.stringify({ payload });
  const url = new URL(`${PREDICT_API_URL}?publickey=${PREDICT_PUBLIC_KEY}`);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 120000,
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[predictFromLine] status=${res.statusCode} body=${data.slice(0, 200)}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => {
      console.error(`[predictFromLine] error: ${err.message}`);
      resolve({ error: err.message });
    });
    req.on('timeout', () => {
      console.error('[predictFromLine] timeout after 2 minutes');
      req.destroy();
      resolve({ error: 'timeout' });
    });
    req.write(body);
    req.end();
  });
}

// POST /divination — 免費占卜（LINE 問卦，Zoho Flow 呼叫）
app.post('/divination', (req, res) => {
  const { lineUserId, text, timestamp } = req.body || {};
  if (!lineUserId || !text) {
    return res.status(400).json({ ok: false, message: 'missing lineUserId or text' });
  }
  console.log(`[/divination] lineUserId=${lineUserId} text=${text.slice(0, 50)}`);
  res.status(200).json({ ok: true, status: 'queued' });
  callPredictFromLine({ lineUserId, text, timestamp: timestamp || Date.now().toString() })
    .then((result) => {
      console.log(`[/divination] predictFromLine done: ${JSON.stringify(result).slice(0, 100)}`);
    });
});

// 背景呼叫 generatePaidInterpretation（fire-and-forget）
function callGeneratePaidInterpretation(payload) {
  const body = JSON.stringify({ payload });
  const url = new URL(`${PAID_API_URL}?publickey=${PAID_PUBLIC_KEY}`);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 120000,
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[generatePaidInterpretation] status=${res.statusCode} body=${data.slice(0, 200)}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => {
      console.error(`[generatePaidInterpretation] error: ${err.message}`);
      resolve({ error: err.message });
    });
    req.on('timeout', () => {
      console.error('[generatePaidInterpretation] timeout after 2 minutes');
      req.destroy();
      resolve({ error: 'timeout' });
    });
    req.write(body);
    req.end();
  });
}

// POST /paid-divination — 付費占卜（ECPay 回調後觸發）
app.post('/paid-divination', (req, res) => {
  const { divination_log_id, line_user_id, delivery_token } = req.body || {};
  if (!divination_log_id || !line_user_id) {
    return res.status(400).json({ ok: false, message: 'missing divination_log_id or line_user_id' });
  }
  console.log(`[/paid-divination] div_id=${divination_log_id} lineUserId=${line_user_id}`);
  res.status(200).json({ ok: true, status: 'queued' });
  callGeneratePaidInterpretation({ divination_log_id, line_user_id, delivery_token })
    .then((result) => {
      console.log(`[/paid-divination] done: ${JSON.stringify(result).slice(0, 100)}`);
    });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'divinationServer', time: new Date().toISOString() });
});

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000;
app.listen(PORT, () => {
  console.log(`divinationServer running on port ${PORT}`);
});
