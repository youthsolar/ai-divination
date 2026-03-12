# 籤詩輔助模式 — MVP-2 計畫文件

Owner: Zoe (規劃) / Pinni (產品) / Jeffery (決策)
Last updated: 2026-03-12

> **目標**：在 Phase 1 免費占卜閉環（易經+塔羅 → 符令付費）之上，導入四大籤詩系統作為 LLM 解讀的輔助素材，提升占卜結果的豐富度、文化厚度與使用者信任感，同時為未來「籤詩專區」獨立功能鋪路。

---

## 一、現有架構摘要（與 Phase 1 的銜接點）

### 1.1 Phase 1 已建立的占卜管線

```
LINE 使用者 → n8n (LINE_Webhook__Reply)
                 → Creator API.predictFromLine
                     → 冷卻檢查 (AIInterpreter.checkCooldownStatus)
                     → 問題分類 (AIInterpreter.classifyQuestionType)
                     → 易經主流程 (AIInterpreter.getPredictionByQuestionAndBirthday)
                         → GuaCalculator.bitToHexagramCode (生日+時間→爻碼)
                         → Hexagram.getHexagramByYaoCode (爻碼→卦象)
                         → LLM.callChat (卦象+命理→AI解讀)
                     → 塔羅補充 (Tarot.tarotDivinationFunction)
                     → 合併結果 → LINE reply
```

### 1.2 現有 Creator 資料模型

| 表單 | 用途 | 與籤詩模組的關係 |
|------|------|-----------------|
| `Clients_Report` | 使用者檔案（Line_User_ID、生日） | 不變，共用 |
| `Divination_Logs` | 占卜紀錄（問題、方法、AI 解讀） | **擴充**：新增籤詩引用欄位 |
| `I_Ching_Form` | 易經卦象查詢表 | 不變 |
| `All_Tarot_Cards` | 塔羅牌義 | 不變 |
| `Talisman_Purchases` | 符令訂單 | 不變 |

### 1.3 銜接策略

籤詩模組**不取代**現有易經/塔羅流程，而是作為 **LLM prompt 的額外 context**：

```
現有：卦象資料 + 命理資料 → LLM prompt → AI 解讀
新增：卦象資料 + 命理資料 + [籤詩匹配結果] → LLM prompt → AI 解讀（更具深度）
```

---

## 二、籤詩資料模型

### 2.1 四大籤詩系統特性

| 系統 | 籤數 | 結構複雜度 | 特色 | 匹配策略 |
|------|------|-----------|------|---------|
| **孔明大易神術** | 384 | 高（15欄） | 含易經卦理、五行符令，與現有 I_Ching 體系天然互補 | 以爻碼/卦名交叉對應 |
| **文王神卦** | 512 | 低（2欄） | 僅卦序+四句詩，無解籤 | 以三位數卦序對應，AI 自行解讀 |
| **觀音靈籤** | 100 | 中（8欄） | 含仙機（分項判斷）、典故 | 以問題類型+吉凶匹配 |
| **關帝靈籤** | 100 | 高（10欄） | 六種不同角度解讀（籤解/釋意/東坡解/碧仙注） | 以問題類型+吉凶匹配 |

### 2.2 Creator 新增表單（4 張）

#### `KongMing_Oracle`（孔明大易神術）

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `ID` | Auto Number | PK |
| `Sign_Order` | Single Line | 籤序（第 1 籤 ~ 第 384 籤） |
| `Sign_Order_Num` | Number | 數字序號（排序/查詢用） |
| `Fortune_Level` | Single Line | 卦象吉凶（上上籤、中上籤等） |
| `Palace` | Single Line | 本位宮（乾宮、坤宮等） |
| `Current_Hexagram` | Single Line | 現爻 |
| `Change_Trigger` | Single Line | 機變 |
| `Changed_Hexagram` | Single Line | 變爻 |
| `Fortune_Category` | Single Line | 吉凶分類（持持、持平、持） |
| `Five_Elements` | Single Line | 五行屬性 |
| `Symbol_1` ~ `Symbol_5` | Single Line × 5 | 符令（金木水火土對應） |
| `Poem_Text` | Multi Line | 籤文（四句詩） |
| `Interpretation` | Multi Line | 籤解（白話解說） |

> **匹配鍵**：`Current_Hexagram`（現爻）可與 `I_Ching_Form.appearance` 交叉比對。

#### `WenWang_Oracle`（文王神卦）

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `ID` | Auto Number | PK |
| `Gua_Order` | Single Line | 卦序（第 111 卦 ~ 第 888 卦） |
| `Gua_Order_Num` | Number | 數字序號 |
| `Poem_Text` | Multi Line | 卦文（四句詩） |

> **匹配鍵**：三位數卦序由生日/時間計算得出（新增函數）。

#### `GuanYin_Oracle`（觀音靈籤）

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `ID` | Auto Number | PK |
| `Sign_Order` | Single Line | 籤序（第 1 籤 ~ 第 100 籤） |
| `Sign_Order_Num` | Number | 數字序號 |
| `Fortune_Level` | Single Line | 簽號吉凶（上籤子宮等） |
| `Poem_Title` | Single Line | 籤詩標題（典故人物名） |
| `Poem_Text` | Multi Line | 籤文（四句詩） |
| `Holy_Meaning` | Multi Line | 聖意 |
| `Sign_Interpretation` | Multi Line | 籤解 |
| `Divine_Guidance` | Multi Line | 仙機（分項判斷） |
| `Allusion` | Multi Line | 典故 |

#### `GuanDi_Oracle`（關帝靈籤）

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `ID` | Auto Number | PK |
| `Sign_Order` | Single Line | 籤序（第 1 籤 ~ 第 100 籤） |
| `Sign_Order_Num` | Number | 數字序號 |
| `Fortune_Level` | Single Line | 簽號吉凶（甲甲 大吉等） |
| `Poem_Title` | Single Line | 籤詩標題 |
| `Poem_Text` | Multi Line | 籤文（四句詩） |
| `Holy_Meaning` | Multi Line | 聖意 |
| `Sign_Interpretation` | Multi Line | 籤解 |
| `Meaning_Explanation` | Multi Line | 釋意 |
| `Detailed_Explanation` | Multi Line | 解釋 |
| `DongPo_Commentary` | Multi Line | 東坡解 |
| `BiXian_Commentary` | Multi Line | 碧仙注 |

### 2.3 Divination_Logs 擴充欄位

| 新增欄位 | 類型 | 說明 |
|----------|------|------|
| `Oracle_System` | Picklist | 使用的籤詩系統（KongMing / WenWang / GuanYin / GuanDi / None） |
| `Oracle_Sign_Order` | Single Line | 對應籤序 |
| `Oracle_Poem_Text` | Multi Line | 引用的籤文（快照，防資料變更後失聯） |
| `Oracle_Interpretation_Snippet` | Multi Line | 引用的解籤片段 |

### 2.4 資料匯入策略

以 Excel → CSV → Creator Bulk Import 為主路徑：

1. **一次性轉檔**：Python 腳本讀取 7 個 xlsx，輸出 4 個 CSV（合併「列表」與「主檔」去重）
2. **Creator Bulk Import**：每張表 CSV 匯入，設定 `Sign_Order` 為 unique 防重複
3. **驗證腳本**：匯入後比對筆數（孔明 384、文王 512、觀音 100、關帝 100）

---

## 三、籤詩查詢邏輯（LLM 如何引用籤詩輔助解讀）

### 3.1 籤詩匹配演算法

```
輸入：clientId, question, questionType, hexagramData (from Phase 1)
輸出：oracleContext (map) — 供 LLM prompt 注入

步驟：
1. 選擇籤詩系統（Oracle Router）
2. 計算籤號（Oracle Selector）
3. 查詢籤詩內容（Creator 表單查詢）
4. 組裝 oracleContext
```

#### 步驟 1：Oracle Router（系統選擇）

| 問題類型 | 主籤詩 | 理由 |
|----------|--------|------|
| 事業 / 財運 / 考試 | 孔明大易神術 | 卦理最完整，含五行分析 |
| 感情 / 婚姻 / 人際 | 觀音靈籤 | 仙機含婚姻/感情分項判斷 |
| 健康 / 訴訟 / 決策 | 關帝靈籤 | 六角度解讀最適合嚴肅問題 |
| 一般 / 天氣 / 旅行 | 文王神卦 | 卦文涵蓋面廣，靈活性高 |

> MVP 先用 `AIInterpreter.classifyQuestionType` 的既有結果做路由，不新增分類器。

#### 步驟 2：Oracle Selector（籤號計算）

```deluge
// 孔明：以現有爻碼 mod 384 + 1
kongming_sign = (yaoCodeNumeric % 384) + 1;

// 文王：以生日 hash mod 512 → 映射到 111~888 卦序
wenwang_gua = mapNumToWenWangOrder(hashMod);

// 觀音 / 關帝：以 (生日數字和 + 占卜時間數字和) mod 100 + 1
sign_num = ((birthdayDigitSum + divinationTimeDigitSum) % 100) + 1;
```

> 設計原則：**確定性**（同人同時同問 → 同籤），避免純隨機導致使用者質疑。

#### 步驟 3：LLM Prompt 注入格式

```
## 籤詩輔助參考
以下籤詩僅作為你解讀時的文化參考與靈感素材，不需要逐字翻譯或照搬：

【{系統名稱}・{籤序}・{吉凶等級}】
籤文：{四句詩}
籤解：{解籤摘要（截取前 200 字）}
{若有仙機/釋意，附加相關段落}

請在你的解讀中，自然地融入此籤詩的意境與建議，但以你的易經/塔羅解讀為主體。
```

### 3.2 LLM 提示詞策略

| 策略 | 說明 |
|------|------|
| **輔助非主導** | 明確告知 LLM：籤詩是參考素材，主體仍是易經/塔羅解讀 |
| **截斷控制** | 籤解超過 200 字只取前 200 字，避免 prompt 膨脹 |
| **吉凶校準** | 若籤詩吉凶與卦象矛盾，指示 LLM 解釋為「不同角度的提醒」 |
| **文化包裝** | 引導 LLM 以「古人智慧」語氣引用，增加儀式感 |

### 3.3 字數控制

Phase 1 已有 LINE 4300 字截斷邏輯。籤詩注入後預估 prompt 增加 300–500 字，output 增加 200–400 字，仍在安全範圍。若超出：

1. 優先截斷籤解（只保留籤文四句）
2. 次之移除仙機/釋意
3. 最後移除籤詩區塊（降級為 Phase 1 行為）

---

## 四、新增 API 端點與 n8n 工作流

### 4.1 Creator 新增函數

| 函數 | 簽名 | 用途 |
|------|------|------|
| `Oracle.routeByQuestionType` | `string Oracle.routeByQuestionType(string questionType)` | 依問題類型回傳籤詩系統名稱 |
| `Oracle.selectSign` | `map Oracle.selectSign(string system, string yaoCode, date birthday, date divinationTime)` | 計算籤號並查詢籤詩內容 |
| `Oracle.buildPromptContext` | `string Oracle.buildPromptContext(map oracleResult)` | 將籤詩查詢結果格式化為 LLM prompt 片段 |
| `Oracle.importFromCSV` | `void Oracle.importFromCSV(string tableName, string csvUrl)` | 一次性匯入工具（開發用） |

### 4.2 現有函數修改

| 函數 | 修改內容 |
|------|---------|
| `API.predictFromLine` | 在易經/塔羅結果產出後、LLM.callChat 前，插入 Oracle 呼叫鏈 |
| `AIInterpreter.getPredictionByQuestionAndBirthday` | prompt 組裝區段加入 `oracleContext` |
| `Tarot.tarotDivinationFunction` | （可選）塔羅解讀 prompt 也加入 `oracleContext` |

### 4.3 修改後的呼叫鏈

```
API.predictFromLine
  ├── 冷卻檢查（不變）
  ├── 問題分類（不變）
  ├── 【新增】Oracle.routeByQuestionType(questionType)
  ├── 【新增】Oracle.selectSign(system, yaoCode, birthday, now)
  ├── 【新增】Oracle.buildPromptContext(oracleResult)
  ├── 易經主流程（prompt 加入 oracleContext）
  ├── 塔羅補充（可選加入 oracleContext）
  ├── 【新增】寫入 Divination_Logs 的 Oracle 欄位
  └── 合併結果 → LINE reply
```

### 4.4 n8n 工作流

**不需新增 n8n workflow**。籤詩邏輯完全封裝在 Creator 函數內，n8n 呼叫 `API.predictFromLine` 的介面不變。

### 4.5 （未來）獨立籤詩 API（Phase 2.5 預留）

| 端點 | 用途 | 優先序 |
|------|------|--------|
| `API.drawOracle` | 獨立求籤（不經過易經/塔羅） | 未來 |
| `API.getOracleByOrder` | 依籤號查詢特定籤詩 | 未來 |

---

## 五、實作優先序與部署分工

### 5.1 實作階段

| 階段 | 任務 | 負責 | 估計工作量 | 前置依賴 |
|------|------|------|-----------|---------|
| **S0** | Excel → CSV 轉檔腳本 | Repo (Python) | 0.5 天 | 無 |
| **S1** | Creator 建立 4 張籤詩表單 | Creator UI | 1 天 | 無 |
| **S2** | CSV 匯入 + 筆數驗證 | Creator Bulk Import | 0.5 天 | S0 + S1 |
| **S3** | Oracle.routeByQuestionType | Creator Deluge | 0.5 天 | S1 |
| **S4** | Oracle.selectSign | Creator Deluge | 1 天 | S2 |
| **S5** | Oracle.buildPromptContext | Creator Deluge | 0.5 天 | S4 |
| **S6** | 修改 API.predictFromLine 整合 | Creator Deluge | 1 天 | S3 + S4 + S5 |
| **S7** | Divination_Logs 擴充欄位 | Creator UI | 0.5 天 | S1 |
| **S8** | 端到端測試 | 手動 + n8n | 1 天 | S6 + S7 |
| **S9** | Prompt 調優（A/B 比較有/無籤詩） | 手動 | 1–2 天 | S8 |

**總估計：7–8 工作天（一人）**

### 5.2 部署函數清單

#### Creator（Deluge）— 新增

| # | 函數路徑 | 類型 |
|---|---------|------|
| 1 | `functions/oracle/Oracle.routeByQuestionType.deluge` | Standalone |
| 2 | `functions/oracle/Oracle.selectSign.deluge` | Standalone |
| 3 | `functions/oracle/Oracle.buildPromptContext.deluge` | Standalone |

#### Creator（Deluge）— 修改

| # | 函數路徑 | 修改範圍 |
|---|---------|---------|
| 4 | `functions/api/API.predictFromLine.deluge` | 插入 Oracle 呼叫鏈（約 20 行） |
| 5 | `functions/aiinterpreter/AIInterpreter.getPredictionByQuestionAndBirthday.deluge` | prompt 組裝加入 oracleContext（約 10 行） |

#### Repo（Python）— 新增

| # | 腳本路徑 | 用途 |
|---|---------|------|
| 6 | `scripts/xlsx_to_csv.py` | Excel → CSV 轉檔（一次性） |
| 7 | `scripts/verify_oracle_import.py` | 匯入後筆數驗證（一次性） |

#### n8n — 不動

現有 `LINE_Webhook__Reply.json` 無需修改。

#### LIFF — 不動

前端不涉及，籤詩邏輯完全在 Creator 後端。

---

## 六、技術風險與緩解

### 6.1 風險矩陣

| 風險 | 影響 | 可能性 | 緩解措施 |
|------|------|--------|---------|
| **Prompt 膨脹導致 LLM 回應品質下降** | 中 | 中 | 截斷策略（§3.3）；A/B 測試有無籤詩版本 |
| **籤詩吉凶與卦象矛盾，使用者困惑** | 高 | 中 | Prompt 明確指示「不同角度的提醒」；LLM 負責調和 |
| **Creator Deluge 字串處理效能** | 低 | 低 | 籤詩查詢為單筆 record fetch，效能可忽略 |
| **Excel 資料品質（亂碼/缺欄/重複）** | 中 | 低 | S0 轉檔腳本內建驗證；匯入後筆數/欄位完整性檢查 |
| **LINE 5000 字上限被撐破** | 高 | 低 | 已有 4300 字截斷邏輯；籤詩增量在可控範圍 |
| **「列表」vs「主檔」資料不一致** | 低 | 中 | 轉檔腳本以主檔為準，列表僅作驗證用 |
| **文王神卦無解籤，AI 可能瞎掰** | 中 | 中 | Prompt 明示「此籤僅有詩文，請自行依意境解讀」；或 MVP 先不啟用文王 |

### 6.2 降級策略（Graceful Degradation）

若 Oracle 呼叫鏈任何環節失敗：
1. `Oracle.selectSign` 查無資料 → `oracleContext = null`
2. `API.predictFromLine` 檢測到 `oracleContext == null` → 跳過注入，走 Phase 1 原始流程
3. Divination_Logs 的 `Oracle_System` 寫入 `"None"`

**原則：籤詩模組的任何故障不得影響 Phase 1 核心占卜功能。**

### 6.3 開放決策點（需 Jeffery / Pinni 定奪）

| # | 決策 | 選項 | 建議 |
|---|------|------|------|
| D1 | MVP-2 是否啟用文王神卦？ | A. 啟用（AI 自行解詩）<br>B. 先不啟用（僅 3 系統） | **B**：文王僅兩欄，解讀品質難控 |
| D2 | 籤詩結果是否在 LINE 訊息中明示？ | A. 明示（附籤文四句）<br>B. 隱式融入（不提籤名） | **A**：增加儀式感與文化體驗 |
| D3 | 籤號計算是否需要使用者互動（如搖籤）？ | A. 確定性計算（同人同時同籤）<br>B. 加入隨機因子<br>C. LIFF 互動搖籤 | **A**（MVP），C 留 Phase 3 |
| D4 | 符令（Symbol_1~5）是否與現有符令商品對應？ | A. 對應（可推薦購買）<br>B. 僅展示不商品化 | 需確認符令庫存/圖檔 |

---

## 附錄 A：資料統計

| 系統 | 主檔筆數 | 列表筆數 | 欄位數 | 匯入 CSV |
|------|---------|---------|--------|----------|
| 孔明大易神術 | 384 | 50（子集） | 15 | `kongming_oracle.csv` |
| 文王神卦 | 512 | 512（同） | 2 | `wenwang_oracle.csv` |
| 觀音靈籤 | 100 | 100（同） | 8 | `guanyin_oracle.csv` |
| 關帝靈籤 | 100 | — | 10 | `guandi_oracle.csv` |

## 附錄 B：欄位對照表（Excel → Creator）

### 孔明大易神術

| Excel 欄位 | Creator 欄位 | 備註 |
|-----------|-------------|------|
| 籤序 | Sign_Order | |
| 卦象 | Fortune_Level | 去除【】 |
| 本位 | Palace | |
| 現爻 | Current_Hexagram | 匹配鍵 |
| 機變 | Change_Trigger | |
| 變爻 | Changed_Hexagram | |
| 吉凶 | Fortune_Category | |
| 五行 | Five_Elements | |
| 符令1~5 | Symbol_1~5 | |
| 籤文 | Poem_Text | |
| 籤解 | Interpretation | |

### 觀音靈籤

| Excel 欄位 | Creator 欄位 |
|-----------|-------------|
| 籤序 | Sign_Order |
| 簽號吉凶 | Fortune_Level |
| 籤詩標題 | Poem_Title |
| 籤文 | Poem_Text |
| 聖意 | Holy_Meaning |
| 籤解 | Sign_Interpretation |
| 仙機 | Divine_Guidance |
| 典故 | Allusion |

### 關帝靈籤

| Excel 欄位 | Creator 欄位 |
|-----------|-------------|
| 籤序 | Sign_Order |
| 簽號吉凶 | Fortune_Level |
| 籤詩標題 | Poem_Title |
| 籤文 | Poem_Text |
| 聖意 | Holy_Meaning |
| 籤解 | Sign_Interpretation |
| 釋意 | Meaning_Explanation |
| 解釋 | Detailed_Explanation |
| 東坡解 | DongPo_Commentary |
| 碧仙注 | BiXian_Commentary |
