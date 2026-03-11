# SimplyBook + EasyStore 預約與銷售導流策略研究

> **專案**：找風問幸福 (winds.tw / winds.life) — AI 占卜平台
> **版本**：v1.0 | 2026-03-11
> **狀態**：Phase 1 (MVP) 已上線 — LINE 免費占卜 + 數位符令銷售 (NT$360/張, ECPay)
> **North Star**：每日 100 筆符令成交
> **範圍**：Phase 2 (SimplyBook 老師諮詢預約) + Phase 3 (EasyStore 法器商品) 之整合策略與技術規劃
> **前提**：已有合作老師入駐、已有商品準備好上架

---

## 目錄

1. [現有架構摘要](#一現有架構摘要)
2. [服務/商品目錄管理與雙向同步](#二服務商品目錄管理與雙向同步)
3. [LLM 智慧推薦引擎](#三llm-智慧推薦引擎)
4. [Phase 2：SimplyBook 老師諮詢預約整合](#四phase-2simplybook-老師諮詢預約整合)
5. [Phase 3：EasyStore 法器商品整合](#五phase-3easystore-法器商品整合)
6. [完整轉換漏斗設計](#六完整轉換漏斗設計)
7. [SEO 資料清洗流程（AGO）](#七seo-資料清洗流程ago)
8. [實作優先序與依賴](#八實作優先序與依賴)
9. [新增資料模型規格](#九新增資料模型規格)
10. [新增 API 端點與 n8n 工作流](#十新增-api-端點與-n8n-工作流)
11. [技術風險與緩解](#十一技術風險與緩解)
12. [部署函數清單（按代理分工）](#十二部署函數清單按代理分工)

---

## 一、現有架構摘要

### 1.1 系統架構

| 元件 | 技術 | 角色 |
|------|------|------|
| 前端入口 | LINE LIFF mini-app (`liff/index.html`) | 使用者互動：生日 + 問題 |
| SSOT 後端 | Zoho Creator (`AI易經.ds`) | 資料模型、業務邏輯、Custom API |
| 編排層 | n8n (主) + Zoho Flow (備) | Webhook 路由、LINE 推播、排程（注意下方說明） |
| 非同步處理 | Zoho Catalyst AppSail (Express.js) | 長任務（占卜 AI 生成） |
| 金流 | ECPay 信用卡 | NT$360 符令付款 |
| CRM | Zoho CRM | 客戶命理資料同步 |
| LLM | Anthropic Claude Messages API | AI 解讀、分類、推薦 |
| 主鍵 | LINE User ID | 全鏈路使用者追蹤 |

**Zoho Flow 備援策略說明**：Phase 1 的 LINE webhook relay 和 ECPay 交付有 Zoho Flow 備援（`flow1-line-webhook-relay.deluge`, `flow2-ecpay-push-delivery.deluge`）。Phase 2/3 新增的工作流以 n8n 為唯一編排層，**暫不建立 Zoho Flow 備援**。理由：(1) 新工作流涉及 SimplyBook/EasyStore 外部 API，Flow 的 Deluge 實作成本過高；(2) 這些工作流非即時金流關鍵路徑，容許短暫中斷；(3) 若 n8n 穩定性有疑慮，優先考慮 n8n 升級為付費版。唯一例外：`SimplyBook_Webhook__Booking_Sync` 可考慮用 Zoho Flow 的 SimplyBook 原生連接器做 fallback。

### 1.2 現有 LLM 呼叫架構

核心函數 `LLM.callChat.deluge`：

- **API**：Anthropic Claude Messages API (`https://api.anthropic.com/v1/messages`)
- **預設模型**：`claude-sonnet-4-20250514`（可覆寫為 `claude-haiku-4-20250514` 降本）
- **認證**：`x-api-key` header + `anthropic-version: "2023-06-01"`
- **參數**：`model`, `max_tokens`, `temperature`, `system`, `messages`
- **回應**：`response.content[0].text`

**Creator App Variables（LLM 相關）**：
- `thisapp.variables.LLM.LLM_API_Key` — Anthropic API Key
- `thisapp.variables.LLM.LLM_API_URL` — API endpoint
- `thisapp.variables.LLM.LLM_Model` — 預設模型
- `thisapp.variables.LLM.LLM_API_Version` — API 版本

### 1.3 現有資料模型

- **Clients_Report** — 客戶主檔 (`Line_User_ID`, `Date_Of_Birth`, `Email`, `Client_Type`)
- **Divination_Logs** — 占卜紀錄 (`Client_Link`, `Original_Question`, `Question_Type_AI`, `AI_Interpretation`, `Current_Talisman_Index`, `Status`)
- **Talisman_Purchases** — 符令訂單 (`MerchantTradeNo`, `Line_User_ID`, `Status`, `Delivery_Push_Status`)

### 1.4 現有使用者旅程

```
LINE 入口 → LIFF (生日+問題) → Creator API.liffDivinationMvp
  → 免費摘要 (~300字) + LINE push
  → CTA: 解鎖完整版/購買符令 (NT$360)  ← 目前固定為 offer_unlock
  → ECPay 付款 → Creator 記帳 → LINE push 交付符令
```

### 1.5 問題分類體系（7 類）

`AIInterpreter.classifyQuestionType` 已實作：**愛情、婚姻、工作、財運、健康、入煞、其他**。

### 1.6 已存在但未啟用的 SimplyBook 整合

`Webhook.handleSimplyBook.deluge` 已寫好，功能為：
- 解析 SimplyBook webhook 的 `client_email`, `client_first_name`, `client_last_name`, `client_phone`, `precise_birth_time`
- 標記 `Lead_Source = "SimplyBook"`
- 呼叫 `CRM.syncContact` 同步至 Zoho CRM
- **缺口**：webhook 欄位名稱標註為「假設值」，需對照 SimplyBook 實際 payload 確認

---

## 二、服務/商品目錄管理與雙向同步

### 2.1 核心設計：Creator `Service_Catalog` 統一目錄表

將 SimplyBook 預約項目 + EasyStore 商品 + 數位符令整合到同一張表，方便 LLM 一次比對推薦。

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Catalog_ID` | auto | 自動編號 |
| `Source` | picklist | `SimplyBook` / `EasyStore` / `Talisman` |
| `External_ID` | text | SB service ID 或 ES product handle |
| `Name` | text | 項目/商品名稱 |
| `Category` | multi-select | 分類標籤 |
| `Purpose` | text (multi-line) | 目的說明（來自 SB/ES 描述） |
| `Functions` | text (multi-line) | 功能說明 |
| `Specifications` | text (multi-line) | 規格/條件（時長、適用對象等） |
| `Target_Question_Types` | multi-select | 適合的問題類型（愛情/工作/財運/健康/入煞/其他） |
| `Target_Situations` | text (multi-line) | 適用情境描述（供 LLM 比對） |
| `Price` | decimal | 價格 (TWD) |
| `Booking_URL` / `Product_URL` | URL | 外部連結 |
| `Provider_Name` | text | 老師名稱（SB 專用） |
| `Image_URL` | URL | 圖片連結 |
| `Priority_Score` | number | 排序權重（手動調整推薦優先序） |
| `Active` | boolean | 是否啟用 |
| `LLM_Description` | text (multi-line) | **專門給 LLM 的一段式描述**（合併目的+功能+情境，優化 token） |
| `Raw_Description` | text (multi-line) | 從 SB/ES 拉進來的原始描述 |
| `SEO_Title` | text | SEO 優化標題 |
| `SEO_Description` | text | SEO meta description (~155字) |
| `SEO_Keywords` | text | 目標關鍵字 |
| `OG_Title` | text | Open Graph 分享標題 |
| `OG_Description` | text | Open Graph 分享描述 |
| `Cleaned_Description` | text (multi-line) | 洗過的正式描述（回寫 SB/ES 用） |
| `Last_Synced_From` | datetime | 上次從 SB/ES 拉取時間 |
| `Last_Synced_To` | datetime | 上次回寫 SB/ES 時間 |
| `Sync_Status` | picklist | `pending` / `draft` / `rejected` / `pending_sync` / `synced` / `conflict` |

**設計理由**：
- 統一表讓 LLM 只需一次呼叫即可同時比對預約項目和商品
- `LLM_Description` 預先合併，避免每次 prompt 組裝時重複處理
- `Target_Question_Types` 做第一層篩選（減少 token），LLM 做第二層語義比對
- SEO 欄位與推薦欄位分離，各自用途明確

### 2.2 SimplyBook ↔ Creator 雙向同步

#### 技術規格

| 項目 | 規格 |
|------|------|
| API 協議 | JSON-RPC 2.0 |
| Base URL (讀取) | `https://user-api.simplybook.me` |
| Base URL (管理) | `https://user-api.simplybook.me/admin` |
| 認證 (讀取) | `getToken(company, api_key)` → `X-Company-Login` + `X-Token` header |
| 認證 (管理/寫入) | `getUserToken(company, username, password)` → Admin API token |
| Token 有效期 | 1 小時（需定期更新） |
| Rate Limit | 5,000 次/天，最多 2 並行，≤5 次/秒 |

#### SB → Creator（拉取）

**方法**：`getEventList()` JSON-RPC 呼叫

```json
{
  "jsonrpc": "2.0",
  "method": "getEventList",
  "params": [true],
  "id": 1
}
```

**回傳欄位對應**：

| SB 欄位 | Creator `Service_Catalog` 欄位 |
|---------|-------------------------------|
| `id` | `External_ID` |
| `name` | `Name` |
| `description` | `Raw_Description` |
| `duration` | `Specifications`（部分） |
| `price` | `Price` |
| `picture_path` | `Image_URL` |
| `is_active` | `Active` |
| `position` | `Priority_Score` |

**Webhook 事件（即時）**：`new_booking`, `updated_booking`, `cancelled_booking`, `notification`

#### Creator → SB（回寫）

**方法**：Admin API `editEvent()` JSON-RPC 呼叫

```json
{
  "jsonrpc": "2.0",
  "method": "editEvent",
  "params": [
    {event_id},
    {
      "name": "{Cleaned_Name}",
      "description": "{Cleaned_Description}"
    }
  ],
  "id": 1
}
```

> ⚠️ `editEvent` 完整參數需對照 [SimplyBook Admin API 文件](https://help.simplybook.me/index.php/Company_administration_service_methods) 確認。

### 2.3 EasyStore ↔ Creator 雙向同步

#### 技術規格

| 項目 | 規格 |
|------|------|
| API 類型 | REST API |
| API 版本 | 3.0（OAuth 端點）/ 1.0（舊版相容） |
| Base URL | `https://{shop}/api/3.0/` |
| 認證 | OAuth 2.0 → `EasyStore-Access-Token: {token}` header |
| Token 取得 | `POST https://{shop}/api/3.0/oauth/access_token.json` |
| Scope 格式 | `read_products,write_products,read_orders,write_orders` |
| 需求 | Partner 帳號（需申請 [EasyStore Developer Platform](https://developers.easystore.co/)） |

#### ES → Creator（拉取）

**端點**：`GET https://{shop}/api/3.0/products.json`

**Header**：`EasyStore-Access-Token: {access_token}`

**Scope 需求**：`read_products`

**回傳欄位對應**：

| ES 欄位 | Creator `Service_Catalog` 欄位 |
|---------|-------------------------------|
| `id` / `handle` | `External_ID` |
| `title` | `Name` |
| `body_html` | `Raw_Description` |
| `variants[0].price` | `Price` |
| `images[0].src` | `Image_URL` |
| `published` | `Active` |

**Webhook 事件**：`products/create`, `products/update`, `products/delete`, `orders/create`, `orders/paid`, `orders/fulfilled`

#### Creator → ES（回寫）

**端點**：`PUT https://{shop}/api/3.0/products/{product_id}.json`

**Header**：`EasyStore-Access-Token: {access_token}`

**Scope 需求**：`write_products`

**Body 範例**：
```json
{
  "product": {
    "title": "{Cleaned_Name}",
    "body_html": "{Cleaned_Description}",
    "meta_title": "{SEO_Title}",
    "meta_description": "{SEO_Description}"
  }
}
```

> ⚠️ 完整端點清單請查閱 [EasyStore Postman API Docs](https://postman.easystore.co/)。

### 2.4 雙向同步架構圖

```
SimplyBook                    Creator (SSOT)                    EasyStore
    │                         Service_Catalog                        │
    │                              │                                 │
    │── Webhook (即時) ──→ n8n ──→ 寫入 (Source=SB)                  │
    │←─ n8n 排程拉 ─── getEventList │                                │
    │←─ n8n 回寫 ──── editEvent ───│── 手動審核後觸發 ──→             │
    │                              │                                 │
    │                              │──→ n8n ──→ PUT /products ──────→│
    │                              │←── n8n 排程拉 GET /products ────│
    │                              │←── n8n ←── Webhook (即時) ──────│
    │                              │                                 │
    │                        ┌─────┴──────┐                          │
    │                        │ LLM 加工    │                          │
    │                        │ SEO 清洗    │                          │
    │                        │ 推薦引擎    │                          │
    │                        └────────────┘                          │
```

---

## 三、LLM 智慧推薦引擎

### 3.1 設計理念

不再依賴固定規則觸發推薦，而是：
1. **第一層篩選**：用 `Target_Question_Types` 從 `Service_Catalog` 篩出候選項目（減少 token）
2. **第二層語義比對**：LLM 比對使用者問題 + 占卜結果 vs 候選項目的 `LLM_Description`
3. **永遠保留符令作為 fallback**（成本最低的入門選項）

### 3.2 新增 `LLM.recommendNextAction.deluge` 函數

#### 輸入資料

| 參數 | 來源 | 說明 |
|------|------|------|
| `original_question` | `Divination_Logs.Original_Question` | 使用者原始問題 |
| `question_type` | `AIInterpreter.classifyQuestionType` 結果 | 7 類之一 |
| `free_summary` | `API.liffDivinationMvp` 產出 | ~300 字免費摘要 |
| `client_history` | `Clients_Report` + `Talisman_Purchases` 查詢 | 購買次數、上次占卜時間 |
| `filtered_catalog` | `Service_Catalog` 查詢 | `Active=true` 且 `Target_Question_Types` 包含該類型 |

#### Prompt 設計

```
System: "你是一位專業的占卜諮詢顧問。根據客戶的問題、占卜結果和個人狀況，
從以下服務/商品目錄中推薦最適合的 1-2 個選項。
回傳嚴格 JSON 格式，不要包含任何其他文字。"

User: "
【客戶問題】{original_question}
【問題類型】{question_type}
【占卜結果摘要】{free_summary}
【客戶歷史】{首次使用 / 曾購買 N 張符令 / 上次占卜 D 天前}

【可推薦項目】
{foreach item in filtered_catalog}
ID:{Catalog_ID} | {LLM_Description} | NT${Price}
{end}

請推薦最適合此客戶的 1-2 個項目。回傳格式：
{
  \"recommendations\": [
    {\"catalog_id\": \"ID\", \"reason\": \"推薦理由（30字內）\", \"urgency\": \"high|medium|low\"}
  ]
}

規則：
- 優先推薦符令（成本最低、門檻最低），除非問題明顯需要老師諮詢或法器
- 如果問題涉及「入煞」或「健康」且情況緊急，優先推薦老師諮詢
- reason 要針對客戶的具體問題，不要泛泛而談
- urgency 反映客戶問題的急迫程度
"
```

#### LLM 選項

| 參數 | 值 | 理由 |
|------|-----|------|
| `model` | `claude-haiku-4-20250514` | 成本優化（~500 input + ~200 output tokens） |
| `max_tokens` | 300 | JSON 回應不需太長 |
| `temperature` | 0.3 | 推薦需要一致性，不需高創意 |

#### 回傳格式

```json
{
  "recommendations": [
    {
      "catalog_id": "12",
      "reason": "您的感情困擾涉及第三方介入，建議與老師深入討論對策",
      "urgency": "high"
    },
    {
      "catalog_id": "3",
      "reason": "搭配開運符令穩定心神，有助於理清思路",
      "urgency": "medium"
    }
  ]
}
```

#### Fallback 機制

1. LLM 回傳解析失敗 → 退回 `offer_unlock`（原有符令推薦）
2. `Service_Catalog` 篩選結果為空 → 退回 `offer_unlock`
3. LLM 回應超時 (>3秒) → 退回 `offer_unlock`

### 3.3 修改 `API.liffDivinationMvp` 的 `next_action` 邏輯

#### 目前（固定）

```javascript
next_action = Map();
next_action.put("kind", "offer_unlock");
next_action.put("price", 360);
next_action.put("currency", "TWD");
next_action.put("cta_label", "解鎖完整版/購買符令");
```

#### 改為（動態）

```javascript
// 1. 從 Service_Catalog 篩選候選項目
catalog_items = zoho.creator.getRecords("Service_Catalog",
    "Active == true && Target_Question_Types.contains(question_type)");

// 2. 呼叫 LLM 推薦
recommendation = LLM.recommendNextAction(
    original_question, question_type, free_summary, client_history, catalog_items);

// 3. 組裝動態 next_action
if (recommendation != null && recommendation.get("recommendations").size() > 0)
{
    primary = recommendation.get("recommendations").get(0);
    catalog_record = zoho.creator.getRecordById("Service_Catalog", primary.get("catalog_id"));

    next_action = Map();
    next_action.put("kind", "smart_recommend");
    next_action.put("primary", {
        "catalog_id": primary.get("catalog_id"),
        "name": catalog_record.get("Name"),
        "source": catalog_record.get("Source"),
        "reason": primary.get("reason"),
        "urgency": primary.get("urgency"),
        "price": catalog_record.get("Price"),
        "url": catalog_record.get("Booking_URL") or catalog_record.get("Product_URL"),
        "image_url": catalog_record.get("Image_URL")
    });

    // 次要推薦（可能為 null）
    if (recommendation.get("recommendations").size() > 1)
    {
        secondary = recommendation.get("recommendations").get(1);
        // ... 同上組裝
    }

    // 永遠保留符令作為 fallback
    next_action.put("fallback", {
        "kind": "offer_unlock",
        "price": 360,
        "currency": "TWD"
    });
}
else
{
    // LLM 推薦失敗，退回原有邏輯
    next_action = Map();
    next_action.put("kind", "offer_unlock");
    next_action.put("price", 360);
    next_action.put("currency", "TWD");
}
```

### 3.4 LIFF 前端呈現

#### 現狀（`liff/index.html`）

目前 LIFF 頁面的「解鎖完整版 / 購買符令」按鈕是 **disabled placeholder**（文字顯示「即將開放」），**完全沒有**根據 API 回傳的 `next_action` 做任何動態渲染。因此本次改動不只是「增加推薦卡片」，而是需要**從頭實作** CTA 動態渲染邏輯。

此外，LIFF 表單有收集「可選出生時辰」欄位，此資料可作為 persona 輸入提升 LLM 推薦精度（與 SimplyBook `precise_birth_time` 欄位對應）。

#### 目標渲染邏輯

根據 `next_action.kind` 動態渲染：

- **`offer_unlock`（原有 fallback）** → 單一「購買符令 NT$360」按鈕
- **`smart_recommend`（新增）** → 推薦卡片（含名稱、理由、價格、CTA）+ 「購買符令」作為次要選項

### 3.5 LINE Push 訊息範本

#### 有推薦時

```
【免費占卜摘要】
{summary_text}

---
💡 根據您的問題與占卜結果，為您推薦：

📌 {recommendation.name}（NT${price}）
{recommendation.reason}
👉 {recommendation.url}

或者，您也可以選擇：
🔮 購買開運符令（NT$360）
👉 {liff_unlock_url}
```

#### 無推薦時（fallback）

```
【免費占卜摘要】
{summary_text}

---
🔮 想要更完整的解讀與開運符令？
👉 解鎖完整版（NT$360）：{liff_unlock_url}
```

---

## 四、Phase 2：SimplyBook 老師諮詢預約整合

### 4.1 SimplyBook 技術能力概覽

| 能力 | 細節 |
|------|------|
| API 協議 | JSON-RPC 2.0 |
| 認證 | API key → token（讀取）/ username+password → token（管理） |
| LINE 原生支援 | LINE LIFF Custom Feature + LINE Bot Custom Feature |
| Webhook 事件 | `new_booking`, `updated_booking`, `cancelled_booking`, `notification` |
| n8n 整合 | 原生 trigger：new booking, cancellation, invoice, client creation |
| Zoho Flow 整合 | 原生連接器 |

### 4.2 LIFF 整合策略：自建 LIFF 為主入口

**不使用 SimplyBook 的 LINE LIFF Custom Feature 作為入口**。原因：SimplyBook LIFF 是完整預約頁面，無法嵌入占卜結果的上下文。

**建議方案**：自建 LIFF 增加「預約老師」CTA → 帶參數跳轉至 SimplyBook 網頁預約。

跳轉 URL 格式：
```
https://winds.simplybook.me/v2/#book/provider/{providerId}/service/{serviceId}?custom_field[line_user_id]={lineUserId}
```

額外入口：LINE Rich Menu 增加「預約老師」按鈕（常駐，不依賴占卜觸發）。

### 4.3 SimplyBook 端設定需求

1. **啟用 Webhooks Custom Feature**：SimplyBook admin → Custom Features → Webhooks
2. **啟用 API Custom Feature**：取得 API key
3. **新增自訂欄位**：`line_user_id`（client intake form）
4. **設定 Provider（老師）**：名稱、專長標籤（對應 7 種問題類型）、時段
5. **設定 Service（項目）**：每個諮詢項目的名稱、描述（目的/功能/規格）、價格、時長
6. **Webhook URL**：`https://n8n.winds.tw/webhook/simplybook`

### 4.4 Webhook 處理流程

```
SimplyBook Webhook
    → n8n (接收 + 預處理)
    → Creator API.handleSimplyBookWebhook
        → 查找/建立 Clients_Report（以 email 或 line_user_id 匹配）
        → 寫入 Booking_Logs
        → 若有 Line_User_ID → LINE push 預約確認訊息
        → 呼叫 CRM.syncContact（已有邏輯）
```

**修正現有 `Webhook.handleSimplyBook.deluge` 重點**：
1. 對照 SimplyBook webhook 真實欄位名稱（目前為假設值）
2. 新增 `Line_User_ID` 取得邏輯（從自訂欄位 `custom_field[line_user_id]`）
3. 新增寫入 `Booking_Logs` 邏輯
4. 新增 LINE push 預約確認通知

### 4.5 轉換追蹤

| 指標 | 計算方式 |
|------|----------|
| 推薦→點擊率 | `Recommendation_Logs.clicked / recommended` |
| 點擊→預約率 | `Booking_Logs.count / clicks` |
| 預約→完成率 | `Booking_Logs.status='已完成' / total` |
| 占卜→預約轉換率 | `Booking_Logs / Divination_Logs`（同期） |

---

## 五、Phase 3：EasyStore 法器商品整合

### 5.1 EasyStore 技術能力概覽

| 能力 | 細節 |
|------|------|
| API 類型 | REST API (OAuth 2.0) |
| 端點格式 | `https://{shop}/api/3.0/{resource}.json` |
| 認證 | `EasyStore-Access-Token` header |
| Scope | `read_products`, `write_products`, `read_orders`, `write_orders` 等 |
| Webhook | products/orders CRUD 事件 |
| LINE 整合 | LINE Shopping 原生整合 |
| 需求 | Partner 帳號（[申請連結](https://developers.easystore.co/)） |

### 5.2 整合策略：導流模式優先

**核心原則**：EasyStore 已是成熟電商平台，不需在 Creator 重建商品管理。僅做「推薦導流 + 訂單追蹤」。

| 方案 | 說明 | 優缺 |
|------|------|------|
| **A. 導流模式 (✅ 推薦)** | LINE push 商品連結 → EasyStore 結帳 → Webhook 回寫 | 簡單、維護成本低 |
| B. API 模式 | LIFF 內展示商品、下單 → 呼叫 ES API | 體驗更流暢但開發量大 |
| C. LINE Shopping | 透過 LINE Shopping 串接 | 需申請資格、流量共享 |

### 5.3 LINE Flex Message 商品卡片

```json
{
  "type": "flex",
  "altText": "為您推薦適合的法器",
  "contents": {
    "type": "carousel",
    "contents": [
      {
        "type": "bubble",
        "hero": { "type": "image", "url": "{product_image}", "size": "full" },
        "body": {
          "type": "box", "layout": "vertical",
          "contents": [
            { "type": "text", "text": "{product_name}", "weight": "bold" },
            { "type": "text", "text": "NT${price}", "color": "#d9534f" },
            { "type": "text", "text": "{reason}", "wrap": true, "size": "sm" }
          ]
        },
        "footer": {
          "type": "box", "layout": "vertical",
          "contents": [{
            "type": "button",
            "action": { "type": "uri", "label": "了解更多", "uri": "{product_url}" },
            "style": "primary"
          }]
        }
      }
    ]
  }
}
```

### 5.4 LINE User ID 綁定策略

EasyStore 不原生支援 LINE User ID 作為客戶識別。綁定方案：

| 方案 | 做法 | 精確度 |
|------|------|--------|
| **A. 自建中間頁 (✅ 推薦)** | LIFF → 中間頁（記錄 lineUserId + 商品 ID → Creator）→ redirect 至 ES | 高 |
| B. Email 匹配 | 以 Creator 已有的 email 作為跨系統 key | 中（需用戶有 email） |
| C. UTM 參數 | `?utm_campaign={lineUserId_hash}` | 低（僅追蹤來源） |

**建議**：Phase 3 先用方案 A（中間頁）+ 方案 B（email 備案）。

---

## 六、完整轉換漏斗設計

### 6.1 漏斗結構（平行推薦，非線性）

```
L0: 社群內容（週運勢/占卜案例）→ LINE 好友加入
      ↓ (追蹤: 好友數、UTM 來源)
L1: LINE 免費占卜 (LIFF) → Divination_Logs
      ↓ (追蹤: 占卜次數/冷卻觸發/問題類型分佈)
      │
    ┌─── LLM 智慧推薦（Service_Catalog 語義比對）───┐
    │                    │                           │
    ▼                    ▼                           ▼
L2: 符令購買          L3: 老師預約              L4: 法器商品
    Talisman_Purchases   Booking_Logs              Product_Orders
    (NT$360)             (NT$800-3000)             (NT$500-5000)
    │                    │                          │
    └──────── 再行銷（n8n 排程 + LLM 再推薦）───────┘
```

**核心差異**：L2/L3/L4 不再是線性漏斗，而是 LLM 根據情境平行推薦。使用者可能從 L1 直接到 L3 或 L4。

### 6.2 各層指標定義

| 層級 | 輸入指標 | 輸出指標 | 轉換率定義 |
|------|----------|----------|------------|
| L0→L1 | LINE 好友數 | 免費占卜人次 | 使用率 |
| L1→L2 | 免費占卜 + 推薦觸發 | 符令購買筆數 | 付費轉換率 (目標 >5%) |
| L1→L3 | 免費占卜 + 推薦觸發 | 老師預約筆數 | 預約轉換率 |
| L1→L4 | 免費占卜 + 推薦觸發 | 商品訂單數 | 商品轉換率 |
| L2→L3 | 符令買家 + 再推薦 | 老師預約筆數 | 升級率 |
| L3→L4 | 諮詢完成 + 老師推薦 | 商品訂單數 | 老師導購率 |

### 6.3 再行銷策略

#### 週運勢 CTA 分層

| 使用者狀態 | 週運勢 CTA | 實作方式 |
|------------|-----------|----------|
| 新使用者 (0 次占卜) | LINE 免費占卜 | 預設 |
| 已占卜未購買 | 限時符令優惠 | LINE push (分眾) |
| 已購買 1 張符令 | 解鎖下一張 + 老師推薦 | LINE push (分眾) |
| 已購買 3+ 張 | 法器商品推薦 | LINE push (Flex Message) |
| 已預約老師 | 老師指定商品 | 諮詢後手動推 |

#### 定時再觸發（n8n 排程）

| 時機 | 動作 |
|------|------|
| 每週一 | 週運勢推播（已有 `Weekly_Fortune` 工作流） |
| 首次占卜後 7 天 | 未購買者 → 再推一次符令 + 推薦 CTA |
| 符令購買後 14 天 | 觸發下一張符令 + 老師推薦 |
| 諮詢完成後 3 天 | 滿意度問卷 + 商品推薦 |
| 付款後 3 天未交付 | Delivery reminder |

---

## 七、SEO 資料清洗流程（AGO）

### 7.1 核心需求

SimplyBook 和 EasyStore 的網站都需要做 SEO 優化（AGO）。從兩個平台出來的「原始資料」需要在 Creator 裡清洗/加工，再寫回去。

### 7.2 清洗流程

```
SB/ES 原始資料（Raw_Description）
    ↓ n8n 拉取（排程或 webhook 觸發）
Creator Service_Catalog 寫入（Sync_Status = 'pending'）
    ↓ LLM 加工（LLM.callChat 批次處理）
Creator Service_Catalog 更新 SEO 欄位（Sync_Status = 'draft'）
    ↓ 人工審核（Creator form 介面）
Creator Service_Catalog 確認（Sync_Status = 'pending_sync'）
    ↓ n8n 回寫觸發
SB: editEvent / ES: PUT /products 更新描述
    ↓ 回寫成功
Creator Service_Catalog 更新（Sync_Status = 'synced', Last_Synced_To = now）
```

### 7.3 LLM SEO 加工 Prompt

```
System: "你是專業的 SEO 文案專家。請為以下服務/商品產出 SEO 優化內容。
必須使用繁體中文。目標市場：台灣。"

User: "
【原始描述】
{Raw_Description}

【服務/商品名稱】{Name}
【分類】{Category}
【價格】NT${Price}

請產出以下欄位（嚴格 JSON 格式）：
{
  \"seo_title\": \"SEO 標題（60 字內，含關鍵字）\",
  \"seo_description\": \"SEO meta description（155 字內，含行動呼籲）\",
  \"seo_keywords\": \"3-5 個目標關鍵字，逗號分隔\",
  \"og_title\": \"社群分享標題（40 字內，吸引點擊）\",
  \"og_description\": \"社群分享描述（80 字內）\",
  \"cleaned_description\": \"優化後的正式描述（保留原意，提升可讀性和 SEO 友善度）\",
  \"llm_description\": \"一段式描述，合併目的+功能+適用情境，供 AI 推薦系統使用（100-200 字）\"
}
"
```

**LLM 選項**：`model: claude-haiku`, `max_tokens: 800`, `temperature: 0.5`

### 7.4 同步狀態機

```
pending → (LLM 加工) → draft → (人工審核) → pending_sync → (n8n 回寫) → synced
                                    ↓                              ↓
                                 rejected                      conflict
                                 (修改後重回 draft)            (回寫失敗，需排查)
```

---

## 八、實作優先序與依賴

### 8.1 Quick Wins（0 開發量，可立即做）

1. **LINE Rich Menu 加「預約老師」按鈕** — 只需一個 SimplyBook 預約連結
2. **符令交付 push 附帶老師推薦文案** — 修改 n8n 工作流，在交付訊息尾部加固定文案 + SB 連結
3. **週運勢 CTA 輪替** — 偶爾把 CTA 改為「預約老師」

### 8.2 Phase 2A — LLM 推薦引擎 + Service_Catalog（最高優先）

| 優先序 | 工作項 | 依賴 | 說明 |
|--------|--------|------|------|
| P0 | Creator 建立 `Service_Catalog` 表 | 無 | 統一目錄，含 SEO + LLM 欄位 |
| P0 | 手動錄入 SimplyBook 預約項目 + EasyStore 商品至 `Service_Catalog` | P0 | 含 `LLM_Description`、`Target_Question_Types` |
| P0 | 數位符令也加入 `Service_Catalog`（Source=Talisman） | P0 | 讓 LLM 可以統一比對 |
| P1 | 新增 `LLM.recommendNextAction.deluge` | P0 | Haiku 模型，含 fallback |
| P1 | 新增 `Recommendation_Logs` 表 | 無 | 追蹤推薦→點擊→轉換 |
| P2 | 修改 `API.liffDivinationMvp` 的 `next_action` | P1 | 從固定 → 動態推薦 |
| P2 | LIFF 前端支援 `smart_recommend` 渲染 | P2 | 推薦卡片 + fallback 按鈕 |
| P3 | LINE push 訊息模板更新 | P2 | 含推薦理由 + 多選項 |

### 8.3 Phase 2B — SimplyBook 預約閉環

| 優先序 | 工作項 | 依賴 | 說明 |
|--------|--------|------|------|
| P0 | SimplyBook 帳號設定（老師/項目/自訂欄位/Webhook） | 無 | 後台設定 |
| P0 | Creator 新增 `Booking_Logs` 表 | 無 | 預約紀錄 |
| P1 | 修正 `Webhook.handleSimplyBook.deluge` | P0 | 對照真實欄位 |
| P1 | 新增 Creator API: `API.handleSimplyBookWebhook` | P1 | Custom API endpoint |
| P1 | n8n 新增 `SimplyBook_Webhook__Booking_Sync.json` | P0 | webhook → Creator |
| P2 | Creator 新增 `Teachers` 表 | 無 | 老師主檔 + SB provider ID |
| P2 | LINE push 預約確認/提醒訊息 | P1 | |
| P3 | n8n 排程：SB `getEventList` → `Service_Catalog` 自動同步 | P0 | 定期拉取 |

### 8.4 Phase 2C — SEO 清洗流程

| 優先序 | 工作項 | 依賴 | 說明 |
|--------|--------|------|------|
| P0 | n8n 新增 `SB_Pull_Services.json` 工作流 | 2B-P0 | 排程拉取 |
| P1 | n8n 新增 `Catalog_SEO_Generate.json` 工作流 | P0 | LLM 批次加工 |
| P2 | n8n 新增 `SB_Push_Description.json` 工作流 | P1 | 審核後回寫 |
| P2 | n8n 新增 `ES_Pull_Products.json` + `ES_Push_Description.json` | ES 帳號 | 同上 |

### 8.5 Phase 3 — EasyStore 商品閉環

| 優先序 | 工作項 | 依賴 | 說明 |
|--------|--------|------|------|
| P0 | EasyStore Partner 帳號申請 + API 憑證 | 無 | 可能需 1-2 週審核 |
| P0 | 商品上架 EasyStore | 無 | 與 API 申請可並行 |
| P1 | Creator 新增 `Product_Orders` 表 | 無 | 訂單追蹤 |
| P1 | 導流中間頁 LIFF（追蹤 lineUserId + redirect） | P0 | |
| P2 | n8n 新增 `EasyStore_Webhook__Order_Sync.json` | P0 | webhook → Creator |
| P2 | LINE Flex Message 商品卡片模板 | P1 | |
| P3 | Email 匹配邏輯（ES customer → Creator Clients_Report） | P1 | |
| P4 | 全漏斗轉換報表 | 全部完成 | Creator Report |

---

## 九、新增資料模型規格

### 9.1 `Service_Catalog`（核心統一目錄）

> 詳見 [第二章](#二服務商品目錄管理與雙向同步) 完整欄位表。

### 9.2 `Booking_Logs`（Phase 2）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Booking_ID` | text (unique) | SimplyBook 預約 ID |
| `Client_Link` | lookup → Clients_Report | |
| `Line_User_ID` | text | |
| `Provider_Name` | text | 老師名稱 |
| `Provider_ID` | text | SB provider ID |
| `Service_Name` | text | 預約項目 |
| `Service_ID` | text | SB service ID |
| `Booking_DateTime` | datetime | 預約時間 |
| `Status` | picklist | 待確認/已確認/已完成/已取消/未到 |
| `Source_Divination_Log` | lookup → Divination_Logs | 觸發此預約的占卜紀錄（nullable） |
| `Recommendation_Source` | picklist | auto_trigger/manual/rich_menu |
| `SimplyBook_Raw` | text (multi-line) | 原始 webhook JSON |
| `Price` | decimal | |
| `Created_At` | datetime | |
| `Updated_At` | datetime | |

### 9.3 `Recommendation_Logs`（推薦追蹤）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Divination_Log_Link` | lookup → Divination_Logs | |
| `Line_User_ID` | text | |
| `Catalog_Items_Shown` | text | 推薦的 catalog_id 清單 (JSON) |
| `LLM_Response_Raw` | text (multi-line) | LLM 原始回應 |
| `Primary_Catalog_ID` | text | 主推薦項目 ID |
| `Primary_Reason` | text | 推薦理由 |
| `Primary_Urgency` | picklist | high/medium/low |
| `Recommended_At` | datetime | |
| `Clicked_At` | datetime (nullable) | |
| `Clicked_Catalog_ID` | text (nullable) | 用戶實際點擊的項目 |
| `Converted_At` | datetime (nullable) | 完成購買/預約時間 |
| `Conversion_Type` | picklist (nullable) | talisman/booking/product |

### 9.4 `Teachers`（老師主檔）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `Name` | text | |
| `SimplyBook_Provider_ID` | text | |
| `Specialty_Question_Types` | multi-select | 愛情/婚姻/工作/財運/健康/入煞 |
| `Description` | text (multi-line) | |
| `Photo_URL` | URL | |
| `Active` | boolean | |
| `Sort_Order` | number | |

### 9.5 `Product_Orders`（Phase 3 訂單）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `EasyStore_Order_ID` | text (unique) | |
| `Client_Link` | lookup → Clients_Report (nullable) | |
| `Line_User_ID` | text (nullable) | |
| `Customer_Email` | email | |
| `Order_Total` | decimal | |
| `Order_Status` | picklist | pending/paid/shipped/completed/cancelled |
| `Items_Summary` | text | JSON 或逗號分隔 |
| `Recommendation_Link` | lookup → Recommendation_Logs (nullable) | |
| `EasyStore_Raw` | text (multi-line) | |
| `Created_At` | datetime | |
| `Updated_At` | datetime | |

---

## 十、新增 API 端點與 n8n 工作流

### 10.1 新增 Creator API 端點

| API 端點 | 用途 | 觸發來源 |
|----------|------|----------|
| `API.handleSimplyBookWebhook` | 處理 SB 預約 webhook | n8n / Zoho Flow |
| `API.handleEasyStoreWebhook` | 處理 ES 訂單 webhook | n8n |
| `API.trackRecommendationClick` | 記錄推薦連結點擊 | LIFF 中間頁 / redirect |
| `API.syncCatalogFromSB` | 接收 n8n 推送的 SB 服務資料 | n8n 排程 |
| `API.syncCatalogFromES` | 接收 n8n 推送的 ES 商品資料 | n8n 排程 |
| `API.pushCatalogToSB` | 回寫清洗後資料至 SB | n8n（人工審核後） |
| `API.pushCatalogToES` | 回寫清洗後資料至 ES | n8n（人工審核後） |

### 10.2 現有 n8n 工作流（Phase 1，已部署）

| 工作流 | 觸發 | 用途 | Phase 2/3 需修改？ |
|--------|------|------|-------------------|
| `ECPay_Paid_Notify__LINE_Push.json` | ECPay webhook | 付款完成 → LINE push 交付連結 | ✅ 需修改：交付訊息尾部加老師推薦文案 + SB 連結 |
| `LINE_Webhook__Reply.json` | LINE webhook | LINE 文字訊息 → Creator API → 回覆 | 暫不修改 |
| `LINE_Webhook__Router.json` | LINE webhook | [WIP - 勿啟用] 訊息類型路由模板 | 暫不修改 |
| `Weekly_Fortune__NoonBaZi__Generate_And_Queue.json` | Cron (週一 11:55) | 週運勢 → Creator queue | ✅ 後續：CTA 分層邏輯 |
| `Voice_To_Copy__Queue_Template.json` | Voice webhook | 語音 → 文字 → Creator queue | 不相關 |
| `Winds_News__Remake__Queue_Template.json` | News webhook | 新聞 → Creator queue | 不相關 |

### 10.3 新增 n8n 工作流（Phase 2/3）

| 工作流 | 觸發 | 用途 |
|--------|------|------|
| `SimplyBook_Webhook__Booking_Sync.json` | SB Webhook | 預約事件 → Creator |
| `EasyStore_Webhook__Order_Sync.json` | ES Webhook | 訂單事件 → Creator |
| `SB_Pull_Services.json` | 排程（每日）/ 手動 | `getEventList` → Service_Catalog |
| `ES_Pull_Products.json` | 排程（每日）/ 手動 | `GET /products` → Service_Catalog |
| `Catalog_SEO_Generate.json` | Creator record trigger | LLM 產出 SEO 欄位 |
| `SB_Push_Description.json` | 手動（審核後） | Creator → `editEvent` |
| `ES_Push_Description.json` | 手動（審核後） | Creator → `PUT /products` |
| `Booking_Reminder__LINE_Push.json` | 排程（每小時） | 預約前 24h LINE 提醒 |
| `Re-engagement__Nudge.json` | 排程（每日） | 7天未購買 → LINE push |
| `Post_Consultation__Product_Push.json` | Booking_Logs 狀態變更 | 諮詢完成 3 天後推薦商品 |

---

## 十一、技術風險與緩解

| 風險 | 影響 | 緩解策略 |
|------|------|----------|
| LLM 推薦增加占卜回應延遲 | 使用者等待時間增加 | Haiku 模型 + 預篩 catalog → 控制在 <2秒 |
| LLM 推薦品質不穩定 | 推薦不相關項目 | 永遠保留符令 fallback；記錄 log 做迭代；temperature=0.3 |
| SimplyBook webhook 欄位與假設不符 | `Webhook.handleSimplyBook.deluge` 失效 | 先用 n8n 接 raw payload 確認真實結構 |
| EasyStore Partner API 審核時間 | Phase 3 延後 | 先用導流模式（不需 API），手動對帳 |
| n8n CE 執行紀錄只留 24h | debug 困難 | 所有事件回寫 Creator SSOT（`*_Raw` 欄位） |
| SB LIFF 與自建 LIFF 衝突 | UX 混亂 | 不使用 SB LIFF，統一從自建 LIFF 導出 |
| LINE push 頻率過高 | 掉粉 | 同一 user 每週最多 1 次推薦 push |
| 跨系統 identity 無法匹配 | 漏斗斷裂 | LINE User ID 為核心 key；SB 用自訂欄位；ES 用 email + 中間頁 |
| Service_Catalog 資料維護成本 | 資料過期 | 初期手動，後續建 n8n 排程自動同步 + Sync_Status 狀態機 |
| SEO 回寫覆蓋 SB/ES 人工修改 | 資料衝突 | `Last_Synced_From` vs `Last_Synced_To` 時間戳比對 + conflict 狀態 |
| SB API 5,000 次/天 rate limit | 同步頻率受限 | 目前規模足夠，排程每日一次即可 |

---

## 十二、部署函數清單（按代理分工）

> 本章列出所有需部署的函數/工作流/前端改動，按負責代理分類。每個項目包含：動作類型、輸入輸出、依賴、內容摘要。部署順序已考慮依賴關係。

### 12.1 Creator 代理 — Zoho Creator Forms + Deluge 函數

#### A. Form（表）建立（優先部署，其他函數依賴這些表）

| # | 表名 | 動作 | 欄位數 | 依賴 | 內容摘要 |
|---|------|------|--------|------|----------|
| C-01 | `Service_Catalog` | 新增 | 24 | 無 | 統一目錄表。整合 SB 預約項目 + ES 商品 + 符令。含 `LLM_Description`（供推薦引擎）、SEO 欄位（供清洗回寫）、`Sync_Status` 狀態機。完整欄位定義見 §2.1 |
| C-02 | `Recommendation_Logs` | 新增 | 13 | `Divination_Logs` (lookup) | 記錄每次 LLM 推薦事件。追蹤推薦→點擊→轉換全鏈路。`LLM_Response_Raw` 保存原始回應供迭代。完整欄位見 §9.3 |
| C-03 | `Booking_Logs` | 新增 | 16 | `Clients_Report` (lookup), `Divination_Logs` (lookup) | SimplyBook 預約紀錄。狀態流：待確認→已確認→已完成/已取消/未到。`SimplyBook_Raw` 保存原始 webhook JSON。完整欄位見 §9.2 |
| C-04 | `Teachers` | 新增 | 7 | 無 | 老師主檔。`SimplyBook_Provider_ID` 對應 SB provider。`Specialty_Question_Types` multi-select 對應 7 種問題類型，供進階推薦匹配。完整欄位見 §9.4 |
| C-05 | `Product_Orders` | 新增 | 11 | `Clients_Report` (lookup), `Recommendation_Logs` (lookup) | EasyStore 訂單追蹤。由 ES webhook 回寫。`EasyStore_Raw` 保存原始 JSON。完整欄位見 §9.5 |

#### B. Deluge 函數 — 新增

| # | 函數名稱 | 動作 | 輸入 | 輸出 | 依賴表 | 呼叫外部服務 | 內容摘要 |
|---|----------|------|------|------|--------|-------------|----------|
| C-06 | `LLM.recommendNextAction.deluge` | **新增** | `original_question` (text), `question_type` (text), `free_summary` (text), `client_history` (Map), `filtered_catalog` (List) | JSON Map: `{recommendations: [{catalog_id, reason, urgency}]}` | `Service_Catalog` (讀取) | Anthropic Claude API (Haiku) | 核心推薦引擎。用 `Target_Question_Types` 預篩 catalog → 組裝 prompt → Haiku 模型語義比對 → 回傳 1-2 個推薦。Fallback：JSON 解析失敗/超時/空結果均回傳 null（由呼叫端退回 offer_unlock）。Prompt 設計見 §3.2。LLM 選項：model=haiku, max_tokens=300, temperature=0.3 |
| C-07 | `API.handleSimplyBookWebhook.deluge` | **新增** | HTTP POST body (SB webhook JSON) | `{success: true, booking_id: "..."}` | `Booking_Logs` (寫入), `Clients_Report` (讀/寫), `Divination_Logs` (讀取) | LINE Push API | Custom API endpoint。接收 n8n 轉發的 SB webhook payload → 解析預約資料 → 查找/建立 Clients_Report（以 email 或 line_user_id 匹配）→ 寫入 Booking_Logs → 若有 line_user_id 則 LINE push 預約確認 → 呼叫 CRM.syncContact |
| C-08 | `API.handleEasyStoreWebhook.deluge` | **新增** | HTTP POST body (ES webhook JSON) | `{success: true, order_id: "..."}` | `Product_Orders` (寫入), `Clients_Report` (讀取) | 無 | Custom API endpoint。接收 n8n 轉發的 ES webhook payload → 解析訂單資料 → 以 email 匹配 Clients_Report → 寫入 Product_Orders → 更新 Recommendation_Logs 轉換狀態（若有關聯） |
| C-09 | `API.trackRecommendationClick.deluge` | **新增** | `recommendation_log_id` (text), `clicked_catalog_id` (text) | `{success: true}` | `Recommendation_Logs` (更新) | 無 | 記錄使用者點擊推薦連結。由 LIFF 中間頁或 redirect tracker 呼叫。更新 `Clicked_At` 和 `Clicked_Catalog_ID` 欄位 |
| C-10 | `API.syncCatalogFromSB.deluge` | **新增** | `service_list` (List of Maps，n8n 從 SB getEventList 拉取後推送) | `{success: true, synced: N, created: N, updated: N}` | `Service_Catalog` (讀/寫) | 無 | 接收 n8n 推送的 SB 服務清單 → 逐筆比對 External_ID → 新增或更新 Service_Catalog 記錄 → 設定 Source=SimplyBook, Sync_Status=pending → 更新 Last_Synced_From |
| C-11 | `API.syncCatalogFromES.deluge` | **新增** | `product_list` (List of Maps，n8n 從 ES GET /products 拉取後推送) | `{success: true, synced: N, created: N, updated: N}` | `Service_Catalog` (讀/寫) | 無 | 同 C-10 但 Source=EasyStore。欄位對應：title→Name, body_html→Raw_Description, variants[0].price→Price, images[0].src→Image_URL |
| C-12 | `API.pushCatalogToSB.deluge` | **新增** | `catalog_id` (text) | `{success: true, sb_response: "..."}` | `Service_Catalog` (讀取/更新) | SimplyBook Admin API (`editEvent` JSON-RPC) | 讀取 Service_Catalog 記錄的 Cleaned_Description + SEO 欄位 → 組裝 editEvent JSON-RPC 呼叫 → 回寫 SB → 更新 Sync_Status=synced, Last_Synced_To=now。需 Admin API token（`getUserToken`）|
| C-13 | `API.pushCatalogToES.deluge` | **新增** | `catalog_id` (text) | `{success: true, es_response: "..."}` | `Service_Catalog` (讀取/更新) | EasyStore REST API (`PUT /products`) | 讀取 Service_Catalog 記錄 → 組裝 PUT body（title, body_html, meta_title, meta_description）→ 呼叫 ES API → 更新 Sync_Status=synced, Last_Synced_To=now。需 OAuth access token |

#### C. Deluge 函數 — 修改現有

| # | 函數名稱 | 動作 | 修改內容 | 依賴 |
|---|----------|------|----------|------|
| C-14 | `API.liffDivinationMvp.deluge` | **修改** | 將 `next_action` 從固定 `offer_unlock` 改為動態推薦。新增邏輯：(1) 從 Service_Catalog 篩選候選（`Target_Question_Types` 匹配）(2) 呼叫 `LLM.recommendNextAction` (3) 組裝 `smart_recommend` 類型的 next_action，含 primary/secondary/fallback (4) 寫入 Recommendation_Logs。詳見 §3.3 | C-01 (`Service_Catalog`), C-02 (`Recommendation_Logs`), C-06 (`LLM.recommendNextAction`) |
| C-15 | `Webhook.handleSimplyBook.deluge` | **修改** | (1) 對照 SB webhook 真實欄位名稱（目前皆為假設值）(2) 新增 `Line_User_ID` 取得邏輯（從 `custom_field[line_user_id]`）(3) 新增寫入 Booking_Logs (4) 新增 LINE push 預約確認通知。需先用 n8n 接收 raw payload 確認真實結構 | C-03 (`Booking_Logs`) |

#### D. Creator App Variables — 新增

| # | Variable | 用途 |
|---|----------|------|
| C-16 | `SimplyBook.Company_Login` | SB 公司代碼（用於 API 認證） |
| C-17 | `SimplyBook.API_Key` | SB API Key（讀取用 token） |
| C-18 | `SimplyBook.Admin_Username` | SB 管理帳號（寫入用 token） |
| C-19 | `SimplyBook.Admin_Password` | SB 管理密碼 |
| C-20 | `SimplyBook.Webhook_Secret` | SB Webhook 驗證密鑰（如有） |
| C-21 | `EasyStore.Shop_URL` | ES 商店 URL |
| C-22 | `EasyStore.Access_Token` | ES OAuth Access Token |
| C-23 | `LLM.Recommendation_Model` | 推薦引擎專用模型（預設 `claude-haiku-4-20250514`，可獨立調整） |

---

### 12.2 n8n 代理 — 工作流

#### A. 現有工作流修改

| # | 工作流 | 動作 | 修改內容 | 依賴 |
|---|--------|------|----------|------|
| N-01 | `ECPay_Paid_Notify__LINE_Push.json` | **修改** | 在符令交付 LINE push 訊息尾部加入老師推薦文案區塊：「如需更深入的專業諮詢，可預約老師：{SB 預約連結}」。條件：固定附加（Phase 2A Quick Win），後續可改為查詢 Creator 判斷是否顯示 | 無（僅文案修改） |

#### B. 新增工作流 — SimplyBook 相關

| # | 工作流 | 動作 | 觸發方式 | 節點清單 | 呼叫 Creator API | 依賴 |
|---|--------|------|----------|----------|-----------------|------|
| N-02 | `SimplyBook_Webhook__Booking_Sync.json` | **新增** | SimplyBook Webhook（n8n 原生 SB trigger 或 generic webhook） | ① SB Trigger/Webhook 接收 → ② 解析 payload（提取 booking_id, client_*, service_*, provider_*）→ ③ HTTP Request 呼叫 Creator API → ④ 錯誤處理（retry + 記 log） | `API.handleSimplyBookWebhook` (C-07) | C-07 已部署, SB webhook URL 已設定 |
| N-03 | `SB_Pull_Services.json` | **新增** | Schedule Trigger（每日 06:00）或 Manual Trigger | ① 取得 SB API token（JSON-RPC `getToken`）→ ② 呼叫 `getEventList`（JSON-RPC）→ ③ 解析回傳清單 → ④ 逐筆對應欄位（id→External_ID, name→Name, description→Raw_Description, price→Price, picture_path→Image_URL, is_active→Active）→ ⑤ HTTP Request 呼叫 Creator API → ⑥ 記錄同步結果 | `API.syncCatalogFromSB` (C-10) | C-10 已部署, SB API Key 已設定 (C-16, C-17) |
| N-04 | `SB_Push_Description.json` | **新增** | Manual Trigger（人工審核後手動執行）或 Creator Webhook（Sync_Status 改為 pending_sync 觸發） | ① 呼叫 Creator API 取得待回寫記錄（Sync_Status=pending_sync, Source=SimplyBook）→ ② 取得 SB Admin API token（`getUserToken`）→ ③ 逐筆呼叫 `editEvent`（JSON-RPC，傳入 Cleaned_Description）→ ④ 呼叫 Creator API 更新 Sync_Status=synced | `API.pushCatalogToSB` (C-12) 或直接在 n8n 中處理 SB API 呼叫 | C-12 已部署（或 n8n 直接呼叫 SB API）, SB Admin 憑證 (C-18, C-19) |

#### C. 新增工作流 — EasyStore 相關

| # | 工作流 | 動作 | 觸發方式 | 節點清單 | 呼叫 Creator API | 依賴 |
|---|--------|------|----------|----------|-----------------|------|
| N-05 | `EasyStore_Webhook__Order_Sync.json` | **新增** | Generic Webhook（ES webhook POST） | ① Webhook 接收 → ② 驗證 webhook（如 ES 有 HMAC 驗證）→ ③ 判斷事件類型（orders/create, orders/paid, orders/fulfilled）→ ④ 呼叫 Creator API → ⑤ 若有 LINE User ID（從 Recommendation_Logs 反查）→ 呼叫 LINE Push API 通知 | `API.handleEasyStoreWebhook` (C-08) | C-08 已部署, ES webhook URL 已設定 |
| N-06 | `ES_Pull_Products.json` | **新增** | Schedule Trigger（每日 06:30）或 Manual Trigger | ① HTTP Request: `GET https://{shop}/api/3.0/products.json`（header: EasyStore-Access-Token）→ ② 解析 products 陣列 → ③ 逐筆對應欄位 → ④ 呼叫 Creator API | `API.syncCatalogFromES` (C-11) | C-11 已部署, ES Access Token (C-22) |
| N-07 | `ES_Push_Description.json` | **新增** | Manual Trigger 或 Creator Webhook | ① 取得待回寫記錄（Source=EasyStore, Sync_Status=pending_sync）→ ② 逐筆 HTTP Request: `PUT https://{shop}/api/3.0/products/{id}.json`（body: title, body_html, meta_title, meta_description）→ ③ 更新 Creator Sync_Status | `API.pushCatalogToES` (C-13) 或直接處理 | C-13 已部署, ES Access Token (C-22) |

#### D. 新增工作流 — SEO 清洗

| # | 工作流 | 動作 | 觸發方式 | 節點清單 | 呼叫 Creator API | 依賴 |
|---|--------|------|----------|----------|-----------------|------|
| N-08 | `Catalog_SEO_Generate.json` | **新增** | Manual Trigger（批次）或 Creator Webhook（Sync_Status=pending 觸發） | ① 取得 Service_Catalog 中 Sync_Status=pending 的記錄 → ② 逐筆組裝 SEO prompt（見 §7.3）→ ③ HTTP Request 呼叫 Anthropic Claude API (Haiku, max_tokens=800, temp=0.5) → ④ 解析 JSON 回應 → ⑤ 呼叫 Creator API 更新 SEO 欄位 + LLM_Description + Sync_Status=draft | 直接更新 `Service_Catalog`（透過 Creator API） | Anthropic API Key, Service_Catalog 有 pending 記錄 |

#### E. 新增工作流 — 再行銷排程

| # | 工作流 | 動作 | 觸發方式 | 節點清單 | 呼叫 Creator API | 依賴 |
|---|--------|------|----------|----------|-----------------|------|
| N-09 | `Booking_Reminder__LINE_Push.json` | **新增** | Schedule Trigger（每小時） | ① 呼叫 Creator API 查詢未來 24h 內的 Booking_Logs（Status=已確認）→ ② 篩選尚未發送提醒的記錄 → ③ 逐筆呼叫 LINE Push API 發送提醒 → ④ 回寫 Creator 標記已提醒 | 查詢 `Booking_Logs` | C-03 已部署 |
| N-10 | `Re-engagement__Nudge.json` | **新增** | Schedule Trigger（每日 10:00） | ① 呼叫 Creator API 查詢：首次占卜 7 天前 + 未購買符令的使用者 → ② 從 Service_Catalog 取得推薦項目 → ③ 呼叫 LLM 或使用預設推薦 → ④ LINE Push 符令 + 推薦 CTA → ⑤ 限制：同一 user 每週最多 1 次 | 查詢 `Divination_Logs`, `Talisman_Purchases`, `Recommendation_Logs` | C-01, C-02 已部署 |
| N-11 | `Post_Consultation__Product_Push.json` | **新增** | Schedule Trigger（每日 10:30）或 Creator Webhook（Booking_Logs Status 變更為「已完成」） | ① 查詢 3 天前完成的諮詢（Booking_Logs.Status=已完成, 3天前）→ ② 根據諮詢的問題類型從 Service_Catalog 篩選 EasyStore 商品 → ③ 組裝 LINE Flex Message 商品卡片（Carousel）→ ④ LINE Push API 發送 → ⑤ 寫入 Recommendation_Logs | 查詢 `Booking_Logs`, `Service_Catalog`; 寫入 `Recommendation_Logs` | C-01, C-02, C-03 已部署 |

---

### 12.3 LIFF 代理 — 前端

| # | 檔案 | 動作 | 功能 | 依賴 Creator API | UI 元件 |
|---|------|------|------|-----------------|---------|
| L-01 | `liff/index.html` | **修改** | **(1) CTA 動態渲染**：目前「解鎖完整版」按鈕是 disabled placeholder。需改為根據 `API.liffDivinationMvp` 回傳的 `next_action.kind` 動態渲染：`offer_unlock` → 單一符令按鈕；`smart_recommend` → 推薦卡片 + 符令 fallback。**(2) 推薦卡片 UI**：顯示推薦項目的 name、reason、price、image，CTA 按鈕連結至 SB/ES。**(3) 點擊追蹤**：點擊推薦 CTA 時先呼叫 `API.trackRecommendationClick`（C-09）再跳轉。**(4) 多選項佈局**：primary 推薦（大卡片） + secondary（小卡片） + 符令 fallback（文字連結） | `API.liffDivinationMvp` (C-14 修改後的回傳), `API.trackRecommendationClick` (C-09) | 推薦卡片元件（圖片+名稱+理由+價格+CTA）、fallback 文字連結、loading 狀態 |
| L-02 | `liff/redirect.html` | **新增** | **EasyStore 導流中間頁**。流程：LIFF 開啟 → 取得 LINE userId → 呼叫 `API.trackRecommendationClick` 記錄點擊 → redirect 至 EasyStore 商品頁。URL 格式：`/redirect.html?catalog_id={id}&rec_log_id={id}`。需處理：LIFF 未初始化時的 fallback（直接 redirect 不追蹤） | `API.trackRecommendationClick` (C-09) | 載入動畫（「正在為您開啟商品頁面...」）、LIFF SDK 初始化 |

---

### 12.4 部署順序總覽（跨代理依賴圖）

```
Phase 2A — LLM 推薦引擎（最高優先）
═══════════════════════════════════════
Step 1 (Creator):  C-01 Service_Catalog 表
                   C-02 Recommendation_Logs 表
                   C-23 App Variable: LLM.Recommendation_Model

Step 2 (Creator):  C-06 LLM.recommendNextAction.deluge
                   C-09 API.trackRecommendationClick.deluge
                   ↑ 依賴 Step 1

Step 3 (Creator):  C-14 修改 API.liffDivinationMvp.deluge
                   ↑ 依賴 Step 2

Step 4 (LIFF):     L-01 修改 liff/index.html
                   ↑ 依賴 Step 3（需 API 回傳新格式）

Step 5 (n8n):      N-01 修改 ECPay_Paid_Notify__LINE_Push.json
                   ↑ 無硬依賴，可與 Step 1-4 平行

Phase 2B — SimplyBook 預約閉環
═══════════════════════════════════════
Step 6 (Creator):  C-03 Booking_Logs 表
                   C-04 Teachers 表
                   C-16~C-20 App Variables (SB 憑證)

Step 7 (Creator):  C-07 API.handleSimplyBookWebhook.deluge
                   C-15 修改 Webhook.handleSimplyBook.deluge
                   ↑ 依賴 Step 6

Step 8 (n8n):      N-02 SimplyBook_Webhook__Booking_Sync.json
                   ↑ 依賴 Step 7

Step 9 (n8n):      N-03 SB_Pull_Services.json
                   ↑ 依賴 C-10 (需先部署 syncCatalogFromSB)

Step 9.5 (Creator): C-10 API.syncCatalogFromSB.deluge
                    C-12 API.pushCatalogToSB.deluge
                    ↑ 依賴 Step 6

Step 10 (n8n):     N-09 Booking_Reminder__LINE_Push.json
                   ↑ 依賴 Step 6

Phase 2C — SEO 清洗
═══════════════════════════════════════
Step 11 (n8n):     N-08 Catalog_SEO_Generate.json
                   N-04 SB_Push_Description.json
                   ↑ 依賴 Step 9

Phase 3 — EasyStore 商品閉環
═══════════════════════════════════════
Step 12 (Creator): C-05 Product_Orders 表
                   C-21~C-22 App Variables (ES 憑證)

Step 13 (Creator): C-08 API.handleEasyStoreWebhook.deluge
                   C-11 API.syncCatalogFromES.deluge
                   C-13 API.pushCatalogToES.deluge
                   ↑ 依賴 Step 12

Step 14 (n8n):     N-05 EasyStore_Webhook__Order_Sync.json
                   N-06 ES_Pull_Products.json
                   N-07 ES_Push_Description.json
                   ↑ 依賴 Step 13

Step 15 (LIFF):    L-02 新增 liff/redirect.html
                   ↑ 依賴 C-09 (Step 2)

再行銷排程（Phase 2/3 穩定後）
═══════════════════════════════════════
Step 16 (n8n):     N-10 Re-engagement__Nudge.json
                   N-11 Post_Consultation__Product_Push.json
                   ↑ 依賴 Step 8, Step 14 穩定運行
```

---

## 參考資源

- [SimplyBook Developer API](https://simplybook.me/en/api/developer-api)
- [SimplyBook Admin API Methods](https://help.simplybook.me/index.php/Company_administration_service_methods)
- [SimplyBook User API Guide](https://help.simplybook.me/index.php/User_API_guide)
- [SimplyBook n8n Integration](https://simplybook.me/en/n8n-integration)
- [EasyStore Developer Platform](https://developers.easystore.co/)
- [EasyStore API Authentication](https://developers.easystore.co/docs/api/authentication)
- [EasyStore API Scopes](https://developers.easystore.co/docs/api/getting-started/scopes)
- [EasyStore Webhooks](https://developers.easystore.co/docs/api/webhooks)
- [EasyStore Postman API Docs](https://postman.easystore.co/)
