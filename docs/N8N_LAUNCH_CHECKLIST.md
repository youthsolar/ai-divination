# n8n 上線 Checklist（MVP）

> 目標：把 n8n 的 webhook URL、環境變數、workflow active 狀態收斂到可上線。

## 1) Base URL / webhook URL 一致性
- [ ] 對外網址確認：`https://n8n.winds.tw`
- [ ] 若使用 docker compose：建議設定
  - [ ] `WEBHOOK_URL=https://n8n.winds.tw`
  - [ ] `N8N_HOST=n8n.winds.tw`
  - [ ] `N8N_PROTOCOL=https`

> 沒有 WEBHOOK_URL 很常造成「UI 顯示的 Production URL 跟實際對外不一致」。

## 2) 環境變數（至少）
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`（Messaging API channel access token）
- [ ] `ZOHO_CREATOR_PREDICT_URL`（Creator 對外 API wrapper endpoint）

金流交付（若要 A1 付款成功推播）：
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`（同上）
- [ ] `ECPAY_PAID_NOTIFY_SHARED_SECRET`（可選；若要加簽）

內容工廠 Phase 1（若本次要上）：
- [ ] `ZOHO_CREATOR_WEEKLY_FORTUNE_URL`
- [ ] `ZOHO_CREATOR_PUBLISH_CALLBACK_URL`
- [ ] `ZOHO_CREATOR_SCHEDULE_QUERY_URL`

## 3) Workflows 狀態
MVP（必開）：
- [ ] `LINE Webhook — Zoho Creator → Reply (MVP)` active

金流推播（需要才開）：
- [ ] `ECPay Paid Notify — LINE Push (MVP)` active
  - Webhook path: `/webhook/ecpay-paid-notify`

> 注意：`n8n import:workflow` 會自動 deactivate，需要手動再 active。

## 4) 最小驗收
- [ ] `POST https://n8n.winds.tw/webhook/healthcheck` → `ok`
- [ ] LINE webhook 打進來後 n8n execution 有跑
- [ ] n8n 成功呼叫 Creator API wrapper
- [ ] n8n 成功 reply to LINE

金流推播驗收：
- [ ] 手動 `curl -X POST https://n8n.winds.tw/webhook/ecpay-paid-notify -H 'Content-Type: application/json' -d '{"lineUserId":"Uxxx","deliveryUrl":"https://example.com/?token=abc"}'`
- [ ] LINE 收到 push 訊息
