# MDP / MVP Runbook (易經 + 塔羅同時上線)

> 目標：在**不改占卜規則**前提下，把現有 Zoho Creator（易經+塔羅）能力包成可上線的最小閉環：
> - LINE → n8n → Zoho Creator
> - 系統自動決定「易經 or 塔羅」（使用者不選）
> - 冷卻觸發：安撫但不占卜（省 token）
> - 付費：綠界 ECPay 收款，交付走「查看內容頁 URL」

## 0. SSOT
- Repo: `repos/ai-divination/`
- DS: `zoho-creator/apps/AI易經.ds`
- n8n workflow templates: `n8n/workflows/`

## 1) Cloudflare Tunnel（Zoho → n8n 必要）
### 1.1 驗收條件
- `dig +short NS winds.tw` → `maisie.ns.cloudflare.com` + `newt.ns.cloudflare.com`
- `curl -I https://n8n.winds.tw` 能拿到 HTTP status line

### 1.2 本機 cloudflared
- `~/.cloudflared/cert.pem` 存在
- named tunnel: `n8n-winds-tw`
- `~/.cloudflared/config.yml` ingress:
  - `n8n.winds.tw` → `http://localhost:5678`

## 2) n8n（MVP workflows）
### 2.1 需設定的環境變數 / credentials
- `LINE_CHANNEL_ACCESS_TOKEN`
- `ZOHO_CREATOR_PREDICT_URL`

### 2.2 Workflows
- `LINE Webhook — Zoho Creator → Reply (MVP)`
  - Webhook path: `/line-webhook`
  - 只處理 text message
  - 呼叫 Zoho Creator API wrapper

> 注意：要使用 Production URL。

## 3) Zoho Creator（MVP 分流與回傳格式）
### 3.1 MVP Router
- 新增函數：`AIInterpreter.getMvpDivination_v1(question, solarDateTime, clientId)`
  - 依 `classifyQuestionType` 分流：`愛情/婚姻` → 塔羅；其餘 → 易經
  - 塔羅走 `Tarot.TarotDivinationFunction(clientId, question)`
  - 易經走 `getPredictionByQuestionAndBirthday_v2`（含冷卻先擋 + persona tone）

### 3.2（待補）Creator API Wrapper
建議建立一支對外 API wrapper，固定輸入/輸出：
- input: `{ lineUserId, text, timestamp }`
- output: `{ ok, blocked, message, meta }`

> clientId 綁定可先放在 n8n（Data store）或 Creator（新增欄位）二選一。

## 4) 綠界 ECPay（最快收款：交付 URL）
### 4.1 既有
- `API.CreateTalismanOrder(...)` 會產生 `payment_form_html` 並建立 `Talisman_Purchases`

### 4.2（待補）ReturnURL / ClientBackURL
- ReturnURL：綠界 server-to-server 回拋 → Creator（驗簽 + 更新訂單 Paid）
- ClientBackURL：導回「查看內容頁」URL（B1 先用 Creator Page；之後可換官網）

## 5) 上線驗收（最小）
- LINE 能收到訊息並回覆
- 冷卻規則觸發時：不占卜，只回安撫短文
- 正常情況：能回易經或塔羅解讀
- ECPay：能產生付款表單/連結（至少能導向付款頁）

