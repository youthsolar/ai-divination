# Zoho Creator 6 上線路線 A — UI / Application IDE 覆蓋 Runbook

> 目標：在 DS 匯入不穩定的前提下，改用 Creator UI/IDE 逐支覆蓋上線所需 Deluge。
> 原則：**不改占卜規則**；允許效能/載入/記錄/安全性修補。

## 準備
- SSOT repo：`repos/ai-divination/`
- 核心 DS：`zoho-creator/apps/AI易經.ds`
- 作業方式：
  - 以 DS 為準抽出 function block → 貼到 Creator IDE 同名 function
  - 每次貼完：Save → Execute（如可）→ 驗收

## 必做順序（建議）
### 0) 變數先填（否則 Save/Execute 會一堆假錯）
- ECPay：merchantID/hashKey/hashIV/ReturnURL
- System：n8n notify URL、DeliveryPageBaseURL

### 1) LINE → Creator 占卜回覆（MVP）
上線必需：一支「對外 API wrapper」讓 n8n 呼叫。
- 建議 API：`API.PredictFromLine_v1(map payload)`（名稱可調）
- input：`{ lineUserId, text, timestamp }`
- output：`{ ok, blocked, message, meta }`

驗收：
- n8n `LINE Webhook — Zoho Creator → Reply (MVP)` 呼叫成功且能回訊息

### 2) 易經/塔羅 MVP 分流
- `AIInterpreter.getMvpDivination_v1(...)`（repo 已有）
- 易經主流程：`AIInterpreter.getPredictionByQuestionAndBirthday_v2(...)`
  - 冷卻：先擋 + 直接 return（不呼叫 OpenAI）
  - persona tone：由系統決定（不讓使用者選語氣）

驗收：
- 冷卻觸發：回安撫短文、且不產生 OpenAI call log

### 3) 建單 + 付款表單
- `API.CreateTalismanOrder(_v2)`：建立 `Talisman_Purchases` 並產生付款 HTML
- `ECPay.generateCheckoutForm_Production(...)`

驗收：
- 能產生付款表單，`MerchantTradeNo` 有值，訂單狀態 Pending

### 4) 付款回拋（ReturnURL）— 必做安全修補
見：`docs/ECPAY_RETURNURL_PATCH_RUNBOOK.md`

### 5) 交付（token URL）
- 建立交付頁（Creator Page）或 API：用 `Delivery_Token` 查訂單 → 顯示內容/符令

驗收：
- Paid 後 LINE 能收到交付連結；打開連結可看到內容

---

## 每支 function 覆蓋的標準流程
1. 在 repo DS 找到同名 function block
2. 在 Creator IDE 打開同名 function
3. 全段覆蓋貼上
4. Save
5. 若 function 可 Execute：用 mock input 測一次
6. 在 `docs/DECISIONS.md` 或 `docs/TODO.md` 記錄「已上線覆蓋」與日期

## 常見踩雷
- Creator UI 重繪造成編輯器白畫面：先刷新、重新進 IDE；必要時分段貼。
- Deluge parser 對縮排/註解位置嚴格：以 repo SSOT 已修正版為準。
