# Launch Environment Checklist (placeholders to fill)

> Goal: Keep all deploy-time URLs/tokens in one place.

## 1) Cloudflare / n8n
- [ ] `n8n.winds.tw` reachable (HTTPS)
- [ ] n8n Production webhook URLs confirmed

## 2) n8n
Environment variables (recommended):
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `ZOHO_CREATOR_PREDICT_URL`
- [ ] Decide delivery mode for talisman images (deployment decision):
  - [ ] A: Push token URL only (images shown on delivery page)
  - [ ] B: Push images in LINE (requires public HTTPS image URLs)
  - [ ] If B: decide storage (Cloudflare R2 / CDN) + URL signing/expiry policy
  - [ ] Ensure **payment/delivery logs** are persisted in Zoho Creator (n8n CE executions expire quickly)

Workflows:
- [ ] LINE inbound → Creator → reply (active)
- [ ] ECPay paid notify webhook (to be added) → LINE push

## 3) Zoho Creator variables
Fill these before launch:
- [ ] `thisapp.variables.ECPay.merchantID_Production` = <ECPay MerchantID (Production)>
- [ ] `thisapp.variables.ECPay.hashKey_Production` = <ECPay HashKey (Production)>
- [ ] `thisapp.variables.ECPay.hashIV_Production` = <ECPay HashIV (Production)>
- [ ] `thisapp.variables.ECPay.ReturnURL_Production` = <PUBLIC URL to Creator API.ECPayReturn>
- [ ] `thisapp.variables.ECPay.ClientBackURL_Production` = <optional; we prefer A-flow (push link in LINE)>

A1 push delivery link (Creator → n8n webhook):
- [ ] `thisapp.variables.System.N8N.ECPayPaidNotifyURL` = https://n8n.winds.tw/webhook/ecpay-paid-notify
- [ ] `thisapp.variables.System.DeliveryPageBaseURL` = <Creator Page URL, e.g. https://creatorapp/.../talisman>

## 4) Data model
- [ ] `Clients_Report.Line_User_ID` exists and is populated on binding
- [ ] `Talisman_Purchases.Line_User_ID` exists and is populated when creating orders (use CreateTalismanOrder_v2)
- [ ] `Talisman_Purchases.Delivery_Token` + `Delivery_Token_ExpiresAt` exist

