// =============================================================================
// Catalyst Event Function: divinationProcessor
// 觸發方式：Catalyst Custom Event Listener "divination-trigger"
// 功能：
//   - 接收來自 Zoho Flow lineWebhookRelay 的占卜請求
//   - 背景呼叫 Creator predictFromLine API（最多等 2 分鐘）
//   - Creator 即使 HTTP timeout 仍繼續執行 → LINE 使用者收到占卜結果
// 架構說明：
//   Flow → Catalyst Event Listener（立即 200） → Flow 記「成功」
//   Catalyst Event Function（背景）→ Creator predictFromLine → LLM → LINE Push
// =============================================================================

const axios = require('axios');

const PREDICT_API_URL = 'https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine';
const PREDICT_PUBLIC_KEY = '8FfAVOwV4QyJUBvOUkYEYt16C';

module.exports = async function(context, basicInfo, event) {
  const payload = event.data;

  console.log('[divinationProcessor] Received event:', JSON.stringify(payload));

  try {
    const response = await axios.post(
      `${PREDICT_API_URL}?publickey=${PREDICT_PUBLIC_KEY}`,
      { payload: payload },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000  // 2 分鐘
        // Creator 即使 HTTP timeout 後仍繼續執行 predictFromLine
        // LINE 使用者仍然會收到占卜結果（fire-and-forget from Catalyst）
      }
    );
    console.log('[divinationProcessor] predictFromLine response:', response.status);
  } catch (err) {
    // HTTP timeout 是預期行為（predictFromLine 約需 30-40s，Creator 繼續執行）
    // 其他錯誤也記錄但不拋出（避免 Catalyst 重試）
    console.log('[divinationProcessor] HTTP call ended:', err.message);
  }

  return context.output('ok');
};
