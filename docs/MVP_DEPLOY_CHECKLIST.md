# MVP 上線手動操作清單
> 程式碼已就緒。以下是「你需要手動做」的操作，依序執行。
> 預估總時間：3–5 小時（可分兩天）
> 最後更新：2026-03-04（修正編排架構：Zoho Flow 主線 + n8n 備援）

---

## 架構說明

```
編排層優先順序：Creator → Zoho Flow（主線）→ n8n（備援）→ LINE → ECPay

LINE 訊息入口（主線）：
  LINE OA → Zoho Flow Webhook → Creator API.predictFromLine → Flow → LINE Reply

LINE 訊息入口（備援，Flow 額度用盡時切換）：
  LINE OA → n8n Webhook → Creator API.predictFromLine → n8n → LINE Reply

ECPay 付款回呼：
  ECPay → Creator API.ecPayReturn → 驗簽 + 更新訂單
    → POST 到 Zoho Flow Webhook（主線）或 n8n Webhook（備援）→ LINE Push 交付連結
    → Creator 內部直接生成完整報告 + LINE Push 完整解讀

塔羅異步處理：
  Creator → Zoho Flow Webhook（已配置，triggerTarotFlowProcessor）
    → 失敗時自動回退到 LLM 備援（AIInterpreter.getTarotInterpretation）
```

> **為什麼要雙軌？** Zoho Flow 免費/基礎方案有月執行次數限制。
> 正常流量由 Flow 處理，當額度接近上限時，將 LINE Webhook URL 切換到 n8n 即可無縫接續。

---

## ✅ 已自動完成（程式碼已更新 + DS Rewrite 部署完成）

| 項目 | 狀態 | 備註 |
|------|------|------|
| DS Rewrite 全量部署（97 個函數） | ✅ | Phase 1-5 完成（2026-03-01～03-02） |
| `API.predictFromLine` 更新為易經+塔羅兩個都出 | ✅ | `zoho-creator/functions/api/` |
| `API.getTalismanByToken` 新建（Token 驗證後端） | ✅ | `zoho-creator/functions/api/` |
| `TalismanDelivery.htmlpage.deluge` 新建（交付頁 HTML） | ✅ | `zoho-creator/functions/pages/` |
| Custom API 端點建立（4 新端點 + 2 保留 + 7 停用） | ✅ | Phase 4 完成（2026-03-02） |
| LLM 遷移（OpenAI → Claude） | ✅ | 15 函數 + 3 Workflow + LLM 模組 |
| Stage A/B/C 功能增強 | ✅ | 塔羅個人化 + 個性側寫 + 本命塔羅 |
| `n8n.winds.tw` 可達、Cloudflare NS 已生效 | ✅ | HTTP 200 |
| cloudflared launchctl 常駐已確認 | ✅ | PID 821 |

---

## 🔲 Step 0 — 先填 Creator App Variables（~30 分鐘）

> 進入：Zoho Creator → `AI易經` → Settings → App Variables

### 0-A. ECPay 生產金鑰（必填）

| 變數名稱 | 值 | 優先級 |
|---------|-----|--------|
| `ECPay.merchantID_Production` | ECPay 後台商店代號 | 🔴 必填 |
| `ECPay.hashKey_Production` | ECPay 後台 HashKey | 🔴 必填 |
| `ECPay.hashIV_Production` | ECPay 後台 HashIV | 🔴 必填 |

### 0-B. 付款通知 Webhook URL（重新命名 + 填值）

> 此變數原名 `System.N8N_ECPayPaidNotifyURL`，含 "N8N" 字樣造成誤解。
> 實際上此 URL 可指向 Zoho Flow 或 n8n，取決於主線/備援切換狀態。

**操作步驟：**
1. **刪除**舊變數 `System.N8N_ECPayPaidNotifyURL`
2. **新增**變數 `System.ECPayPaidNotifyURL`
3. **填值**：
   - 主線（Zoho Flow）：`<Step 4-A 建完 Flow 後填入 Flow Webhook URL>`
   - 備援（n8n）：`https://n8n.winds.tw/webhook/ecpay-paid-notify`

> ⚠️ 新增後需同步更新 Creator IDE 中 `API.ecPayReturn` 函數的變數引用（見 Step 0-C）。

### 0-C. 更新 `API.ecPayReturn` 變數引用

> 在 Creator IDE 中開啟 `API.ecPayReturn`，搜尋 `N8N_ECPayPaidNotifyURL`，替換為 `ECPayPaidNotifyURL`。

**修改前（2 處）：**
```deluge
notify_url = if(thisapp.variables.System.N8N_ECPayPaidNotifyURL != null,thisapp.variables.System.N8N_ECPayPaidNotifyURL.toString(),"");
```

**修改後：**
```deluge
notify_url = if(thisapp.variables.System.ECPayPaidNotifyURL != null,thisapp.variables.System.ECPayPaidNotifyURL.toString(),"");
```

同時修改同一函數中的註解：
```deluge
// 修改前：
// 3) 付款成功後通知 n8n 推播交付連結（A1）

// 修改後：
// 3) 付款成功後通知編排層推播交付連結（Zoho Flow 主線 / n8n 備援）
```

### 0-D. 其他變數

| 變數名稱 | 值 | 優先級 |
|---------|-----|--------|
| `System.DeliveryPageBaseURL` | (Step 3 建完頁面後填入) | 🟡 Phase 3 後填 |

---

## ✅ Step 1 — 函數已全部部署到 Creator IDE（無需操作）

> DS Rewrite 部署已於 2026-03-01～03-02 完成（Phase 1-5）。
> 97 個函數已在 Creator IDE 中，包含：
> - `API.predictFromLine`（原 `API.PredictFromLine_v1`，已改名部署）
> - `API.getTalismanByToken`（原 `API.GetTalismanByToken`，已改名部署）
> - `API.ecPayReturn`（原 `API.ECPayReturn`，已改名部署）
> - 完整清單見 `zoho-creator/docs/DS_REWRITE_DEPLOY_CHECKLIST.md`

---

## 🔲 Step 2 — ECPay ReturnURL 安全修補（**⚠️ 上線前必做，~15 分鐘**）

> 詳細操作見：`docs/ECPAY_RETURNURL_PATCH_RUNBOOK.md`

簡版：
1. 確認 Creator IDE 中 `API.ecPayReturn(map ecpay_params)` 是**安全版**（有驗簽）
2. 進 Microservices → Custom API → `ecPayReturn` → 確認 handler = `API.ecPayReturn`
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

### 3-B. 確認 Custom API endpoint 已存在
> 此端點已在 DS Rewrite Phase 4 建立，僅需確認：
1. Microservices → Custom API → 找到 `getTalismanByToken`
2. 確認 Handler = `API.getTalismanByToken`，Method = POST

### 3-C. 填入 DeliveryPageBaseURL
- 取得頁面 URL，格式類似：
  `https://creatorapp.zoho.com/uneedwind/ai/page/TalismanDelivery`
- 填入 App Variable：`System.DeliveryPageBaseURL`

---

## 🔲 Step 4 — 編排層設定：Zoho Flow（主線）+ n8n（備援）（~1 小時）

### 4-A. Zoho Flow 設定（主線，~30 分鐘）

#### Flow 1：LINE Webhook 接收 + 轉發 Creator + 回覆 LINE

> 在 Zoho Flow 中建立新的 Flow：

| 設定項 | 值 |
|--------|-----|
| Flow 名稱 | `LINE Webhook → Creator → Reply` |
| 觸發器 | Webhook（接收 POST） |
| Webhook URL | （建立後自動產生，記下來） |

**Flow 步驟：**
1. **觸發器**：Webhook（接收 LINE Messaging API POST）
2. **Custom Function / Script**：解析 LINE Events
   ```
   replyToken = body.events[0].replyToken
   lineUserId = body.events[0].source.userId
   text = body.events[0].message.text
   timestamp = body.events[0].timestamp
   ```
3. **API Call**：POST 到 Creator Custom API
   - URL：`https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine`
   - Body：`{ "lineUserId": <lineUserId>, "text": <text>, "timestamp": <timestamp> }`
   - Auth：Zoho OAuth（Creator connection）
4. **判斷**：解析 Creator 回應
   - `ok == true` → 回覆 LINE
   - `blocked == true` → 回覆 blocked 訊息
5. **API Call**：回覆 LINE
   - URL：`https://api.line.me/v2/bot/message/reply`
   - Header：`Authorization: Bearer <LINE_CHANNEL_ACCESS_TOKEN>`
   - Body：`{ "replyToken": <replyToken>, "messages": [{ "type": "text", "text": <message> }] }`

#### Flow 2：ECPay 付款通知 → LINE Push 交付連結

| 設定項 | 值 |
|--------|-----|
| Flow 名稱 | `ECPay Paid → LINE Push Delivery` |
| 觸發器 | Webhook（接收 POST） |
| Webhook URL | （建立後自動產生，記下來） |

**Flow 步驟：**
1. **觸發器**：Webhook（接收 Creator `ecPayReturn` 的 POST）
   - Payload：`{ lineUserId, merchantTradeNo, deliveryToken, deliveryUrl }`
2. **判斷**：`lineUserId` 和 `deliveryUrl` 不為空
3. **API Call**：Push 到 LINE
   - URL：`https://api.line.me/v2/bot/message/push`
   - Header：`Authorization: Bearer <LINE_CHANNEL_ACCESS_TOKEN>`
   - Body：
     ```json
     {
       "to": "<lineUserId>",
       "messages": [{
         "type": "text",
         "text": "付款完成✅ 交付連結（7天內有效）：\n<deliveryUrl>"
       }]
     }
     ```

#### Flow 完成後設定：

1. **填入 App Variable**：
   - `System.ECPayPaidNotifyURL` = Flow 2 的 Webhook URL
2. **設定 LINE Official Account**：
   - LINE Developers Console → Messaging API → Webhook URL = **Flow 1 的 Webhook URL**
   - 確認 Webhook 已啟用（Use webhook = Enabled）
3. **啟動** 兩個 Flow

### 4-B. n8n 環境設定（備援，~30 分鐘）

> n8n 作為備援，在 Zoho Flow 額度用盡時切換使用。
> 平時保持 Workflow 為 **Active** 狀態但不接收流量（LINE Webhook URL 指向 Flow）。

#### 4-B-1. 環境變數（docker compose .env 或 n8n 後台設定）
```
LINE_CHANNEL_ACCESS_TOKEN=<LINE Messaging API channel access token>
ZOHO_CREATOR_PREDICT_URL=https://www.zohoapis.com/creator/custom/uneedwind/predictFromLine
WEBHOOK_URL=https://n8n.winds.tw
N8N_HOST=n8n.winds.tw
N8N_PROTOCOL=https
```

#### 4-B-2. Zoho Creator OAuth2 Credential
- 在 n8n → Credentials → 新增 `Zoho Creator OAuth2` credential
- 填入 Zoho OAuth client ID / secret

#### 4-B-3. Import + Activate Workflows
1. 進 n8n → Workflows → Import
2. 匯入：`n8n/workflows/LINE_Webhook__Reply.json`
3. 匯入：`n8n/workflows/ECPay_Paid_Notify__LINE_Push.json`
4. **重要**：import 後預設 deactivated，需手動點 Active
5. 確認 n8n LINE Webhook endpoint：`https://n8n.winds.tw/webhook/line-webhook`
6. 確認 n8n ECPay Webhook endpoint：`https://n8n.winds.tw/webhook/ecpay-paid-notify`

> ⚠️ **不要** 在此時設定 LINE Official Account Webhook URL 指向 n8n。
> LINE Webhook URL 應指向 Zoho Flow（主線）。僅在 Flow 額度用盡時，手動切換到 n8n。

### 4-C. 主線/備援切換操作手冊

> 當 Zoho Flow 月額度即將用盡時，依以下步驟切換到 n8n 備援：

| 步驟 | 操作 | 說明 |
|------|------|------|
| 1 | LINE OA → Webhook URL | 改為 `https://n8n.winds.tw/webhook/line-webhook` |
| 2 | Creator App Variable → `System.ECPayPaidNotifyURL` | 改為 `https://n8n.winds.tw/webhook/ecpay-paid-notify` |
| 3 | 確認 n8n 服務正常 | 瀏覽 `https://n8n.winds.tw` 確認可達 |

> 下個月額度重置後，反向操作切回 Zoho Flow：
> 1. LINE OA Webhook URL → 改回 Flow 1 的 Webhook URL
> 2. `System.ECPayPaidNotifyURL` → 改回 Flow 2 的 Webhook URL

---

## 🔲 Step 5 — 端到端驗收（~30–60 分鐘）

依 `docs/MDP_RUNBOOK.md` §5 逐項確認：

```
□ LINE 送任意問題 → 收到免費結果（易經+塔羅各一份）
□ 冷卻觸發：LINE 送相同問題（24h內）→ 只收安撫短文
□ 結果中有 CTA（購買符令連結或說明）
□ 點購買 → ECPay 付款表單正常顯示
□ 測試付款成功 → Creator Talisman_Purchases 狀態 = Paid
□ LINE 收到 Token URL push（交付連結）
□ 打開 URL → 顯示符令內容（名稱＋說明）
□ ECPay callback 重送：不重複建單、不重複交付
```

### 額外驗收（Flow/n8n 雙軌）

```
□ 確認 Flow 1（LINE Webhook）正常運作：LINE 問題 → 收到回覆
□ 確認 Flow 2（ECPay Push）正常運作：付款 → LINE 收到交付連結
□ 切換到 n8n 備援：LINE Webhook URL → n8n → 同樣流程正常
□ 切回 Zoho Flow：LINE Webhook URL → Flow → 同樣流程正常
```

---

## 最快上線路徑摘要

```
今天（2 小時）：
  Step 0: 填 Creator variables（需 ECPay 生產金鑰）+ 變數重命名
  Step 0-C: 更新 ecPayReturn 變數引用
  Step 2: ECPay ReturnURL 安全修補（15 分鐘）

明天前半天（2 小時）：
  Step 3: 建立交付頁 + 確認 endpoint
  Step 4-A: Zoho Flow 設定（建立 2 個 Flow + LINE Webhook 指向 Flow）
  Step 4-B: n8n 備援設定

明天下午（1 小時）：
  Step 5: 端到端驗收（含 Flow/n8n 雙軌切換測試）

→ 預計 2 個工作天內可完成 MVP 上線
```

---

## 風險提醒

| 風險 | 處理方式 |
|------|---------|
| ECPay 生產金鑰未申請 | 先用測試環境跑通流程，確認一切 OK 後再換生產金鑰 |
| 「兩個都出」訊息太長 LINE 截斷 | 第一次測試就能發現，將 predictFromLine 內的截斷字數調小（目前 4300 字） |
| Creator IDE 白畫面 | 刷新重進，分段貼；參考 CREATOR_A_ROUTE_RUNBOOK.md |
| Zoho Flow 月額度用盡 | 切換到 n8n 備援（見 Step 4-C 切換手冊） |
| Zoho Flow Webhook 回應超時 | Flow 內設定合理 timeout（建議 30 秒），失敗時 LINE OA 不會重送 |
| Zoho OAuth2 授權失敗（n8n） | n8n 重新做 OAuth 授權流程 |
| n8n 本地部署不穩定 | cloudflared tunnel 需持續監控；`launchctl list | grep cloudflare` |

---

## 附錄：已完成項目參考

> 以下項目已在 DS Rewrite 部署期間完成，不需重複操作。

| 項目 | 完成日期 | 參考文件 |
|------|---------|---------|
| 97 函數部署到 Creator IDE | 2026-03-02 | `zoho-creator/docs/DS_REWRITE_DEPLOY_CHECKLIST.md` |
| 4 新 Custom API 端點 | 2026-03-02 | Phase 4：bindLineUser, predictFromLine, ecPayReturn, getTalismanByToken |
| 7 SalesIQ 端點停用 | 2026-03-02 | Phase 4 |
| 32 舊函數刪除 | 2026-03-02 | Phase 5 |
| OpenAI → Claude LLM 遷移 | 2026-03-02 | 15 函數 + 3 Workflow |
| 塔羅個人化（Stage A） | 2026-03-04 | persona + 主副卦分析 |
| 個性側寫自動化（Stage B） | 2026-03-04 | generatePersonalityProfile + Workflow |
| 本命塔羅驗證（Stage C） | 2026-03-04 | getLifePathTarot + Workflow 修正 |
| OnPaymentSuccess 第4參數 | 2026-03-04 | DS L22024 + Creator UI 更新 |
