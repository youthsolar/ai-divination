// =============================================================================
// Catalyst AppSail: divinationServer
// 用途：占卜異步橋接服務（免費 + 付費占卜）
//
// 架構：
//   [免費] Flow → POST /divination（立即 200）
//     → AppSail 背景呼叫 Creator predictFromLine → LLM → LINE Push
//
//   [付費] ecPayReturn → POST /paid-divination（立即 200）
//     → AppSail 背景呼叫 Creator generatePaidInterpretation → LLM → LINE Push
//
// 為何用 AppSail：
//   Express.js 持續運行，res.send() 後背景任務繼續跑
//   不像 Lambda/BasicIO 回應後即終止
// =============================================================================

const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());

// 免費占卜
const PREDICT_API_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine';
const PREDICT_PUBLIC_KEY = '8FfAVOwV4QyJUBvOUkYEYt16C';

// 付費占卜（public key 待 Jeffery 在 Creator 建立 Custom API 後填入）
const PAID_API_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/generatePaidInterpretation';
const PAID_PUBLIC_KEY = 'rCvOuJWpDHE9wq1v3mRhAZBhw';

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
    timeout: 120000, // 2 分鐘
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

// POST /divination — 免費占卜（LINE 問卦）
app.post('/divination', (req, res) => {
  const { lineUserId, text, timestamp } = req.body || {};

  if (!lineUserId || !text) {
    return res.status(400).json({ ok: false, message: 'missing lineUserId or text' });
  }

  console.log(`[/divination] lineUserId=${lineUserId} text=${text.slice(0, 50)}`);

  // 立即回 200，Flow 記為成功
  res.status(200).json({ ok: true, status: 'queued' });

  // 背景執行（不 await，不阻擋回應）
  callPredictFromLine({ lineUserId, text, timestamp: timestamp || Date.now().toString() })
    .then((result) => {
      console.log(`[/divination] predictFromLine done: ${JSON.stringify(result).slice(0, 100)}`);
    });
});

// POST /paid-divination — 付費占卜（ECPay 回調後觸發）
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
    timeout: 120000, // 2 分鐘
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

app.post('/paid-divination', (req, res) => {
  const { divination_log_id, line_user_id, delivery_token } = req.body || {};

  if (!divination_log_id || !line_user_id) {
    return res.status(400).json({ ok: false, message: 'missing divination_log_id or line_user_id' });
  }

  console.log(`[/paid-divination] div_id=${divination_log_id} lineUserId=${line_user_id}`);

  // 立即回 200，ecPayReturn 記為成功
  res.status(200).json({ ok: true, status: 'queued' });

  // 背景執行（不 await，不阻擋回應）
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
