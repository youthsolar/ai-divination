# Phase 2 狀態掃描報告 — Zoe + Rowy
> **掃描者**：Pinni（OpenClaw）
> **日期**：2026-03-15
> **目的**：確認 MVP 重寫（commits c2f7831~cd6ba59）對 Phase 2+3 程式碼的影響

---

## 結論摘要

**MVP 重寫沒有破壞 Zoe 或 Rowy 的程式碼。**
Zoe（Oracle）和 Rowy（Phase 2+3）函數全部完好，但都在等 Creator 資料表建立後才能啟用。
liffDivinationMvp 的 `next_action` 從 `smart_recommend` 退回 `offer_unlock` 是刻意的 MVP 取捨，不是意外損壞。

---

## 一、Zoe（Oracle 籤詩系統）狀態

### 程式碼位置
`zoho-creator/functions/oracle/` — 6 個函數：

| 函數 | 功能 | 狀態 |
|------|------|------|
| `Oracle.routeByQuestionType` | 依問題類型選籤詩系統（KongMing/GuanYin/GuanDi）| ✅ 完好 |
| `Oracle.calculateSignByBirthday` | 確定性籤號計算（獨立求籤用）| ✅ 完好 |
| `Oracle.selectSign` | D3 算法計算籤號 + 查詢籤詩 | ✅ 完好 |
| `Oracle.drawIndependent` | 獨立求籤主函數 | ✅ 完好 |
| `Oracle.formatOracleResponse` | 格式化籤詩 API 回應 | ✅ 完好 |
| `Oracle.buildPromptContext` | 組裝 LLM prompt context | ✅ 完好 |

### 問題：Oracle 與 LIFF 完全斷開

`API.liffDivinationMvp` 目前只有易經/塔羅兩條路由，**沒有籤詩（Oracle）路由**。
所有 Oracle 函數目前是孤立的死程式碼，不會被 LIFF 觸發。

### 啟用 Zoe 所需步驟（Phase 2A - Zoe MVP-2）

依 `docs/DEPLOY_CHECKLIST_2026_0314.md` Part A：

1. **A-1**：Creator → Divination_Logs 加 6 個 Oracle 欄位
   - `Oracle_System`（picklist: KongMing/GuanYin/GuanDi/None）
   - `Oracle_Sign_Order`（number）
   - `Oracle_Poem_Text`（multi-line ≤500）
   - `Oracle_Interpretation_Snippet`（multi-line ≤2000）
   - `Oracle_Fortune_Level`（single-line）
   - `Divination_Method` 新增選項「籤詩」

2. **A-2**：Creator 建 3 張籤詩表：`KongMing_Oracle`（384筆）、`GuanYin_Oracle`（100筆）、`GuanDi_Oracle`（100筆）

3. **A-3**：匯入籤詩資料

4. **Dora 任務**：在 `API.liffDivinationMvp` 加第三條路由：
   ```
   問題分類 → 如果是「籤詩」系統 → 呼叫 Oracle.routeByQuestionType → Oracle.drawIndependent
   ```

---

## 二、Rowy（Phase 2+3）狀態

### Phase 2B — SimplyBook 預約閉環

| 函數/工作流 | 狀態 | 問題 |
|---|---|---|
| `API.handleSimplyBookWebhook`（C-07）| ⚠️ 凍結 | 缺 `CRM.syncContact` 呼叫（BUG-1）；DB 寫入已被 TODO 註解 |
| `API.syncCatalogFromSB`（C-10）| ✅ 完好 | 待表建立後解除 TODO |
| `API.pushCatalogToSB`（C-12）| ⚠️ 缺錯誤檢查 | BUG-2：`editEvent` 回應不管成功失敗都回 success:true |
| n8n `SimplyBook_Webhook__Booking_Sync`（N-02）| ✅ 完好 | 待啟用 |
| n8n `SB_Pull_Services`（N-03）| ✅ 完好 | 待啟用 |
| n8n `SB_Push_Description`（N-04）| ✅ 完好 | 待啟用 |
| n8n `Booking_Reminder__LINE_Push`（N-09）| ✅ 完好 | 待啟用 |

### Phase 2C — SEO 清洗流程

| 函數/工作流 | 狀態 |
|---|---|
| `API.syncCatalogFromES`（C-11）| ✅ 待表建立 |
| `API.pushCatalogToES`（C-13）⚠️ | 缺外部 API 錯誤檢查（BUG-2）|
| n8n `Catalog_SEO_Generate`（N-08）| ✅ 完好 |

### Phase 3 — EasyStore 商品閉環

| 函數/工作流 | 狀態 | 問題 |
|---|---|---|
| `API.handleEasyStoreWebhook`（C-08）| ✅ 待表建立 | DB 寫入 TODO |
| `API.trackRecommendationClick`（C-09）| ✅ 待表建立 | — |
| n8n `EasyStore_Webhook__Order_Sync`（N-05）| ⚠️ 缺分流 | BUG-3：有解析 event_type 但無 Switch 節點分流 orders/create vs orders/paid |
| n8n `ES_Pull_Products`（N-06）| ✅ 完好 | 待啟用 |

### Phase 2A — LLM 推薦引擎

| 函數 | 狀態 | 問題 |
|---|---|---|
| `LLM.recommendNextAction`（C-06）| ✅ 存在 | **從未被呼叫** |

**根本原因**：MVP 重寫（commit `269dce5`）將 `API.liffDivinationMvp` 的 `next_action` 改為固定的 `offer_unlock`，移除了 `LLM.recommendNextAction` 的呼叫和 `Service_Catalog` 預篩邏輯。

**Dora 任務（MVP 穩定後）**：在 liffDivinationMvp 結尾重新接回：
```
→ 查 Service_Catalog（按 Target_Question_Types 過濾）
→ 呼叫 LLM.recommendNextAction(question, questionType, summary, clientHistory, catalog)
→ 若回傳 null → 退回 offer_unlock（現有邏輯）
→ 若有推薦 → next_action = smart_recommend
```

---

## 三、已知未修 Bug（Phase 2+3）

| ID | 嚴重度 | 位置 | 說明 | 修法 |
|---|---|---|---|---|
| BUG-1 | 中 | `API.handleSimplyBookWebhook` L244 後 | 缺 `CRM.syncContact` 呼叫 | 加入 `thisapp.CRM.syncContact(client_id)` |
| BUG-2 | 中 | `API.pushCatalogToSB` L131 / `API.pushCatalogToES` L91 | API 回應無錯誤檢查 | 檢查 HTTP status / JSON-RPC error，失敗時回傳 success:false |
| BUG-3 | 低 | n8n `EasyStore_Webhook__Order_Sync` | 缺 event_type Switch 節點分流 | 加 Switch 節點：orders/create → 建記錄；orders/paid → 推 LINE |

---

## 四、啟用順序建議（MVP 穩定後）

```
Step 1：建 Creator 資料表
  - Service_Catalog（LLM 推薦用）
  - Booking_Logs（SB 預約記錄）
  - Product_Orders（ES 訂單記錄）
  - Recommendation_Logs（推薦點擊追蹤）
  - KongMing_Oracle / GuanYin_Oracle / GuanDi_Oracle（Zoe 用）

Step 2：解除 TODO 註解
  - C-07/C-08/C-09/C-10/C-11/C-12/C-13 中的 DB 寫入邏輯

Step 3：修 BUG-1/2/3

Step 4：接回 LLM.recommendNextAction（liffDivinationMvp 結尾）

Step 5：接入 Oracle 路由（liffDivinationMvp + Zoe 完整流程）

Step 6：啟用 n8n N-02 ~ N-09 工作流
```

---

*此文件由 Pinni 自動掃描生成，Dora 請依此為基礎規劃 Phase 2 開發任務。*
