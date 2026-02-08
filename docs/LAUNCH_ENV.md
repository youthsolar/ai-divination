# Launch Environment Checklist (placeholders to fill)

> Goal: Keep all deploy-time URLs/tokens in one place.

## 1) Cloudflare / n8n
- [ ] `n8n.winds.tw` reachable (HTTPS)
- [ ] n8n Production webhook URLs confirmed (must match public base URL)

## 2) n8n
### 2.1 Base URL (recommended)
To avoid webhook URL mismatches:
- [ ] `WEBHOOK_URL=https://n8n.winds.tw`
- [ ] `N8N_HOST=n8n.winds.tw`
- [ ] `N8N_PROTOCOL=https`

### 2.2 MVP env vars (must-have)
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `ZOHO_CREATOR_PREDICT_URL` = <Creator API.PredictFromLine_v1 endpoint for LINE inbound>

### 2.3 Payment delivery (A1) env vars (when enabled)
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` (same token)

### 2.4 Content factory Phase 1 (optional)
- [ ] `ZOHO_CREATOR_WEEKLY_FORTUNE_URL` = <Creator API.QueueWeeklyFortune_v1 endpoint>
- [ ] `ZOHO_CREATOR_PUBLISH_CALLBACK_URL` = <Creator API.PublishCallback_v1 endpoint>
- [ ] `ZOHO_CREATOR_SCHEDULE_QUERY_URL` = <Creator API query pending schedules endpoint>

### 2.5 Workflows
- [ ] LINE inbound → Creator → reply (active)
- [ ] ECPay paid notify → LINE push (active if A1 enabled)

Deployment decision (talisman image delivery):
- [ ] A: Push token URL only (images shown on delivery page)
- [ ] B: Push images in LINE (requires public HTTPS image URLs)
  - [ ] If B: decide storage (Cloudflare R2 / CDN) + URL signing/expiry policy

> n8n CE executions expire quickly → ensure **payment/delivery logs** are persisted in Zoho Creator.

## 3) Zoho Creator variables
Fill these before launch:
- [ ] `thisapp.variables.ECPay.merchantID_Production` = <ECPay MerchantID (Production)>
- [ ] `thisapp.variables.ECPay.hashKey_Production` = <ECPay HashKey (Production)>
- [ ] `thisapp.variables.ECPay.hashIV_Production` = <ECPay HashIV (Production)>

ReturnURL（已知現況 + 必做修補）：
- [ ] Current ReturnURL: `https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return`
- [ ] Ensure this endpoint handler uses **安全版**：`API.ECPayReturn(map ecpay_params)`
  - Runbook: `docs/ECPAY_RETURNURL_PATCH_RUNBOOK.md`

ClientBackURL（optional; we prefer A-flow: push delivery link in LINE):
- [ ] `thisapp.variables.ECPay.ClientBackURL_Production` = <optional>

A1 push delivery link (Creator → n8n webhook):
- [ ] `thisapp.variables.System.N8N.ECPayPaidNotifyURL` = `https://n8n.winds.tw/webhook/ecpay-paid-notify`
- [ ] `thisapp.variables.System.DeliveryPageBaseURL` = <Creator Page URL base, e.g. https://creatorapp/.../talisman>

## 4) Data model
- [ ] `Clients_Report.Line_User_ID` exists and is populated on binding
- [ ] `Talisman_Purchases.Line_User_ID` exists and is populated when creating orders (use CreateTalismanOrder_v2)
- [ ] `Talisman_Purchases.Delivery_Token` + `Delivery_Token_ExpiresAt` exist

