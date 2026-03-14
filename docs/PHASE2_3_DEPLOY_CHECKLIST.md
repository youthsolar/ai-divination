# Phase 2+3 部署清單 — SimplyBook + EasyStore + LLM 推薦引擎

> **專案**：找風問幸福 (winds.tw / winds.life) — AI 占卜平台
> **版本**：v1.0 | 2026-03-14
> **前提**：Phase 1 (MVP) 已上線 — LINE 免費占卜 + 數位符令銷售 (NT$360/張, ECPay)
> **對照**：`docs/BOOKING_SALES_STRATEGY.md` — 完整策略規劃文件
> **程式碼 commit**：`7150805` — feat: Phase 2+3 — LLM 推薦引擎 + SimplyBook/EasyStore 整合 + n8n 工作流
> **預估總時間**：6–10 小時（可分三天執行，依部署順序逐步進行）

---

## 架構說明

```
Phase 2+3 新增架構：

LLM 推薦引擎（Phase 2A）：
  占卜完成 → Service_Catalog 預篩（Target_Question_Types）
  → LLM.recommendNextAction（Haiku 語義比對）
  → 動態 next_action（smart_recommend）
  → LIFF 推薦卡片 + LINE push 推薦訊息

SimplyBook 預約閉環（Phase 2B）：
  SB Webhook → n8n → Creator API.handleSimplyBookWebhook
  → Booking_Logs + LINE push 預約確認

EasyStore 商品閉環（Phase 3）：
  ES Webhook → n8n → Creator API.handleEasyStoreWebhook
  → Product_Orders + LINE push 訂單通知
  → LIFF redirect.html 中間頁追蹤

SEO 清洗流程（Phase 2C）：
  SB/ES 原始資料 → n8n 拉取 → Creator Service_Catalog
  → LLM SEO 加工 → 人工審核 → n8n 回寫 SB/ES
```

---

## 程式碼校對摘要（2026-03-14）

### 一致性：高

所有 Deluge 函數（C-06 ~ C-13）和 n8n 工作流（N-02 ~ N-09）的架構、參數、API 呼叫流程均與 `BOOKING_SALES_STRATEGY.md` 一致。

### 需修復的 3 個問題（上線前必修）

| # | 問題 | 嚴重度 | 位置 | 說明 |
|---|------|--------|------|------|
| BUG-1 | C-07 缺少 `CRM.syncContact` 呼叫 | 中 | `API.handleSimplyBookWebhook.deluge` L244 之後 | 策略計畫 §4.4 明確要求「呼叫 CRM.syncContact（已有邏輯）」，程式碼完全遺漏（連 TODO 都沒有） |
| BUG-2 | C-12 / C-13 缺少外部 API 錯誤檢查 | 中 | `API.pushCatalogToSB.deluge` L131, `API.pushCatalogToES.deluge` L91 | `editEvent` / `PUT /products` 回應不管成功失敗都回 `success: true`，應檢查回應 HTTP status 或 JSON-RPC error |
| BUG-3 | N-05 缺少事件類型分流 | 低 | `EasyStore_Webhook__Order_Sync.json` | `event_type` 有解析但沒有 Switch 節點分流 `orders/create` vs `orders/paid` vs `orders/fulfilled` |

### 系統性 TODO（預期中，表建立後解決）

所有 Deluge 函數中涉及 `Service_Catalog`、`Booking_Logs`、`Product_Orders`、`Recommendation_Logs` 的 DB 寫入邏輯**皆被註解**（`/* TODO: 表尚未建立 */`）。這些需要在 Step 1（建表）完成後**逐一解除註解**。

涉及函數：C-07、C-08、C-09、C-10、C-11、C-12、C-13

---

## ✅ 已自動完成（程式碼已 push）

| 項目 | 檔案 | 狀態 | 備註 |
|------|------|------|------|
| C-06 LLM.recommendNextAction | `zoho-creator/functions/llm/LLM.recommendNextAction.deluge` | ✅ | 170 行，完全匹配計畫 §3.2 |
| C-07 API.handleSimplyBookWebhook | `zoho-creator/functions/api/API.handleSimplyBookWebhook.deluge` | ⚠️ | 262 行，缺 CRM.syncContact（BUG-1） |
| C-08 API.handleEasyStoreWebhook | `zoho-creator/functions/api/API.handleEasyStoreWebhook.deluge` | ✅ | 211 行，額外加了 LINE push（合理） |
| C-09 API.trackRecommendationClick | `zoho-creator/functions/api/API.trackRecommendationClick.deluge` | ✅ | 94 行 |
| C-10 API.syncCatalogFromSB | `zoho-creator/functions/api/API.syncCatalogFromSB.deluge` | ✅ | 130 行 |
| C-11 API.syncCatalogFromES | `zoho-creator/functions/api/API.syncCatalogFromES.deluge` | ✅ | 125 行 |
| C-12 API.pushCatalogToSB | `zoho-creator/functions/api/API.pushCatalogToSB.deluge` | ⚠️ | 149 行，缺 API 回應錯誤檢查（BUG-2） |
| C-13 API.pushCatalogToES | `zoho-creator/functions/api/API.pushCatalogToES.deluge` | ⚠️ | 109 行，缺 API 回應錯誤檢查（BUG-2） |
| C-14 API.liffDivinationMvp 修改 | `zoho-creator/functions/api/API.liffDivinationMvp.deluge` | ✅ | V2 版，含三層選題 + CRM Leads |
| 額外：API.getClientByLineUID | `zoho-creator/functions/api/API.getClientByLineUID.deluge` | ✅ | 78 行，LIFF 預填用 |
| 額外：API.liffGetLatestStatus | `zoho-creator/functions/api/API.liffGetLatestStatus.deluge` | ✅ | 84 行，LIFF 非同步 polling 用 |
| N-02 SimplyBook_Webhook__Booking_Sync | `n8n/workflows/SimplyBook_Webhook__Booking_Sync.json` | ✅ | 5 節點，完全匹配 |
| N-03 SB_Pull_Services | `n8n/workflows/SB_Pull_Services.json` | ✅ | 5 節點，每日 06:00 排程 |
| N-04 SB_Push_Description | `n8n/workflows/SB_Push_Description.json` | ✅ | 6 節點，Manual trigger |
| N-05 EasyStore_Webhook__Order_Sync | `n8n/workflows/EasyStore_Webhook__Order_Sync.json` | ⚠️ | 缺事件分流（BUG-3） |
| N-06 ES_Pull_Products | `n8n/workflows/ES_Pull_Products.json` | ✅ | 4 節點，每日 06:30 排程 |
| N-08 Catalog_SEO_Generate | `n8n/workflows/Catalog_SEO_Generate.json` | ✅ | 6 節點，Haiku max_tokens=800 temp=0.5 |
| N-09 Booking_Reminder__LINE_Push | `n8n/workflows/Booking_Reminder__LINE_Push.json` | ✅ | 6 節點，每小時排程 |
| L-02 redirect.html | `liff/redirect.html` | ✅ | 248 行，含 LIFF 初始化 + 追蹤 + fallback |

---

## 🔲 Step 0 — Creator App Variables 設定（~20 分鐘）

> 在 Creator 後台 → Settings → App Variables 新增以下變數。
> 對應策略計畫 §12.1-D (C-16 ~ C-23)。

### SimplyBook 憑證

| Variable Path | 用途 | 取得方式 |
|---------------|------|----------|
| `SimplyBook.Company_Login` | SB 公司代碼 | SimplyBook 後台 → Settings |
| `SimplyBook.API_Key` | SB API Key（讀取用 token） | SimplyBook → Custom Features → API → API Key |
| `SimplyBook.Admin_Username` | SB 管理帳號 | 你的 SimplyBook 登入帳號 |
| `SimplyBook.Admin_Password` | SB 管理密碼 | 你的 SimplyBook 登入密碼 |
| `SimplyBook.Webhook_Secret` | SB Webhook 驗證密鑰 | SimplyBook → Custom Features → Webhooks |

### EasyStore 憑證

| Variable Path | 用途 | 取得方式 |
|---------------|------|----------|
| `EasyStore.Shop_URL` | ES 商店 URL（不含 https://） | 例：`winds.easy.co` |
| `EasyStore.Access_Token` | ES OAuth Access Token | EasyStore Developer Platform → App → OAuth |

### LLM 推薦引擎

| Variable Path | 用途 | 預設值 |
|---------------|------|--------|
| `LLM.Recommendation_Model` | 推薦引擎專用模型 | `claude-haiku-4-5-20251001` |

---

## 🔲 Step 1 — Creator 建立 5 張表（~60 分鐘）

> 在 Creator 後台 → Forms → New Form 建立以下表。
> 對應策略計畫 §12.1-A (C-01 ~ C-05)。
> **這是最高優先**，所有函數的 DB 寫入邏輯都依賴這些表。

### C-01：`Service_Catalog`（統一目錄表，24 欄位）

> 完整欄位定義見 `BOOKING_SALES_STRATEGY.md` §2.1

| 欄位 | 類型 | 必要 | 說明 |
|------|------|------|------|
| `Source` | Picklist | ✅ | 選項：`SimplyBook` / `EasyStore` / `Talisman` |
| `External_ID` | Single Line | ✅ | SB service ID 或 ES product handle |
| `Name` | Single Line | ✅ | 項目/商品名稱 |
| `Category` | Multi Select | | 分類標籤 |
| `Purpose` | Multi Line | | 目的說明 |
| `Functions` | Multi Line | | 功能說明 |
| `Specifications` | Multi Line | | 規格/條件 |
| `Target_Question_Types` | Multi Select | | 選項：愛情/婚姻/工作/財運/健康/入煞/其他 |
| `Target_Situations` | Multi Line | | 適用情境描述 |
| `Price` | Decimal | | TWD |
| `Booking_URL` | URL | | SB 預約連結 |
| `Product_URL` | URL | | ES 商品連結 |
| `Provider_Name` | Single Line | | 老師名稱 |
| `Image_URL` | URL | | 圖片連結 |
| `Priority_Score` | Number | | 排序權重 |
| `Active` | Checkbox | | 是否啟用 |
| `LLM_Description` | Multi Line | | 給 LLM 的一段式描述 |
| `Raw_Description` | Multi Line | | SB/ES 原始描述 |
| `SEO_Title` | Single Line | | |
| `SEO_Description` | Single Line | | |
| `SEO_Keywords` | Single Line | | |
| `OG_Title` | Single Line | | |
| `OG_Description` | Single Line | | |
| `Cleaned_Description` | Multi Line | | 洗過的正式描述 |
| `Last_Synced_From` | DateTime | | 上次拉取時間 |
| `Last_Synced_To` | DateTime | | 上次回寫時間 |
| `Sync_Status` | Picklist | | 選項：`pending` / `draft` / `rejected` / `pending_sync` / `synced` / `conflict` |

### C-02：`Recommendation_Logs`（推薦追蹤，13 欄位）

> 完整欄位見 `BOOKING_SALES_STRATEGY.md` §9.3

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Divination_Log_Link` | Lookup → Divination_Logs | |
| `Line_User_ID` | Single Line | |
| `Catalog_Items_Shown` | Multi Line | 推薦的 catalog_id 清單 (JSON) |
| `LLM_Response_Raw` | Multi Line | LLM 原始回應 |
| `Primary_Catalog_ID` | Single Line | |
| `Primary_Reason` | Single Line | |
| `Primary_Urgency` | Picklist | 選項：`high` / `medium` / `low` |
| `Recommended_At` | DateTime | |
| `Clicked_At` | DateTime | nullable |
| `Clicked_Catalog_ID` | Single Line | nullable |
| `Converted_At` | DateTime | nullable |
| `Conversion_Type` | Picklist | 選項：`talisman` / `booking` / `product`，nullable |

### C-03：`Booking_Logs`（預約紀錄，16 欄位）

> 完整欄位見 `BOOKING_SALES_STRATEGY.md` §9.2

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Booking_ID` | Single Line (unique) | SimplyBook 預約 ID |
| `Client_Link` | Lookup → Clients_Report | |
| `Line_User_ID` | Single Line | |
| `Provider_Name` | Single Line | 老師名稱 |
| `Provider_ID` | Single Line | SB provider ID |
| `Service_Name` | Single Line | 預約項目 |
| `Service_ID` | Single Line | SB service ID |
| `Booking_DateTime` | DateTime | 預約時間 |
| `Status` | Picklist | 選項：待確認/已確認/已完成/已取消/未到 |
| `Source_Divination_Log` | Lookup → Divination_Logs | nullable |
| `Recommendation_Source` | Picklist | 選項：`auto_trigger` / `manual` / `rich_menu` |
| `SimplyBook_Raw` | Multi Line | 原始 webhook JSON |
| `Price` | Decimal | |
| `Created_At` | DateTime | |
| `Updated_At` | DateTime | |

### C-04：`Teachers`（老師主檔，7 欄位）

> 完整欄位見 `BOOKING_SALES_STRATEGY.md` §9.4

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Name` | Single Line | |
| `SimplyBook_Provider_ID` | Single Line | |
| `Specialty_Question_Types` | Multi Select | 選項：愛情/婚姻/工作/財運/健康/入煞 |
| `Description` | Multi Line | |
| `Photo_URL` | URL | |
| `Active` | Checkbox | |
| `Sort_Order` | Number | |

### C-05：`Product_Orders`（ES 訂單，11 欄位）

> 完整欄位見 `BOOKING_SALES_STRATEGY.md` §9.5

| 欄位 | 類型 | 說明 |
|------|------|------|
| `EasyStore_Order_ID` | Single Line (unique) | |
| `Client_Link` | Lookup → Clients_Report | nullable |
| `Line_User_ID` | Single Line | nullable |
| `Customer_Email` | Email | |
| `Order_Total` | Decimal | |
| `Order_Status` | Picklist | 選項：`pending` / `paid` / `shipped` / `completed` / `cancelled` |
| `Items_Summary` | Single Line | JSON 或逗號分隔 |
| `Recommendation_Link` | Lookup → Recommendation_Logs | nullable |
| `EasyStore_Raw` | Multi Line | |
| `Created_At` | DateTime | |
| `Updated_At` | DateTime | |

### ✅ 建表完成後立即執行

**解除 Deluge 函數中的 DB 寫入註解**。共 7 個函數需修改：

| 函數 | 檔案 | 要解除的區塊 |
|------|------|-------------|
| C-07 | `API.handleSimplyBookWebhook.deluge` | 行 177-219：`Booking_Logs` insert |
| C-08 | `API.handleEasyStoreWebhook.deluge` | 行 127-146：`Product_Orders` insert；行 174-190：`Recommendation_Logs` update |
| C-09 | `API.trackRecommendationClick.deluge` | 行 55-78：`Recommendation_Logs` update |
| C-10 | `API.syncCatalogFromSB.deluge` | 行 72-113：`Service_Catalog` upsert |
| C-11 | `API.syncCatalogFromES.deluge` | 行 71-108：`Service_Catalog` upsert |
| C-12 | `API.pushCatalogToSB.deluge` | 行 28-54：`Service_Catalog` read；行 131-139：`Sync_Status` update |
| C-13 | `API.pushCatalogToES.deluge` | 行 28-54：`Service_Catalog` read；行 91-99：`Sync_Status` update |

操作方式：移除 `/* ... */` 包裝，刪除底下的 `info "[PLACEHOLDER]..."` 那行和上方的模擬 Map 賦值。

---

## 🔲 Step 2 — Creator 部署 Deluge 函數（~40 分鐘）

> 在 Creator → Developer Space → Functions 建立/更新以下函數。
> 每個函數完成後建立對應的 Custom API endpoint。

### 2a：新增函數（8 個）

| # | 函數名稱 | 原始碼路徑 | 行數 | 函數類型 | Custom API？ |
|---|----------|-----------|------|----------|-------------|
| C-06 | `LLM.recommendNextAction` | `zoho-creator/functions/llm/LLM.recommendNextAction.deluge` | 170 | Standalone | ❌（內部呼叫） |
| C-07 | `API.handleSimplyBookWebhook` | `zoho-creator/functions/api/API.handleSimplyBookWebhook.deluge` | 262 | Standalone | ✅ POST |
| C-08 | `API.handleEasyStoreWebhook` | `zoho-creator/functions/api/API.handleEasyStoreWebhook.deluge` | 211 | Standalone | ✅ POST |
| C-09 | `API.trackRecommendationClick` | `zoho-creator/functions/api/API.trackRecommendationClick.deluge` | 94 | Standalone | ✅ POST |
| C-10 | `API.syncCatalogFromSB` | `zoho-creator/functions/api/API.syncCatalogFromSB.deluge` | 130 | Standalone | ✅ POST |
| C-11 | `API.syncCatalogFromES` | `zoho-creator/functions/api/API.syncCatalogFromES.deluge` | 125 | Standalone | ✅ POST |
| C-12 | `API.pushCatalogToSB` | `zoho-creator/functions/api/API.pushCatalogToSB.deluge` | 149 | Standalone | ✅ POST |
| C-13 | `API.pushCatalogToES` | `zoho-creator/functions/api/API.pushCatalogToES.deluge` | 109 | Standalone | ✅ POST |

### 2b：額外輔助函數（2 個，已 push）

| # | 函數名稱 | 原始碼路徑 | 行數 | Custom API？ |
|---|----------|-----------|------|-------------|
| — | `API.getClientByLineUID` | `zoho-creator/functions/api/API.getClientByLineUID.deluge` | 78 | ✅ GET（LIFF 預填） |
| — | `API.liffGetLatestStatus` | `zoho-creator/functions/api/API.liffGetLatestStatus.deluge` | 84 | ✅ GET（LIFF polling） |

### 2c：修改現有函數（1 個）

| # | 函數名稱 | 修改內容 |
|---|----------|----------|
| C-14 | `API.liffDivinationMvp` | 已升級至 V2（三層選題 + CRM Leads + V2 欄位）。`next_action` 目前仍為固定 `offer_unlock`（行 241-246），需待 C-06 部署後修改為動態推薦。詳見 `BOOKING_SALES_STRATEGY.md` §3.3 |

### Custom API 建立步驟

1. Creator → Settings → Developer Space → Custom API
2. 點選 **+ New**
3. 填入：
   - **API Name**：函數名稱（去掉命名空間前綴），例如 `handleSimplyBookWebhook`
   - **HTTP Method**：依上表（POST 或 GET）
   - **Linked Function**：選擇對應函數
4. 建立後記下 **Public Key**（n8n 工作流的 placeholder 需要填入）

### 需記錄的 Public Keys（供 Step 3 填入 n8n）

| API 端點 | 對應 n8n placeholder |
|----------|---------------------|
| `handleSimplyBookWebhook` | `__SB_WEBHOOK_PUBLIC_KEY__` |
| `handleEasyStoreWebhook` | `__ES_WEBHOOK_PUBLIC_KEY__` |
| `syncCatalogFromSB` | `__SYNC_CATALOG_SB_PUBLIC_KEY__` |
| `syncCatalogFromES` | `__SYNC_CATALOG_ES_PUBLIC_KEY__` |
| `trackRecommendationClick` | （redirect.html 使用，非 n8n） |
| 額外需建立的 n8n 用端點（未在函數列表中） | |
| `getPendingSyncRecords`（Source+Sync_Status 查詢） | `__GET_PENDING_SYNC_PUBLIC_KEY__` |
| `updateSyncStatus`（更新 Sync_Status） | `__UPDATE_SYNC_STATUS_PUBLIC_KEY__` |
| `getPendingCatalogRecords`（Sync_Status=pending 查詢） | `__GET_PENDING_CATALOG_PUBLIC_KEY__` |
| `updateCatalogSEO`（更新 SEO 欄位） | `__UPDATE_CATALOG_SEO_PUBLIC_KEY__` |
| `getUpcomingBookings`（24h 內已確認預約查詢） | `__GET_UPCOMING_BOOKINGS_PUBLIC_KEY__` |
| `markBookingReminded`（標記已提醒） | `__MARK_REMINDED_PUBLIC_KEY__` |

> **注意**：上述 6 個額外端點的 Deluge 函數尚未寫好（n8n 工作流假設這些端點存在）。需要額外建立簡單的查詢/更新函數。

---

## 🔲 Step 3 — n8n 匯入工作流（~30 分鐘）

> 在 n8n 後台 → Workflows → Import from file 匯入以下 JSON。
> 匯入後需替換所有 placeholder 值。

### 匯入清單

| # | 工作流檔案 | 觸發方式 | 節點數 | 用途 |
|---|-----------|----------|--------|------|
| N-02 | `n8n/workflows/SimplyBook_Webhook__Booking_Sync.json` | Webhook POST `/webhook/simplybook` | 5 | SB 預約 → Creator |
| N-03 | `n8n/workflows/SB_Pull_Services.json` | 每日 06:00 | 5 | SB getEventList → Service_Catalog |
| N-04 | `n8n/workflows/SB_Push_Description.json` | Manual | 6 | Creator → SB editEvent |
| N-05 | `n8n/workflows/EasyStore_Webhook__Order_Sync.json` | Webhook POST `/webhook/easystore-order` | 5+1 | ES 訂單 → Creator + LINE push |
| N-06 | `n8n/workflows/ES_Pull_Products.json` | 每日 06:30 | 4 | ES GET /products → Service_Catalog |
| N-08 | `n8n/workflows/Catalog_SEO_Generate.json` | Manual | 6 | LLM SEO 加工 |
| N-09 | `n8n/workflows/Booking_Reminder__LINE_Push.json` | 每小時 | 6 | 預約前 24h LINE 提醒 |

### Placeholder 替換總表

匯入後，在每個工作流的對應節點中替換以下值：

| Placeholder | 來源 | 出現在工作流 |
|-------------|------|-------------|
| `__SB_WEBHOOK_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-02 |
| `__SB_COMPANY__` | SimplyBook 公司代碼 | N-03, N-04 |
| `__SB_API_KEY__` | SimplyBook API Key | N-03 |
| `__SB_ADMIN_USERNAME__` | SimplyBook 管理帳號 | N-04 |
| `__SB_ADMIN_PASSWORD__` | SimplyBook 管理密碼 | N-04 |
| `__SYNC_CATALOG_SB_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-03 |
| `__GET_PENDING_SYNC_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-04 |
| `__UPDATE_SYNC_STATUS_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-04 |
| `__ES_WEBHOOK_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-05 |
| `__ES_SHOP__` | EasyStore 商店 URL | N-06 |
| `__ES_ACCESS_TOKEN__` | EasyStore Access Token | N-06 |
| `__SYNC_CATALOG_ES_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-06 |
| `__GET_PENDING_CATALOG_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-08 |
| `__ANTHROPIC_API_KEY__` | Anthropic API Key | N-08 |
| `__UPDATE_CATALOG_SEO_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-08 |
| `__GET_UPCOMING_BOOKINGS_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-09 |
| `__MARK_REMINDED_PUBLIC_KEY__` | Step 2 建立的 Custom API | N-09 |

### n8n 環境變數

在 n8n → Settings → Environment Variables 確認：

| 變數 | 用途 | 出現在工作流 |
|------|------|-------------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE push 推播用 | N-05, N-09 |

### Webhook URL 設定

匯入並啟用後，記下以下 webhook URL：

| Webhook 路徑 | 設定位置 |
|-------------|----------|
| `https://n8n.winds.tw/webhook/simplybook` | SimplyBook → Custom Features → Webhooks → URL |
| `https://n8n.winds.tw/webhook/easystore-order` | EasyStore → Settings → Webhooks → URL |

---

## 🔲 Step 4 — SimplyBook 後台設定（~30 分鐘）

> 對應策略計畫 §4.3

1. **啟用 API Custom Feature**
   - SimplyBook Admin → Custom Features → API → 啟用
   - 記下 API Key → 填入 Creator `SimplyBook.API_Key`

2. **啟用 Webhooks Custom Feature**
   - SimplyBook Admin → Custom Features → Webhooks → 啟用
   - Webhook URL：`https://n8n.winds.tw/webhook/simplybook`
   - 勾選事件：`new_booking`, `updated_booking`, `cancelled_booking`

3. **新增自訂欄位 `line_user_id`**
   - SimplyBook Admin → Custom Features → Client intake form
   - 新增欄位：名稱 `line_user_id`，類型 Text

4. **設定 Provider（老師）**
   - 名稱、專長標籤（對應 7 種問題類型）、時段

5. **設定 Service（諮詢項目）**
   - 名稱、描述、價格、時長

---

## 🔲 Step 5 — EasyStore 設定（~20 分鐘）

> 對應策略計畫 §5.1

1. **申請 Partner 帳號**（可能需 1-2 週審核）
   - [EasyStore Developer Platform](https://developers.easystore.co/)

2. **取得 OAuth Access Token**
   - Scope 需求：`read_products`, `write_products`, `read_orders`, `write_orders`
   - 填入 Creator `EasyStore.Access_Token`

3. **設定 Webhook**
   - EasyStore Admin → Settings → Webhooks
   - URL：`https://n8n.winds.tw/webhook/easystore-order`
   - 勾選事件：`orders/create`, `orders/paid`, `orders/fulfilled`

4. **商品上架**
   - 法器商品資料準備 + 上架

---

## 🔲 Step 6 — LIFF redirect.html 部署（~10 分鐘）

> 對應策略計畫 §12.3 (L-02)

### 檔案位置

`liff/redirect.html`

### 上線前需修改

| 項目 | 目前值 | 需改為 |
|------|--------|--------|
| `APPSAIL` URL | `https://divinationserver-10121308063.development.catalystappsail.com` | Production AppSail URL |
| `LIFF_ID` | `2009168674-G2KqF3Jv` | 確認是否需要新的 LIFF ID（或使用同一個） |

### AppSail 新增端點

`liff/redirect.html` 呼叫 `APPSAIL + "/liff-track-click"`，此端點需在 AppSail Express.js 中新增：

```javascript
// catalyst/appsail/divinationServer/index.js — 新增路由
app.post('/liff-track-click', async (req, res) => {
  const { recommendationLogId, clickedCatalogId, lineUserId } = req.body;
  // 呼叫 Creator API.trackRecommendationClick
  // 回傳 { success: true, redirect_url: "..." }
});
```

### LIFF 頁面註冊

若使用獨立 LIFF page：
1. LINE Developers Console → LIFF → Add
2. Endpoint URL：`https://winds.tw/liff/redirect.html`（或對應部署路徑）

---

## 🔲 Step 7 — Service_Catalog 初始資料錄入（~30 分鐘）

> 對應策略計畫 §8.2 P0

### 必須手動錄入的資料

1. **數位符令**（Source=Talisman）
   - Name：開運符令
   - Price：360
   - Target_Question_Types：全選
   - LLM_Description：「數位開運符令，根據您的占卜結果量身定制。包含完整解讀與開運建議。門檻最低、適合所有問題類型的入門選項。」
   - Active：true

2. **SimplyBook 預約項目**（Source=SimplyBook）
   - 從 SimplyBook 後台手動輸入，或等 N-03 自動拉取

3. **EasyStore 商品**（Source=EasyStore）
   - 從 EasyStore 後台手動輸入，或等 N-06 自動拉取

---

## 🔲 Step 8 — 驗證測試（~30 分鐘）

### Phase 2A：LLM 推薦引擎

- [ ] Service_Catalog 至少有 3 筆以上有效記錄
- [ ] `LLM.recommendNextAction` 手動測試：傳入模擬資料，確認回傳 JSON 格式正確
- [ ] 確認 fallback：filteredCatalog 為空時回傳 null

### Phase 2B：SimplyBook 預約

- [ ] 在 SimplyBook 建立測試預約
- [ ] 確認 n8n N-02 工作流收到 webhook
- [ ] 確認 Creator `API.handleSimplyBookWebhook` 執行成功
- [ ] 確認 Booking_Logs 有新記錄
- [ ] 確認 LINE push 預約確認訊息送達

### Phase 3：EasyStore 訂單

- [ ] 在 EasyStore 建立測試訂單
- [ ] 確認 n8n N-05 工作流收到 webhook
- [ ] 確認 Creator `API.handleEasyStoreWebhook` 執行成功
- [ ] 確認 Product_Orders 有新記錄

### Phase 2C：SEO 清洗

- [ ] 手動執行 N-03（SB_Pull_Services）→ 確認 Service_Catalog 有 SimplyBook 記錄
- [ ] 手動執行 N-08（Catalog_SEO_Generate）→ 確認 SEO 欄位有值、Sync_Status=draft
- [ ] 手動審核後設定 Sync_Status=pending_sync
- [ ] 手動執行 N-04（SB_Push_Description）→ 確認 SB 描述已更新

### LIFF redirect.html

- [ ] 在 LINE 中開啟 redirect.html（帶 catalog_id + url 參數）
- [ ] 確認顯示 loading 動畫 → 自動導向商品頁
- [ ] 確認 LIFF 初始化失敗時仍可導向（fallback）

---

## 🔲 Step 9 — 排程工作流啟用

> 確認所有測試通過後，依序啟用排程工作流。

| 工作流 | 排程 | 啟用時機 |
|--------|------|----------|
| N-03 SB_Pull_Services | 每日 06:00 | SimplyBook 設定完成後 |
| N-06 ES_Pull_Products | 每日 06:30 | EasyStore API 取得後 |
| N-09 Booking_Reminder__LINE_Push | 每小時 | Booking_Logs 正常運作後 |

---

## 部署順序依賴圖

```
Step 0: App Variables
  ↓
Step 1: Creator 建表 (C-01~C-05) + 解除 Deluge 註解
  ↓
Step 2: Creator 部署 Deluge 函數 + 建立 Custom API endpoints
  ↓                          ↓
Step 3: n8n 匯入工作流        Step 6: LIFF redirect.html
  ↓                            ↓
Step 4: SimplyBook 設定      Step 7: 初始資料錄入
  ↓
Step 5: EasyStore 設定
  ↓
Step 8: 驗證測試
  ↓
Step 9: 排程啟用
```

---

## 附錄 A：n8n 工作流節點結構

### N-02：SimplyBook_Webhook__Booking_Sync（5 節點）

```
SB Webhook (IN) → Parse SB Payload → POST to Creator API → Check Success → Log Error
                                                         ↓ (success)
                                                         (end)
```

### N-03：SB_Pull_Services（5 節點）

```
Schedule (Daily 06:00) → SB getToken → SB getEventList → Map SB to Creator Format → POST to Creator syncCatalogFromSB
```

### N-04：SB_Push_Description（6 節點）

```
Manual Trigger ──→ GET Pending Sync Records ──→ SplitInBatches → SB editEvent → Update Creator Sync Status
             └──→ SB getUserToken (Admin) ──┘                                   ↓ (loop back)
```

### N-05：EasyStore_Webhook__Order_Sync（5+1 節點）

```
ES Webhook (IN) → Parse ES Order Payload → POST to Creator API → Has Line User ID? → LINE Push Notification
                                                                ↓ (no)
                                                                (end)
```

### N-06：ES_Pull_Products（4 節點）

```
Schedule (Daily 06:30) → GET ES Products → Map ES to Creator Format → POST to Creator syncCatalogFromES
```

### N-08：Catalog_SEO_Generate（6 節點）

```
Manual Trigger → GET Pending Catalog Records → SplitInBatches → Anthropic Claude (Haiku) SEO → Parse LLM JSON → Update Creator SEO Fields
                                                                                                                  ↓ (loop back)
```

### N-09：Booking_Reminder__LINE_Push（6 節點）

```
Schedule (Every Hour) → Query Upcoming Bookings → Filter Not Reminded → SplitInBatches → LINE Push Reminder → Mark as Reminded
                                                                                                               ↓ (loop back)
```

---

## 附錄 B：LLM 模型與成本

| 用途 | 模型 | max_tokens | temperature | 估算 tokens/次 | 頻率 |
|------|------|------------|-------------|----------------|------|
| 推薦引擎 (C-06) | `claude-haiku-4-5-20251001` | 300 | 0.3 | ~700 | 每次占卜 |
| SEO 清洗 (N-08) | `claude-haiku-4-5-20251001` | 800 | 0.5 | ~1,500 | 批次（手動觸發） |
| 免費摘要 (C-14) | 預設模型（Sonnet） | 600 | 0.7 | ~900 | 每次占卜 |

---

## 附錄 C：程式碼檔案與策略計畫對照表

| 策略計畫編號 | 程式碼檔案 | 狀態 |
|-------------|-----------|------|
| C-01 | （Creator 手動建表） | 待建 |
| C-02 | （Creator 手動建表） | 待建 |
| C-03 | （Creator 手動建表） | 待建 |
| C-04 | （Creator 手動建表） | 待建 |
| C-05 | （Creator 手動建表） | 待建 |
| C-06 | `zoho-creator/functions/llm/LLM.recommendNextAction.deluge` | ✅ 完成 |
| C-07 | `zoho-creator/functions/api/API.handleSimplyBookWebhook.deluge` | ⚠️ 缺 CRM.syncContact |
| C-08 | `zoho-creator/functions/api/API.handleEasyStoreWebhook.deluge` | ✅ 完成 |
| C-09 | `zoho-creator/functions/api/API.trackRecommendationClick.deluge` | ✅ 完成 |
| C-10 | `zoho-creator/functions/api/API.syncCatalogFromSB.deluge` | ✅ 完成 |
| C-11 | `zoho-creator/functions/api/API.syncCatalogFromES.deluge` | ✅ 完成 |
| C-12 | `zoho-creator/functions/api/API.pushCatalogToSB.deluge` | ⚠️ 缺錯誤檢查 |
| C-13 | `zoho-creator/functions/api/API.pushCatalogToES.deluge` | ⚠️ 缺錯誤檢查 |
| C-14 | `zoho-creator/functions/api/API.liffDivinationMvp.deluge` | ✅ V2 升級完成 |
| C-15 | （待修改現有 Webhook.handleSimplyBook.deluge） | 待做 |
| C-16~C-23 | （Creator App Variables） | 待設定 |
| N-01 | （修改現有 ECPay_Paid_Notify__LINE_Push.json） | 待做 |
| N-02 | `n8n/workflows/SimplyBook_Webhook__Booking_Sync.json` | ✅ 完成 |
| N-03 | `n8n/workflows/SB_Pull_Services.json` | ✅ 完成 |
| N-04 | `n8n/workflows/SB_Push_Description.json` | ✅ 完成 |
| N-05 | `n8n/workflows/EasyStore_Webhook__Order_Sync.json` | ⚠️ 缺事件分流 |
| N-06 | `n8n/workflows/ES_Pull_Products.json` | ✅ 完成 |
| N-07 | （ES_Push_Description.json — 未建立） | 待做 |
| N-08 | `n8n/workflows/Catalog_SEO_Generate.json` | ✅ 完成 |
| N-09 | `n8n/workflows/Booking_Reminder__LINE_Push.json` | ✅ 完成 |
| N-10 | （Re-engagement__Nudge.json — 未建立） | 待做（Phase 2/3 穩定後） |
| N-11 | （Post_Consultation__Product_Push.json — 未建立） | 待做（Phase 2/3 穩定後） |
| L-01 | `liff/index.html` | ✅ V2 升級完成 |
| L-02 | `liff/redirect.html` | ✅ 完成（需改 AppSail URL） |
