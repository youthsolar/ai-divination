# 部署清單 — 2026-03-14 開發成果

> **製作者**：Dora（Claude Code）
> **日期**：2026-03-14
> **狀態**：程式碼已就緒，以下為 Creator / AppSail / n8n / GitHub Pages 的手動部署步驟
> **MCP 驗證**：已於 2026-03-14 用 Zoho MCP 比對 Creator 現有表單與欄位

---

## 總覽

| 來源 | 內容 | 新檔案數 | 部署複雜度 |
|------|------|---------|-----------|
| Zoe MVP-2 | 籤詩輔助模式 + 獨立求籤 | 12 | 中（建表+匯入+函數+AppSail） |
| Rowy Phase 2+3 | LLM 推薦 + SB/ES 整合 | 16 | 高（建表+函數+n8n+外部 API） |
| Phase 1 修復 | getTalismanByToken | 1 | 低（已部署） |

---

## Part A：Zoe 籤詩模式部署

### A-1. Divination_Logs 表修改 ⚠️ 最優先

> MCP 驗證：`Divination_Method` picklist 目前只有「易經/塔羅」，Oracle 欄位均不存在

**操作位置**：Creator → AI易經 → Divination_Logs → Edit Form

| # | 操作 | 欄位 link_name | 類型 | 值/設定 |
|---|------|---------------|------|---------|
| A1-1 | **修改** picklist | `Divination_Method` | picklist | 新增選項「籤詩」 |
| A1-2 | **新增** 欄位 | `Oracle_System` | picklist | KongMing / GuanYin / GuanDi / None（預設 None） |
| A1-3 | **新增** 欄位 | `Oracle_Sign_Order` | number | 整數，0-384 |
| A1-4 | **新增** 欄位 | `Oracle_Poem_Text` | multi-line | 長度 ≤ 500 |
| A1-5 | **新增** 欄位 | `Oracle_Interpretation_Snippet` | multi-line | 長度 ≤ 2000 |
| A1-6 | **新增** 欄位 | `Oracle_Fortune_Level` | single-line | 長度 ≤ 100 |

- [ ] 完成確認

---

### A-2. 建立 3 張籤詩表

> 完整欄位規格見 `docs/DIVINATION_AUXILIARY_MODE_PLAN.md` §2.2

#### A-2a. KongMing_Oracle（孔明大易神術，384 筆）

**操作**：Creator → AI易經 → 新增 Form → `KongMing_Oracle`

| 欄位 link_name | 類型 | 必填 | Unique | Index | 說明 |
|---------------|------|------|--------|-------|------|
| `Sign_Order` | single-line | ✅ | ✅ | — | 籤序文字（第 1 籤） |
| `Sign_Order_Num` | number | ✅ | ✅ | ✅ | 數字序號 1-384 |
| `Fortune_Level` | single-line | ✅ | — | — | 吉凶等級 |
| `Palace` | picklist | ✅ | — | — | 乾/坤/震/巽/坎/離/艮/兌 |
| `Current_Hexagram` | single-line | ✅ | — | ✅ | 現爻（交叉比對 I_Ching_Form.appearance） |
| `Change_Trigger` | single-line | — | — | — | 機變 |
| `Changed_Hexagram` | single-line | — | — | — | 變爻 |
| `Fortune_Category` | single-line | — | — | — | 吉凶分類 |
| `Five_Elements` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Symbol_1` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Symbol_2` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Symbol_3` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Symbol_4` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Symbol_5` | picklist | ✅ | — | — | 金/木/水/火/土 |
| `Poem_Text` | multi-line | ✅ | — | — | 籤文（≤500） |
| `Interpretation` | multi-line | ✅ | — | — | 籤解（≤2000） |

- [ ] 表已建立
- [ ] Sign_Order_Num 設為 Unique + Index
- [ ] Current_Hexagram 設為 Index

#### A-2b. GuanYin_Oracle（觀音靈籤，100 筆）

| 欄位 link_name | 類型 | 必填 | Unique | 說明 |
|---------------|------|------|--------|------|
| `Sign_Order` | single-line | ✅ | ✅ | 籤序 |
| `Sign_Order_Num` | number | ✅ | ✅ (Index) | 1-100 |
| `Fortune_Level` | single-line | ✅ | — | 吉凶 |
| `Poem_Title` | single-line | ✅ | — | 典故人物 |
| `Poem_Text` | multi-line | ✅ | — | 籤文 |
| `Holy_Meaning` | multi-line | — | — | 聖意 |
| `Sign_Interpretation` | multi-line | ✅ | — | 籤解 |
| `Divine_Guidance` | multi-line | — | — | 仙機 |
| `Allusion` | multi-line | — | — | 典故 |

- [ ] 表已建立

#### A-2c. GuanDi_Oracle（關帝靈籤，100 筆）

| 欄位 link_name | 類型 | 必填 | Unique | 說明 |
|---------------|------|------|--------|------|
| `Sign_Order` | single-line | ✅ | ✅ | 籤序 |
| `Sign_Order_Num` | number | ✅ | ✅ (Index) | 1-100 |
| `Fortune_Level` | single-line | ✅ | — | 吉凶 |
| `Poem_Title` | single-line | ✅ | — | 籤詩標題 |
| `Poem_Text` | multi-line | ✅ | — | 籤文 |
| `Holy_Meaning` | multi-line | — | — | 聖意 |
| `Sign_Interpretation` | multi-line | ✅ | — | 籤解 |
| `Meaning_Explanation` | multi-line | — | — | 釋意 |
| `Detailed_Explanation` | multi-line | — | — | 解釋 |
| `DongPo_Commentary` | multi-line | — | — | 東坡解 |
| `BiXian_Commentary` | multi-line | — | — | 碧仙注 |

- [ ] 表已建立

---

### A-3. CSV 匯入

| # | CSV 檔案 | 目標表 | 預期筆數 |
|---|---------|--------|---------|
| A3-1 | `data/divination-database/csv/kongming_oracle.csv` | KongMing_Oracle | 384 |
| A3-2 | `data/divination-database/csv/guanyin_oracle.csv` | GuanYin_Oracle | 100 |
| A3-3 | `data/divination-database/csv/guandi_oracle.csv` | GuanDi_Oracle | 100 |

**匯入步驟**：Creator → Import Data → 選表 → 上傳 CSV → 欄位映射 → 預覽 → 執行

**匯入後驗證**：
- [ ] KongMing_Oracle = 384 筆
- [ ] GuanYin_Oracle = 100 筆
- [ ] GuanDi_Oracle = 100 筆
- [ ] 隨機抽查 3 筆，Poem_Text 無亂碼
- [ ] Sign_Order_Num 範圍正確

---

### A-4. 部署 Oracle 函數到 Creator IDE

**操作**：Creator → AI易經 → Microservices → Functions → 新增

| # | 函數名稱 | 原始碼位置 | 類型 |
|---|---------|-----------|------|
| A4-1 | `Oracle.routeByQuestionType` | `zoho-creator/functions/oracle/Oracle.routeByQuestionType.deluge` | Standalone |
| A4-2 | `Oracle.selectSign` | `zoho-creator/functions/oracle/Oracle.selectSign.deluge` | Standalone |
| A4-3 | `Oracle.buildPromptContext` | `zoho-creator/functions/oracle/Oracle.buildPromptContext.deluge` | Standalone |
| A4-4 | `Oracle.calculateSignByBirthday` | `zoho-creator/functions/oracle/Oracle.calculateSignByBirthday.deluge` | Standalone |
| A4-5 | `Oracle.drawIndependent` | `zoho-creator/functions/oracle/Oracle.drawIndependent.deluge` | Standalone |
| A4-6 | `Oracle.formatOracleResponse` | `zoho-creator/functions/oracle/Oracle.formatOracleResponse.deluge` | Standalone |

- [ ] 6 個函數全部貼入並儲存
- [ ] 無編譯錯誤

---

### A-5. 建立 Custom API 端點

**操作**：Creator → AI易經 → Microservices → Custom API → 新增

| # | API 名稱 | Handler | Method | 說明 |
|---|---------|---------|--------|------|
| A5-1 | `drawOracle` | `Oracle.drawIndependent` | POST | 獨立求籤 API |

- [ ] 端點已建立
- [ ] 記下 Public Key：`________________`

---

### A-6. AppSail 新增 /liff-oracle 端點

**操作**：修改 `catalyst/appsail/divinationServer/index.js`

新增路由（參照現有 `/liff-submit` 模式）：
```javascript
// POST /liff-oracle → Oracle.drawIndependent
app.post('/liff-oracle', async (req, res) => {
  setCORSHeaders(res);
  const body = (typeof req.body === 'string') ? JSON.parse(req.body) : (req.body || {});
  const result = await callCreatorPOST(ORACLE_API_URL, ORACLE_API_KEY, body);
  res.json(result.ok ? result.data : { success: false, message: 'Creator error' });
});
```

需填入：
- `ORACLE_API_URL` = `https://www.zohoapis.com/creator/custom/uneedwind/drawOracle`
- `ORACLE_API_KEY` = A5-1 取得的 Public Key

- [ ] index.js 已更新
- [ ] AppSail 已重新部署

---

### A-7. GitHub Pages 部署 oracle.html

```bash
git checkout gh-pages
git checkout main -- liff/oracle.html
git commit -m "deploy: oracle.html 獨立求籤頁面"
git push origin gh-pages
git checkout main
```

- [ ] oracle.html 已上線
- [ ] 測試 URL：`https://youthsolar.github.io/ai-divination/liff/oracle.html`

---

## Part B：Rowy Phase 2+3 部署

### B-1. Creator 建立 5 張新表 ⚠️ 最優先

> 完整欄位規格見 `docs/BOOKING_SALES_STRATEGY.md` §9

#### B-1a. Service_Catalog（統一目錄，24 欄位）

| 欄位 link_name | 類型 | 必填 | 說明 |
|---------------|------|------|------|
| `Source` | picklist | ✅ | SimplyBook / EasyStore / Talisman |
| `External_ID` | single-line | — | SB service ID 或 ES product handle |
| `Name` | single-line | ✅ | 項目/商品名稱 |
| `Category` | multi-select | — | 分類標籤 |
| `Purpose` | multi-line | — | 目的說明 |
| `Functions` | multi-line | — | 功能說明 |
| `Specifications` | multi-line | — | 規格/條件 |
| `Target_Question_Types` | multi-select | — | 愛情/婚姻/工作/財運/健康/入煞/其他 |
| `Target_Situations` | multi-line | — | 適用情境（供 LLM 比對） |
| `Price` | decimal | — | 價格 TWD |
| `Booking_URL` | URL | — | 預約連結（SB） |
| `Product_URL` | URL | — | 商品連結（ES） |
| `Provider_Name` | single-line | — | 老師名稱 |
| `Image_URL` | URL | — | 圖片 |
| `Priority_Score` | number | — | 排序權重 |
| `Active` | boolean | — | 預設 true |
| `LLM_Description` | multi-line | — | 給 LLM 的一段式描述 |
| `Raw_Description` | multi-line | — | SB/ES 原始描述 |
| `SEO_Title` | single-line | — | SEO 標題 |
| `SEO_Description` | single-line | — | SEO meta |
| `SEO_Keywords` | single-line | — | 關鍵字 |
| `OG_Title` | single-line | — | OG 分享標題 |
| `OG_Description` | single-line | — | OG 分享描述 |
| `Cleaned_Description` | multi-line | — | 清洗後正式描述 |
| `Last_Synced_From` | datetime | — | 上次拉取時間 |
| `Last_Synced_To` | datetime | — | 上次回寫時間 |
| `Sync_Status` | picklist | — | pending/draft/rejected/pending_sync/synced/conflict |

- [ ] 表已建立

#### B-1b. Recommendation_Logs（推薦追蹤，13 欄位）

| 欄位 link_name | 類型 | 說明 |
|---------------|------|------|
| `Divination_Log_Link` | lookup → Divination_Logs | |
| `Line_User_ID` | single-line | |
| `Catalog_Items_Shown` | multi-line | JSON |
| `LLM_Response_Raw` | multi-line | LLM 原始回應 |
| `Primary_Catalog_ID` | single-line | |
| `Primary_Reason` | single-line | |
| `Primary_Urgency` | picklist | high/medium/low |
| `Recommended_At` | datetime | |
| `Clicked_At` | datetime | nullable |
| `Clicked_Catalog_ID` | single-line | nullable |
| `Converted_At` | datetime | nullable |
| `Conversion_Type` | picklist | talisman/booking/product |

- [ ] 表已建立

#### B-1c. Booking_Logs（預約紀錄，16 欄位）

| 欄位 link_name | 類型 | 說明 |
|---------------|------|------|
| `Booking_ID` | single-line (unique) | SB 預約 ID |
| `Client_Link` | lookup → Clients_Report | |
| `Line_User_ID` | single-line | |
| `Provider_Name` | single-line | 老師 |
| `Provider_ID` | single-line | SB provider ID |
| `Service_Name` | single-line | 項目 |
| `Service_ID` | single-line | SB service ID |
| `Booking_DateTime` | datetime | 預約時間 |
| `Status` | picklist | 待確認/已確認/已完成/已取消/未到 |
| `Source_Divination_Log` | lookup → Divination_Logs | nullable |
| `Recommendation_Source` | picklist | auto_trigger/manual/rich_menu |
| `SimplyBook_Raw` | multi-line | 原始 JSON |
| `Price` | decimal | |
| `Created_At` | datetime | |
| `Updated_At` | datetime | |

- [ ] 表已建立

#### B-1d. Teachers（老師主檔，7 欄位）

| 欄位 link_name | 類型 | 說明 |
|---------------|------|------|
| `Name` | single-line | 老師名稱 |
| `SimplyBook_Provider_ID` | single-line | SB provider ID |
| `Specialty_Question_Types` | multi-select | 愛情/婚姻/工作/財運/健康/入煞 |
| `Description` | multi-line | 簡介 |
| `Photo_URL` | URL | 頭像 |
| `Active` | boolean | |
| `Sort_Order` | number | |

- [ ] 表已建立

#### B-1e. Product_Orders（ES 訂單，11 欄位）

| 欄位 link_name | 類型 | 說明 |
|---------------|------|------|
| `EasyStore_Order_ID` | single-line (unique) | |
| `Client_Link` | lookup → Clients_Report | nullable |
| `Line_User_ID` | single-line | nullable |
| `Customer_Email` | email | |
| `Order_Total` | decimal | |
| `Order_Status` | picklist | pending/paid/shipped/completed/cancelled |
| `Items_Summary` | multi-line | JSON |
| `Recommendation_Link` | lookup → Recommendation_Logs | nullable |
| `EasyStore_Raw` | multi-line | 原始 JSON |
| `Created_At` | datetime | |
| `Updated_At` | datetime | |

- [ ] 表已建立

---

### B-2. Creator App Variables 新增

**操作**：Creator → AI易經 → Settings → App Variables

#### Phase 2A（推薦引擎）

| # | Variable | 值 | 優先級 |
|---|---------|-----|--------|
| B2-1 | `LLM.Recommendation_Model` | `claude-haiku-4-5-20251001` | 🔴 Phase 2A |

#### Phase 2B（SimplyBook）

| # | Variable | 值 | 優先級 |
|---|---------|-----|--------|
| B2-2 | `SimplyBook.Company_Login` | SB 公司代碼 | 🟡 Phase 2B |
| B2-3 | `SimplyBook.API_Key` | SB API Key | 🟡 Phase 2B |
| B2-4 | `SimplyBook.Admin_Username` | SB 管理帳號 | 🟡 Phase 2B |
| B2-5 | `SimplyBook.Admin_Password` | SB 管理密碼 | 🟡 Phase 2B |
| B2-6 | `SimplyBook.Webhook_Secret` | SB Webhook 密鑰 | 🟡 Phase 2B |

#### Phase 3（EasyStore）

| # | Variable | 值 | 優先級 |
|---|---------|-----|--------|
| B2-7 | `EasyStore.Shop_URL` | ES 商店 URL | 🔵 Phase 3 |
| B2-8 | `EasyStore.Access_Token` | ES OAuth Token | 🔵 Phase 3 |

- [ ] 全部已設定

---

### B-3. 部署 Deluge 函數到 Creator IDE

#### Phase 2A

| # | 函數名稱 | 原始碼位置 |
|---|---------|-----------|
| B3-1 | `LLM.recommendNextAction` | `zoho-creator/functions/llm/LLM.recommendNextAction.deluge` |
| B3-2 | `API.trackRecommendationClick` | `zoho-creator/functions/api/API.trackRecommendationClick.deluge` |

#### Phase 2B

| # | 函數名稱 | 原始碼位置 |
|---|---------|-----------|
| B3-3 | `API.handleSimplyBookWebhook` | `zoho-creator/functions/api/API.handleSimplyBookWebhook.deluge` |
| B3-4 | `API.syncCatalogFromSB` | `zoho-creator/functions/api/API.syncCatalogFromSB.deluge` |
| B3-5 | `API.pushCatalogToSB` | `zoho-creator/functions/api/API.pushCatalogToSB.deluge` |

#### Phase 3

| # | 函數名稱 | 原始碼位置 |
|---|---------|-----------|
| B3-6 | `API.handleEasyStoreWebhook` | `zoho-creator/functions/api/API.handleEasyStoreWebhook.deluge` |
| B3-7 | `API.syncCatalogFromES` | `zoho-creator/functions/api/API.syncCatalogFromES.deluge` |
| B3-8 | `API.pushCatalogToES` | `zoho-creator/functions/api/API.pushCatalogToES.deluge` |

- [ ] 全部已貼入並儲存
- [ ] 無編譯錯誤

---

### B-4. 建立 Custom API 端點

| # | API 名稱 | Handler | Method |
|---|---------|---------|--------|
| B4-1 | `trackRecommendationClick` | `API.trackRecommendationClick` | POST |
| B4-2 | `handleSimplyBookWebhook` | `API.handleSimplyBookWebhook` | POST |
| B4-3 | `handleEasyStoreWebhook` | `API.handleEasyStoreWebhook` | POST |
| B4-4 | `syncCatalogFromSB` | `API.syncCatalogFromSB` | POST |
| B4-5 | `syncCatalogFromES` | `API.syncCatalogFromES` | POST |

- [ ] 端點已建立
- [ ] 記下各 Public Key

---

### B-5. AppSail 新增端點

修改 `catalyst/appsail/divinationServer/index.js`：

| 端點 | 用途 | Creator API |
|------|------|------------|
| `POST /liff-track-click` | 推薦點擊追蹤 | trackRecommendationClick |

- [ ] index.js 已更新
- [ ] AppSail 已重新部署

---

### B-6. n8n 匯入工作流

**操作**：n8n → Workflows → Import

| # | 工作流檔案 | 觸發 | 前置 |
|---|-----------|------|------|
| B6-1 | `SimplyBook_Webhook__Booking_Sync.json` | SB Webhook | B4-2 Public Key |
| B6-2 | `SB_Pull_Services.json` | 每日 06:00 | B2-2~B2-3 |
| B6-3 | `SB_Push_Description.json` | 手動 | B2-4~B2-5 |
| B6-4 | `EasyStore_Webhook__Order_Sync.json` | ES Webhook | B4-3 Public Key |
| B6-5 | `ES_Pull_Products.json` | 每日 06:30 | B2-7~B2-8 |
| B6-6 | `Catalog_SEO_Generate.json` | 手動 | Anthropic API Key |
| B6-7 | `Booking_Reminder__LINE_Push.json` | 每小時 | B4-2 Public Key |

**匯入後注意**：
1. 所有工作流預設 `active: false`，需手動啟用
2. 搜尋 `__PLACEHOLDER__` 替換為實際憑證
3. 確認 Webhook URL 可從外部存取

- [ ] 全部已匯入
- [ ] 佔位符已替換
- [ ] 需啟用的工作流已啟用

---

### B-7. GitHub Pages 部署 redirect.html

```bash
git checkout gh-pages
git checkout main -- liff/redirect.html
git commit -m "deploy: redirect.html EasyStore 導流中間頁"
git push origin gh-pages
git checkout main
```

- [ ] redirect.html 已上線

---

## Part C：建議部署順序

```
Week 1（可立即開始，不需外部 API）：
  Day 1: A-1 Divination_Logs 改欄位
         A-2 建 3 張籤詩表
         B-1a Service_Catalog 表
         B-1b Recommendation_Logs 表
  Day 2: A-3 CSV 匯入 + 驗證
         A-4 部署 6 個 Oracle 函數
         B-1c~B-1e 其餘 3 張表
  Day 3: A-5 Custom API drawOracle
         A-6 AppSail /liff-oracle
         A-7 GitHub Pages oracle.html
         → Zoe 籤詩模式可測試 ✅

Week 2（需 SB/ES 帳號設定）：
  Day 4: B-2 App Variables
         B-3 部署 8 個 Deluge 函數
  Day 5: B-4 Custom API 端點
         B-5 AppSail /liff-track-click
         B-7 GitHub Pages redirect.html
  Day 6: B-6 n8n 匯入工作流
         → Phase 2A 推薦引擎可測試 ✅

Week 3（SimplyBook + EasyStore 串接）：
  Day 7-8: SimplyBook 後台設定 + Webhook 測試
  Day 9-10: EasyStore API 串接 + 訂單同步測試
         → Phase 2B + Phase 3 可測試 ✅
```

---

## 附錄：MCP 驗證結果摘要（2026-03-14）

| 項目 | 結果 |
|------|------|
| Creator app link_name | `ai-divination` |
| 現有表單數 | 19 |
| I_Ching_Form.appearance | ✅ 存在（孔明交叉比對用） |
| I_Ching_Form.symbol_1~5 | ✅ 存在（符令映射用） |
| Divination_Method picklist | 只有 易經/塔羅（需加 籤詩） |
| Clients_Report.Line_User_ID | ✅ 存在 |
| Clients_Report.Email | ✅ 存在 |
| Talisman_Purchases.Divination_Log_Link | ✅ Lookup 欄位 |
| 籤詩表（KongMing/GuanYin/GuanDi） | ❌ 不存在 |
| Phase 2+3 表（Service_Catalog 等 5 張） | ❌ 不存在 |

---

*Dora — Claude Code AI 助手 | 2026-03-14*
