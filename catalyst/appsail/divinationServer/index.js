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

const app = express();
app.use(express.json());
// text/plain 支援：LIFF 用 text/plain 送 JSON 以避免 CORS preflight
app.use(express.text({ type: 'text/plain' }));

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
const LIFF_ORDER_URL   = 'https://www.zohoapis.com/creator/custom/uneedwind/CreateTalismanOrder';
const LIFF_ORDER_KEY   = '1MyePwfpEhdx1dzuBr8VNVMCZ';
const LIFF_STATUS_URL  = 'https://www.zohoapis.com/creator/custom/uneedwind/liffGetLatestStatus';
const LIFF_STATUS_KEY  = '6bQPVRAGPUu2RxX46hjZpNN6F';

// LIFF 來源（GitHub Pages）
const LIFF_ORIGIN = 'https://youthsolar.github.io';

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
    res.json(result.data);
  } else {
    res.status(500).json({ success: false, message: result.error || 'Creator error' });
  }
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
