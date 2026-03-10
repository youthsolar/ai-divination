// =============================================================================
// Catalyst AppSail: divinationServer
// 用途：接收 Zoho Flow 的占卜請求，立即回 200，背景呼叫 Creator predictFromLine
//
// 架構：
//   Flow → POST /divination（立即 200）
//   AppSail 背景呼叫 Creator predictFromLine（最多等 2 分鐘）
//   Creator 完成 LLM + LINE Push → 用戶收到結果
//
// 為何用 AppSail：
//   Express.js 持續運行，res.send() 後背景任務繼續跑
//   不像 Lambda/BasicIO 回應後即終止
// =============================================================================

const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());

const PREDICT_API_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine';
const PREDICT_PUBLIC_KEY = '8FfAVOwV4QyJUBvOUkYEYt16C';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'divinationServer', time: new Date().toISOString() });
});

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000;
app.listen(PORT, () => {
  console.log(`divinationServer running on port ${PORT}`);
});
