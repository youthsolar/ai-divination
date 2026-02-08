# ECPay ReturnURL 修補 Runbook（上線前必做）

> 目的：把綠界付款回拋（ReturnURL）從「極簡不驗簽」修補為「驗簽 + 精準對單 + 交付 token + 通知 n8n」。
> 不更動占卜規則；只修金流回拋與交付。

## 現況（已確認）
- 綠界 ReturnURL（Production）目前指向：
  - `https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return`
- 目前 endpoint handler 綁到：
  - `Webhook.handleECPayReturn()`（極簡版、**危險**）

## 為什麼危險
`Webhook.handleECPayReturn()` 版本存在致命問題：
- 沒有驗簽 `CheckMacValue`
- 沒有用 `MerchantTradeNo` 精準對單
- 可能把任何 `Status == "Pending"` 的訂單直接改成 `Paid`

## 目標狀態（安全版）
讓回拋流程走 SSOT 的安全實作：
- `string API.ECPayReturn(map ecpay_params)`
  - 驗簽：用 `hashKey_Production/hashIV_Production` 重算 `CheckMacValue`
  - 對單：`Talisman_Purchases[MerchantTradeNo == ...]`
  - Paid：建立 `Delivery_Token`（預設 7 天到期）
  - Paid：POST n8n webhook → LINE Push 交付連結
  - 回覆 ECPay：成功 `1|OK` / 失敗 `0|FAIL`

## 操作步驟（10–15 分鐘）
### Step 1：先把安全版 function 上到 Creator
1. 進 Zoho Creator → App：`AI易經`（ai-divination）
2. Settings → Application IDE → Custom Functions
3. 在 group `API` 下建立/覆蓋：
   - `string API.ECPayReturn(map ecpay_params)`
4. 內容：貼 repo SSOT 版本（來源：`zoho-creator/apps/AI易經.ds` 內的同名 function block）
5. Save（確保無錯）

### Step 2：把 endpoint handler 改綁到 `API.ECPayReturn`
目標：讓 `handle_ecpay_return` endpoint 直接使用 `API.ECPayReturn`。

做法有兩種（擇一）：
- **A（建議）**：在「Microservices → Custom API → handle_ecpay_return」將 handler 由 `handleECPayReturn` 改成 `API.ECPayReturn`
- **B（備援）**：保留 endpoint 綁 `Webhook.handleECPayReturn`，但把 `Webhook.handleECPayReturn` 內容改成只轉呼叫 `API.ECPayReturn(ecpay_params)`（不要再做 Pending→Paid）

### Step 3：驗收（必做）
1. 用 mock 參數觸發（或綠界測試回拋）
2. 驗收點：
   - CheckMacValue 錯 → 回 `0|FAIL`
   - 找不到 MerchantTradeNo → 回 `0|FAIL`
   - Paid → 訂單狀態更新、生成 `Delivery_Token`、`Delivery_Token_ExpiresAt`、並觸發 n8n paid-notify
3. n8n webhook hit：
   - `POST https://n8n.winds.tw/webhook/ecpay-paid-notify` 應回 200

## 需要先填好的 Creator variables
- `thisapp.variables.ECPay.hashKey_Production`
- `thisapp.variables.ECPay.hashIV_Production`
- `thisapp.variables.System.N8N.ECPayPaidNotifyURL` = `https://n8n.winds.tw/webhook/ecpay-paid-notify`
- `thisapp.variables.System.DeliveryPageBaseURL` = 交付頁 base URL（會組成 `?token=...`）

---

## 風險備註
- 沒做 Step 1/2 就上線：有可能出現「未付款被標 Paid」的災難。
- 若 Zoho UI 不穩（重繪/白畫面）：請優先走 Step 1（先建立 `API.ECPayReturn`），再調整 handler。
