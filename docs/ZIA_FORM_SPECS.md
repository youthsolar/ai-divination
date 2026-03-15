# Zia 表單建立規格書

> 給 Zoho Creator Zia 建表用，共 5 張空表 + 1 張現有表改欄位
> 應用程式：AI易經（link_name: ai-divination）
> 日期：2026-03-15

---

## 重要：Lookup 關係說明

以下表單中標示 `lookup` 的欄位，請用 Creator 的 Lookup 功能連結到對應表單，
這樣資料才能正確關聯，不需要重複儲存聯絡人、LINE ID 等資訊。

現有可關聯的表單：
- `Clients_Report`（個案）— 已有 Line_User_ID、Email、姓名等
- `Divination_Logs`（紀錄）— 已有 Client_Link（lookup → Clients_Report）

---

## 表 1：Service_Catalog（統一服務目錄）

顯示名稱：服務目錄

| # | 欄位 link_name | 顯示名稱 | 類型 | 必填 | 備註 |
|---|---|---|---|---|---|
| 1 | Source | 來源 | picklist | 是 | 選項：SimplyBook / EasyStore / Talisman |
| 2 | External_ID | 外部ID | single-line | 否 | SB service ID 或 ES product handle |
| 3 | Name | 名稱 | single-line | 是 | 項目或商品名稱 |
| 4 | Category | 分類 | multi-select | 否 | 自定義分類標籤 |
| 5 | Purpose | 目的 | multi-line | 否 | 目的說明 |
| 6 | Functions | 功能 | multi-line | 否 | 功能說明 |
| 7 | Specifications | 規格 | multi-line | 否 | 規格或條件 |
| 8 | Target_Question_Types | 適用問題類型 | multi-select | 否 | 選項：愛情 / 婚姻 / 工作 / 財運 / 健康 / 入煞 / 其他 |
| 9 | Target_Situations | 適用情境 | multi-line | 否 | 供 LLM 比對用 |
| 10 | Price | 價格 | decimal | 否 | TWD |
| 11 | Booking_URL | 預約連結 | URL | 否 | SimplyBook 用 |
| 12 | Product_URL | 商品連結 | URL | 否 | EasyStore 用 |
| 13 | Provider_Name | 老師名稱 | single-line | 否 | |
| 14 | Image_URL | 圖片網址 | URL | 否 | |
| 15 | Priority_Score | 排序權重 | number | 否 | |
| 16 | Active | 啟用 | boolean | 否 | 預設 true |
| 17 | LLM_Description | LLM描述 | multi-line | 否 | 給 AI 讀的一段式描述 |
| 18 | Raw_Description | 原始描述 | multi-line | 否 | SB/ES 原始內容 |
| 19 | SEO_Title | SEO標題 | single-line | 否 | |
| 20 | SEO_Description | SEO描述 | single-line | 否 | meta description |
| 21 | SEO_Keywords | SEO關鍵字 | single-line | 否 | |
| 22 | OG_Title | OG標題 | single-line | 否 | 社群分享標題 |
| 23 | OG_Description | OG描述 | single-line | 否 | 社群分享描述 |
| 24 | Cleaned_Description | 清洗描述 | multi-line | 否 | 清洗後正式描述 |
| 25 | Last_Synced_From | 上次拉取 | datetime | 否 | |
| 26 | Last_Synced_To | 上次回寫 | datetime | 否 | |
| 27 | Sync_Status | 同步狀態 | picklist | 否 | 選項：pending / draft / rejected / pending_sync / synced / conflict |

### Zia 建表指令（複製貼上用）

請建立一個名為「服務目錄」的表單，link name 為 Service_Catalog，包含以下欄位：
Source（來源）是必填的下拉選單，選項為 SimplyBook、EasyStore、Talisman。
External_ID（外部ID）是單行文字。
Name（名稱）是必填的單行文字，用來存項目或商品名稱。
Category（分類）是多選欄位。
Purpose（目的）是多行文字。
Functions（功能）是多行文字。
Specifications（規格）是多行文字。
Target_Question_Types（適用問題類型）是多選欄位，選項為愛情、婚姻、工作、財運、健康、入煞、其他。
Target_Situations（適用情境）是多行文字。
Price（價格）是小數欄位，單位為 TWD。
Booking_URL（預約連結）是 URL 欄位。
Product_URL（商品連結）是 URL 欄位。
Provider_Name（老師名稱）是單行文字。
Image_URL（圖片網址）是 URL 欄位。
Priority_Score（排序權重）是數字欄位。
Active（啟用）是布林欄位，預設為 true。
LLM_Description（LLM描述）是多行文字，用來存給 AI 讀的一段式描述。
Raw_Description（原始描述）是多行文字。
SEO_Title（SEO標題）是單行文字。
SEO_Description（SEO描述）是單行文字。
SEO_Keywords（SEO關鍵字）是單行文字。
OG_Title（OG標題）是單行文字。
OG_Description（OG描述）是單行文字。
Cleaned_Description（清洗描述）是多行文字。
Last_Synced_From（上次拉取）是日期時間欄位。
Last_Synced_To（上次回寫）是日期時間欄位。
Sync_Status（同步狀態）是下拉選單，選項為 pending、draft、rejected、pending_sync、synced、conflict。

---

## 表 2：Recommendation_Logs（推薦追蹤）

顯示名稱：推薦紀錄

| # | 欄位 link_name | 顯示名稱 | 類型 | 必填 | 備註 |
|---|---|---|---|---|---|
| 1 | Divination_Log_Link | 占卜紀錄 | **lookup → Divination_Logs** | 否 | 關聯占卜紀錄 |
| 2 | Catalog_Items_Shown | 展示項目 | multi-line | 否 | JSON 格式 |
| 3 | LLM_Response_Raw | LLM原始回應 | multi-line | 否 | |
| 4 | Primary_Catalog_ID | 主推薦ID | single-line | 否 | |
| 5 | Primary_Reason | 推薦理由 | single-line | 否 | |
| 6 | Primary_Urgency | 急迫度 | picklist | 否 | 選項：high / medium / low |
| 7 | Recommended_At | 推薦時間 | datetime | 否 | |
| 8 | Clicked_At | 點擊時間 | datetime | 否 | 可為空 |
| 9 | Clicked_Catalog_ID | 點擊項目ID | single-line | 否 | 可為空 |
| 10 | Converted_At | 轉換時間 | datetime | 否 | 可為空 |
| 11 | Conversion_Type | 轉換類型 | picklist | 否 | 選項：talisman / booking / product |

> 不需要獨立的 Line_User_ID 欄位，因為透過 Divination_Log_Link → Divination_Logs.Client_Link → Clients_Report.Line_User_ID 即可追溯。

### Zia 建表指令（複製貼上用）

請建立一個名為「推薦紀錄」的表單，link name 為 Recommendation_Logs，包含以下欄位：
Divination_Log_Link（占卜紀錄）是 lookup 欄位，關聯到 Divination_Logs 表單。
Catalog_Items_Shown（展示項目）是多行文字，用來存 JSON 格式資料。
LLM_Response_Raw（LLM原始回應）是多行文字。
Primary_Catalog_ID（主推薦ID）是單行文字。
Primary_Reason（推薦理由）是單行文字。
Primary_Urgency（急迫度）是下拉選單，選項為 high、medium、low。
Recommended_At（推薦時間）是日期時間欄位。
Clicked_At（點擊時間）是日期時間欄位，可為空。
Clicked_Catalog_ID（點擊項目ID）是單行文字，可為空。
Converted_At（轉換時間）是日期時間欄位，可為空。
Conversion_Type（轉換類型）是下拉選單，選項為 talisman、booking、product。

---

## 表 3：Booking_Logs（預約紀錄）

顯示名稱：預約紀錄

| # | 欄位 link_name | 顯示名稱 | 類型 | 必填 | 備註 |
|---|---|---|---|---|---|
| 1 | Booking_ID | 預約ID | single-line | 是 | Unique，SimplyBook 預約 ID |
| 2 | Client_Link | 個案 | **lookup → Clients_Report** | 否 | 關聯個案 |
| 3 | Provider_Name | 老師名稱 | single-line | 否 | |
| 4 | Provider_ID | 老師ID | single-line | 否 | SB provider ID |
| 5 | Service_Name | 服務項目 | single-line | 否 | |
| 6 | Service_ID | 服務ID | single-line | 否 | SB service ID |
| 7 | Booking_DateTime | 預約時間 | datetime | 否 | |
| 8 | Status | 狀態 | picklist | 否 | 選項：待確認 / 已確認 / 已完成 / 已取消 / 未到 |
| 9 | Source_Divination_Log | 來源占卜 | **lookup → Divination_Logs** | 否 | 可為空 |
| 10 | Recommendation_Source | 推薦來源 | picklist | 否 | 選項：auto_trigger / manual / rich_menu |
| 11 | SimplyBook_Raw | 原始資料 | multi-line | 否 | SimplyBook webhook JSON |
| 12 | Price | 價格 | decimal | 否 | |
| 13 | Created_At | 建立時間 | datetime | 否 | |
| 14 | Updated_At | 更新時間 | datetime | 否 | |

> 不需要獨立的 Line_User_ID 欄位，透過 Client_Link → Clients_Report.Line_User_ID 取得。

### Zia 建表指令（複製貼上用）

請建立一個名為「預約紀錄」的表單，link name 為 Booking_Logs，包含以下欄位：
Booking_ID（預約ID）是必填的單行文字，設為唯一值，用來存 SimplyBook 預約 ID。
Client_Link（個案）是 lookup 欄位，關聯到 Clients_Report 表單。
Provider_Name（老師名稱）是單行文字。
Provider_ID（老師ID）是單行文字，用來存 SimplyBook provider ID。
Service_Name（服務項目）是單行文字。
Service_ID（服務ID）是單行文字，用來存 SimplyBook service ID。
Booking_DateTime（預約時間）是日期時間欄位。
Status（狀態）是下拉選單，選項為待確認、已確認、已完成、已取消、未到。
Source_Divination_Log（來源占卜）是 lookup 欄位，關聯到 Divination_Logs 表單，可為空。
Recommendation_Source（推薦來源）是下拉選單，選項為 auto_trigger、manual、rich_menu。
SimplyBook_Raw（原始資料）是多行文字，用來存 SimplyBook webhook 的 JSON 資料。
Price（價格）是小數欄位。
Created_At（建立時間）是日期時間欄位。
Updated_At（更新時間）是日期時間欄位。

---

## 表 4：Teachers（老師主檔）

顯示名稱：老師

| # | 欄位 link_name | 顯示名稱 | 類型 | 必填 | 備註 |
|---|---|---|---|---|---|
| 1 | Name | 姓名 | single-line | 是 | |
| 2 | SimplyBook_Provider_ID | SB老師ID | single-line | 否 | SimplyBook provider ID |
| 3 | Specialty_Question_Types | 專長領域 | multi-select | 否 | 選項：愛情 / 婚姻 / 工作 / 財運 / 健康 / 入煞 |
| 4 | Description | 簡介 | multi-line | 否 | |
| 5 | Photo_URL | 頭像網址 | URL | 否 | |
| 6 | Active | 啟用 | boolean | 否 | 預設 true |
| 7 | Sort_Order | 排序 | number | 否 | |

### Zia 建表指令（複製貼上用）

請建立一個名為「老師」的表單，link name 為 Teachers，包含以下欄位：
Name（姓名）是必填的單行文字。
SimplyBook_Provider_ID（SB老師ID）是單行文字，用來存 SimplyBook 的 provider ID。
Specialty_Question_Types（專長領域）是多選欄位，選項為愛情、婚姻、工作、財運、健康、入煞。
Description（簡介）是多行文字。
Photo_URL（頭像網址）是 URL 欄位。
Active（啟用）是布林欄位，預設為 true。
Sort_Order（排序）是數字欄位。

---

## 表 5：Product_Orders（訂單紀錄）

顯示名稱：商品訂單

| # | 欄位 link_name | 顯示名稱 | 類型 | 必填 | 備註 |
|---|---|---|---|---|---|
| 1 | EasyStore_Order_ID | 訂單ID | single-line | 是 | Unique，EasyStore 訂單 ID |
| 2 | Client_Link | 個案 | **lookup → Clients_Report** | 否 | 可為空 |
| 3 | Customer_Email | 客戶信箱 | email | 否 | |
| 4 | Order_Total | 訂單金額 | decimal | 否 | |
| 5 | Order_Status | 訂單狀態 | picklist | 否 | 選項：pending / paid / shipped / completed / cancelled |
| 6 | Items_Summary | 商品明細 | multi-line | 否 | JSON 格式 |
| 7 | Recommendation_Link | 推薦來源 | **lookup → Recommendation_Logs** | 否 | 可為空 |
| 8 | EasyStore_Raw | 原始資料 | multi-line | 否 | EasyStore webhook JSON |
| 9 | Created_At | 建立時間 | datetime | 否 | |
| 10 | Updated_At | 更新時間 | datetime | 否 | |

> 不需要獨立的 Line_User_ID 欄位，透過 Client_Link → Clients_Report.Line_User_ID 取得。

### Zia 建表指令（複製貼上用）

請建立一個名為「商品訂單」的表單，link name 為 Product_Orders，包含以下欄位：
EasyStore_Order_ID（訂單ID）是必填的單行文字，設為唯一值，用來存 EasyStore 訂單 ID。
Client_Link（個案）是 lookup 欄位，關聯到 Clients_Report 表單，可為空。
Customer_Email（客戶信箱）是 email 欄位。
Order_Total（訂單金額）是小數欄位。
Order_Status（訂單狀態）是下拉選單，選項為 pending、paid、shipped、completed、cancelled。
Items_Summary（商品明細）是多行文字，用來存 JSON 格式資料。
Recommendation_Link（推薦來源）是 lookup 欄位，關聯到 Recommendation_Logs 表單，可為空。
EasyStore_Raw（原始資料）是多行文字，用來存 EasyStore webhook 的 JSON 資料。
Created_At（建立時間）是日期時間欄位。
Updated_At（更新時間）是日期時間欄位。

---

## 修改現有表：Divination_Logs（紀錄）

以下欄位需要新增到現有的 Divination_Logs 表單：

| # | 操作 | 欄位 link_name | 顯示名稱 | 類型 | 備註 |
|---|---|---|---|---|---|
| 1 | 修改 picklist | Divination_Method | 占卜方法 | picklist | 新增選項「籤詩」（現有：易經/塔羅） |
| 2 | 新增 | Oracle_System | 籤詩系統 | picklist | 選項：KongMing / GuanYin / GuanDi / None（預設 None） |
| 3 | 新增 | Oracle_Sign_Order | 籤序 | number | 整數 0-384 |
| 4 | 新增 | Oracle_Poem_Text | 籤文 | multi-line | 最大 500 字 |
| 5 | 新增 | Oracle_Interpretation_Snippet | 籤解摘要 | multi-line | 最大 2000 字 |
| 6 | 新增 | Oracle_Fortune_Level | 吉凶等級 | single-line | 最大 100 字 |

### Zia 修改指令（複製貼上用）

請在現有的 Divination_Logs（紀錄）表單中做以下修改：
第一，在現有的 Divination_Method（占卜方法）下拉選單中，新增一個選項「籤詩」，現有選項為易經和塔羅，不要刪除。
第二，新增 Oracle_System（籤詩系統）欄位，是下拉選單，選項為 KongMing、GuanYin、GuanDi、None，預設值為 None。
第三，新增 Oracle_Sign_Order（籤序）欄位，是數字欄位，整數，範圍 0 到 384。
第四，新增 Oracle_Poem_Text（籤文）欄位，是多行文字，最大 500 字。
第五，新增 Oracle_Interpretation_Snippet（籤解摘要）欄位，是多行文字，最大 2000 字。
第六，新增 Oracle_Fortune_Level（吉凶等級）欄位，是單行文字，最大 100 字。

---

## Lookup 關聯圖

```
Clients_Report（個案）
  ^
  |-- Client_Link (lookup)
  |
  +-- Divination_Logs（紀錄）
  |     ^
  |     |-- Divination_Log_Link (lookup)
  |     |
  |     +-- Recommendation_Logs（推薦紀錄）
  |     |     ^
  |     |     |-- Recommendation_Link (lookup)
  |     |     |
  |     |     +-- Product_Orders（商品訂單）
  |     |
  |     +-- Booking_Logs（預約紀錄）.Source_Divination_Log
  |
  +-- Booking_Logs（預約紀錄）.Client_Link
  +-- Product_Orders（商品訂單）.Client_Link
```

---

*Dora — Claude Code AI 助手 | 2026-03-15*
