# OPS：每日 100 筆符令成交 — 最小監控/對帳設計（Creator SSOT）

> 前提：n8n CE execution log 只留 1 天。
> 結論：金流/交付/對帳的 SSOT 必須落在 Zoho Creator。

## 1) 交易生命週期（建議狀態機）
- Pending：已建單，等待付款
- Paid：付款成功（已驗簽）
- Failed：付款失敗（已驗簽）
- Delivered：已完成交付（推播成功或使用者成功開啟交付頁）

> 目前 `API.ECPayReturn` 會寫 Paid/Failed；Delivered 建議由 n8n push 成功後回寫。

## 2) `Talisman_Purchases` 建議必存欄位
### 對帳/金流
- `MerchantTradeNo`（唯一）
- `TradeNo`（ECPay 回傳）
- `RtnCode` / `RtnMsg`
- `CheckMacValue`（收到的，便於稽核）
- `PaymentDate`
- `Status`

### 交付
- `Delivery_Token`
- `Delivery_Token_ExpiresAt`
- `Delivery_Push_Status`（Pending/Success/Fail）
- `Delivery_Push_Time`
- `Delivery_Push_Error`（如果失敗）
- `Delivery_View_FirstAt`（第一次開交付頁時間）

### 使用者識別
- `Line_User_ID`（能追到誰買的）
- `Client_Link`（若有 Clients_Report）

## 3) `Divination_Logs` 建議最小追蹤
- `Client_Link`
- `Question_Text`（或摘要 hash）
- `Divination_Type`（易經/塔羅）
- `Cooldown_Triggered`（bool）
- `Added_Time`

> 目的：冷卻策略可稽核，且便於客服。

## 4) 每日營運報表（可先人工，後續自動化）
- 當日建單數（Pending + Paid + Failed）
- 當日付款成功數（Paid）
- Paid→Delivered 轉換率
- 平均 Paid→推播耗時
- 交付頁開啟率（有 `Delivery_View_FirstAt` 時）

## 5) 最小告警（先不用自動化也可）
- 連續 30 分鐘 Paid=0（可能金流掛）
- Paid 但 Delivery_Token 為空（程式 bug）
- Paid 但 push fail 比例偏高（LINE token/頻率限制）

## 6) Phase 2 建議
- n8n push 完成後回寫 Creator：`API.DeliveryPushCallback_v1`
  - input：`{ merchantTradeNo, ok, error, lineMessageId }`
  - output：`{ ok }`

這樣 Creator 才能完整 SSOT 對帳/追溯。
