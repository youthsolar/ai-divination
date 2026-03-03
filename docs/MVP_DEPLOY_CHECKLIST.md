# MVP 上線手動操作清單
> 程式碼已就緒。以下是「你需要手動做」的操作，依序執行。
> 預估總時間：3–5 小時（可分兩天）

---

## ✅ 已自動完成（程式碼已更新）

| 項目 | 狀態 | 備註 |
|------|------|------|
| `API.PredictFromLine_v1.deluge` 更新為易經+塔羅兩個都出 | ✅ | `zoho-creator/functions/api/` |
| `API.GetTalismanByToken.deluge` 新建（Token 驗證後端） | ✅ | `zoho-creator/functions/api/` |
| `TalismanDelivery.htmlpage.deluge` 新建（交付頁 HTML） | ✅ | `zoho-creator/functions/pages/` |
| `n8n.winds.tw` 可達、Cloudflare NS 已生效 | ✅ | HTTP 200 |
| cloudflared launchctl 常駐已確認 | ✅ | PID 821 |

---

## 🔲 Step 0 — 先填 Creator App Variables（~30 分鐘）

> 進入：Zoho Creator → `AI易經` → Settings → App Variables

| 變數名稱 | 值 | 優先級 |
|---------|-----|--------|
| `ECPay.merchantID_Production` | ECPay 後台商店代號 | 🔴 必填 |
| `ECPay.hashKey_Production` | ECPay 後台 HashKey | 🔴 必填 |
| `ECPay.hashIV_Production` | ECPay 後台 HashIV | 🔴 必填 |
| `System.N8N.ECPayPaidNotifyURL` | `https://n8n.winds.tw/webhook/ecpay-paid-notify` | 🔴 必填 |
| `System.DeliveryPageBaseURL` | (Step 3 建完頁面後填入) | 🟡 Phase 3 後填 |

---

## 🔲 Step 1 — 上傳函數到 Creator IDE（~1–2 小時）

> 操作方式：Zoho Creator → `AI易經` → Settings → Application IDE → Custom Functions
> 每支函數：找到 → 全選覆蓋貼上 → Save → 用 mock input 測試

### 1-A. 上傳 `API.PredictFromLine_v1`（**最優先**）
- **來源**：`zoho-creator/functions/api/API.PredictFromLine_v1.deluge`
- 在 IDE 中找到 group `API` → function `API.PredictFromLine_v1`
- 全段覆蓋貼入 → Save
- **驗收**：用 mock `{ lineUserId: "U123", text: "我該換工作嗎？", timestamp: 1234567890 }` 執行
  - 預期：若 lineUserId 無對應 client → 回 `blocked: true, reason: "missing_client_binding"`

### 1-B. 上傳 `API.GetTalismanByToken`（新建）
- **來源**：`zoho-creator/functions/api/API.GetTalismanByToken.deluge`
- 在 IDE 的 group `API` 下**新建** function `API.GetTalismanByToken`
- 全段貼入 → Save
- **驗收**：用 mock `{ token: "" }` 執行 → 預期 `{ ok: false, reason: "missing_token" }`

### 1-C. 確認 `API.ECPayReturn` 已在 IDE（無需改）
- 已確認在 DS 中完整，確認 IDE 版本與 DS 一致即可（見 Step 2）

---

## 🔲 Step 2 — ECPay ReturnURL 安全修補（**⚠️ 上線前必做，~15 分鐘**）

> 詳細操作見：`docs/ECPAY_RETURNURL_PATCH_RUNBOOK.md`

簡版：
1. 確認 Creator IDE 中 `API.ECPayReturn(map ecpay_params)` 是**安全版**（有驗簽）
2. 進 Microservices → Custom API → `handle_ecpay_return` → 確認 handler = `API.ECPayReturn`
3. 用 mock 參數觸發：CheckMacValue 錯 → `0|FAIL`；對單成功 → token 生成 ✅

---

## 🔲 Step 3 — 建立符令交付頁（~30 分鐘）

### 3-A. 建立 Creator Page
1. Zoho Creator → `AI易經` → Pages → 新增 Page
2. Page 名稱：`TalismanDelivery`
3. 加入 HTML Snippet 元件
4. 貼入 `zoho-creator/functions/pages/TalismanDelivery.htmlpage.deluge` 的 HTML 內容
   （從 `<!DOCTYPE html>` 到 `</html>` 之間的部分）
5. Save/Publish

### 3-B. 建立 Custom API endpoint
1. Microservices → Custom API → 新增 endpoint
2. Endpoint name：`get_talisman_by_token`
3. Handler：`API.GetTalismanByToken`
4. Method：POST

### 3-C. 填入 DeliveryPageBaseURL
- 取得頁面 URL，格式類似：
  `https://creatorapp.zoho.com/uneedwind/ai/page/TalismanDelivery`
- 填入 App Variable：`System.DeliveryPageBaseURL`

---

## 🔲 Step 4 — n8n 環境設定（~30 分鐘）

### 4-A. 環境變數（docker compose .env 或 n8n 後台設定）
```
LINE_CHANNEL_ACCESS_TOKEN=<LINE Messaging API channel access token>
ZOHO_CREATOR_PREDICT_URL=<Creator Custom API endpoint URL for API.PredictFromLine_v1>
WEBHOOK_URL=https://n8n.winds.tw
N8N_HOST=n8n.winds.tw
N8N_PROTOCOL=https
```

> `ZOHO_CREATOR_PREDICT_URL` 格式：
> `https://www.zohoapis.com/creator/custom/uneedwind/<endpoint_name>`

### 4-B. Zoho Creator OAuth2 Credential
- 在 n8n → Credentials → 新增 `Zoho Creator OAuth2` credential
- 填入 Zoho OAuth client ID / secret

### 4-C. Import + Activate Workflows
1. 進 n8n → Workflows → Import
2. 匯入：`n8n/workflows/LINE_Webhook__Reply.json`
3. 匯入：`n8n/workflows/ECPay_Paid_Notify__LINE_Push.json`
4. **重要**：import 後預設 deactivated，需手動點 Active
5. 確認 LINE Webhook endpoint：`https://n8n.winds.tw/webhook/line-webhook`
6. 設定 LINE Official Account → Webhook URL = `https://n8n.winds.tw/webhook/line-webhook`

---

## 🔲 Step 5 — 端到端驗收（~30–60 分鐘）

依 `docs/MDP_RUNBOOK.md` §5 逐項確認：

```
□ LINE 送任意問題 → 收到免費結果（易經+塔羅各一份）
□ 冷卻觸發：LINE 送相同問題（24h內）→ 只收安撫短文
□ 結果中有 CTA（購買符令連結或說明）
□ 點購買 → ECPay 付款表單正常顯示
□ 測試付款成功 → Creator Talisman_Purchases 狀態 = Paid
□ LINE 收到 Token URL push
□ 打開 URL → 顯示符令內容（名稱＋說明）
□ ECPay callback 重送：不重複建單、不重複交付
```

---

## 最快上線路徑摘要

```
今天（3 小時）：
  Step 0: 填 Creator variables（需 ECPay 生產金鑰）
  Step 2: ECPay ReturnURL 安全修補（15 分鐘）
  Step 1-A: 上傳 API.PredictFromLine_v1 到 Creator IDE

明天前半天（2 小時）：
  Step 1-B: 上傳 API.GetTalismanByToken
  Step 3: 建立交付頁 + endpoint
  Step 4: n8n 環境設定 + Workflow activate

明天下午（1 小時）：
  Step 5: 端到端驗收

→ 預計 2 個工作天內可完成 MVP 上線
```

---

## 風險提醒

| 風險 | 處理方式 |
|------|---------|
| ECPay 生產金鑰未申請 | 先用測試環境跑通流程，確認一切 OK 後再換生產金鑰 |
| 「兩個都出」訊息太長 LINE 截斷 | 第一次測試就能發現，將 PredictFromLine_v1 內的截斷字數調小（目前 4300 字） |
| Creator IDE 白畫面 | 刷新重進，分段貼；參考 CREATOR_A_ROUTE_RUNBOOK.md |
| Zoho OAuth2 授權失敗 | n8n 重新做 OAuth 授權流程 |
