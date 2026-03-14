# 籤詩輔助模式 — MVP-2 計畫文件

Owner: Zoe (規劃) / Pinni (產品) / Jeffery (決策)
Last updated: 2026-03-12

> **目標**：在 Phase 1 免費占卜閉環（易經+塔羅 → 符令付費）之上，導入三大籤詩系統（孔明大易神術、觀音靈籤、關帝靈籤）作為 LLM 解讀的輔助素材，提升占卜結果的豐富度、文化厚度與使用者信任感，同時為未來「籤詩專區」獨立功能鋪路。

### 已確認決策

| # | 決策 | 結論 | 確認日期 |
|---|------|------|---------|
| D1 | 文王神卦是否啟用？ | **先不啟用**，MVP-2 僅上線孔明/觀音/關帝三系統 | 2026-03-12 |
| D2 | 籤文呈現方式 | **明示籤文**，LINE 回覆附籤名+四句詩，增加儀式感 | 2026-03-12 |
| D3 | 籤號計算方式 | **確定性計算**，同人同時同問必出同籤，可追蹤 | 2026-03-12 |
| D4 | 孔明符令是否對應商品 | **對應商品推薦**，映射到現有 Talisman 商品，增加轉換 | 2026-03-12 |

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

### 2.2 Creator 新增表單（3 張，文王暫不建表）

#### `KongMing_Oracle`（孔明大易神術）

| 欄位名 | 類型 | 必填 | Unique | Index | Validation | 說明 |
|--------|------|------|--------|-------|------------|------|
| `ID` | Auto Number | — | ✅ | PK | — | 系統主鍵 |
| `Sign_Order` | Single Line | ✅ | ✅ | — | — | 籤序（第 1 籤 ~ 第 384 籤） |
| `Sign_Order_Num` | Number | ✅ | ✅ | ✅ 查詢用 | 1 ≤ N ≤ 384 | 數字序號 |
| `Fortune_Level` | Single Line | ✅ | — | — | — | 卦象吉凶（上上籤、中上籤等） |
| `Palace` | Picklist | ✅ | — | — | 允許值：乾/坤/震/巽/坎/離/艮/兌 | 本位宮 |
| `Current_Hexagram` | Single Line | ✅ | — | ✅ 交叉比對 | — | 現爻（匹配 I_Ching_Form.appearance） |
| `Change_Trigger` | Single Line | — | — | — | — | 機變 |
| `Changed_Hexagram` | Single Line | — | — | — | — | 變爻 |
| `Fortune_Category` | Single Line | — | — | — | — | 吉凶分類（持持、持平、持） |
| `Five_Elements` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 五行屬性 |
| `Symbol_1` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 符令 1 |
| `Symbol_2` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 符令 2 |
| `Symbol_3` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 符令 3 |
| `Symbol_4` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 符令 4 |
| `Symbol_5` | Picklist | ✅ | — | — | 允許值：金/木/水/火/土 | 符令 5 |
| `Poem_Text` | Multi Line | ✅ | — | — | 長度 ≤ 500 | 籤文（四句詩） |
| `Interpretation` | Multi Line | ✅ | — | — | 長度 ≤ 2000 | 籤解（白話解說） |

> **匹配鍵**：`Current_Hexagram`（現爻）可與 `I_Ching_Form.appearance` 交叉比對。
> **Index 策略**：`Sign_Order_Num`（主查詢）+ `Current_Hexagram`（交叉查詢）。

#### `GuanYin_Oracle`（觀音靈籤）

| 欄位名 | 類型 | 必填 | Unique | Index | Validation | 說明 |
|--------|------|------|--------|-------|------------|------|
| `ID` | Auto Number | — | ✅ | PK | — | 系統主鍵 |
| `Sign_Order` | Single Line | ✅ | ✅ | — | — | 籤序（第 1 籤 ~ 第 100 籤） |
| `Sign_Order_Num` | Number | ✅ | ✅ | ✅ 查詢用 | 1 ≤ N ≤ 100 | 數字序號 |
| `Fortune_Level` | Single Line | ✅ | — | — | — | 簽號吉凶（上籤子宮等） |
| `Poem_Title` | Single Line | ✅ | — | — | — | 籤詩標題（典故人物名） |
| `Poem_Text` | Multi Line | ✅ | — | — | 長度 ≤ 500 | 籤文（四句詩） |
| `Holy_Meaning` | Multi Line | — | — | — | 長度 ≤ 500 | 聖意 |
| `Sign_Interpretation` | Multi Line | ✅ | — | — | 長度 ≤ 500 | 籤解 |
| `Divine_Guidance` | Multi Line | — | — | — | 長度 ≤ 1000 | 仙機（分項判斷） |
| `Allusion` | Multi Line | — | — | — | 長度 ≤ 1000 | 典故 |

#### `GuanDi_Oracle`（關帝靈籤）

| 欄位名 | 類型 | 必填 | Unique | Index | Validation | 說明 |
|--------|------|------|--------|-------|------------|------|
| `ID` | Auto Number | — | ✅ | PK | — | 系統主鍵 |
| `Sign_Order` | Single Line | ✅ | ✅ | — | — | 籤序（第 1 籤 ~ 第 100 籤） |
| `Sign_Order_Num` | Number | ✅ | ✅ | ✅ 查詢用 | 1 ≤ N ≤ 100 | 數字序號 |
| `Fortune_Level` | Single Line | ✅ | — | — | — | 簽號吉凶（甲甲 大吉等） |
| `Poem_Title` | Single Line | ✅ | — | — | — | 籤詩標題 |
| `Poem_Text` | Multi Line | ✅ | — | — | 長度 ≤ 500 | 籤文（四句詩） |
| `Holy_Meaning` | Multi Line | — | — | — | 長度 ≤ 500 | 聖意 |
| `Sign_Interpretation` | Multi Line | ✅ | — | — | 長度 ≤ 1000 | 籤解 |
| `Meaning_Explanation` | Multi Line | — | — | — | 長度 ≤ 1000 | 釋意 |
| `Detailed_Explanation` | Multi Line | — | — | — | 長度 ≤ 2000 | 解釋 |
| `DongPo_Commentary` | Multi Line | — | — | — | 長度 ≤ 1000 | 東坡解 |
| `BiXian_Commentary` | Multi Line | — | — | — | 長度 ≤ 500 | 碧仙注 |

### 2.3 Divination_Logs 擴充欄位

| 新增欄位 | 類型 | 必填 | 說明 |
|----------|------|------|------|
| `Oracle_System` | Picklist | — | 使用的籤詩系統（KongMing / GuanYin / GuanDi / None），預設 None |
| `Oracle_Sign_Order` | Number | — | 對應籤號數字（方便查詢） |
| `Oracle_Poem_Text` | Multi Line | — | 引用的籤文快照（防資料變更後失聯） |
| `Oracle_Interpretation_Snippet` | Multi Line | — | 引用的解籤片段快照 |
| `Oracle_Fortune_Level` | Single Line | — | 籤詩吉凶等級快照 |

> **快照策略**：寫入時從籤詩表複製文字到 Divination_Logs，確保歷史紀錄不受籤詩表後續修正影響。

### 2.4 資料匯入策略 — 詳細 SOP

#### 步驟 A：Excel → CSV 轉檔

```
來源：data/divination-database/*.xlsx
輸出：data/divination-database/csv/
腳本：scripts/xlsx_to_csv.py
```

| 轉檔規則 | 說明 |
|----------|------|
| 以主檔為準 | 孔明大易神術.xlsx（384）、觀音靈籤.xlsx（100）、關帝靈籤.xlsx（100） |
| 列表檔用途 | 僅用於交叉驗證筆數，不匯入 |
| 文王暫不轉 | D1 決策：先不啟用 |
| 欄位清洗 | 去除 Fortune_Level 的【】符號；Sign_Order 提取數字寫入 Sign_Order_Num |
| 編碼 | UTF-8 with BOM（Creator 匯入需要 BOM） |
| 空值處理 | 空欄位輸出為空字串，不輸出 NULL |

#### 步驟 B：Creator 建表

1. 進入 Creator UI → 新增 Form
2. 依 §2.2 欄位規格逐一建立
3. 設定 `Sign_Order_Num` 為 Unique（匯入重複時報錯而非覆蓋）
4. 設定 `Sign_Order` 為 Unique
5. 建立 Index：`Sign_Order_Num`（三張表均建）+ `Current_Hexagram`（僅孔明）

#### 步驟 C：匯入

1. Creator → Import Data → 選擇對應表單
2. 上傳 CSV → 欄位映射（確認所有欄位對齊）
3. 預覽前 5 筆 → 確認無亂碼
4. 執行匯入

#### 步驟 D：匯入後驗證

| 驗證項目 | 預期結果 | 驗證方法 |
|----------|---------|---------|
| 筆數 | 孔明 384、觀音 100、關帝 100 | Creator List View count |
| 首尾籤 | 孔明第1/384籤、觀音第1/100籤、關帝第1/100籤 | 手動查看 |
| 欄位完整性 | 所有必填欄位無空值 | Creator Report → 過濾 Poem_Text = empty |
| 中文無亂碼 | 隨機抽查 5 筆，籤文/籤解內容正確 | 手動比對 Excel 原檔 |
| 孔明交叉比對 | Current_Hexagram 值存在於 I_Ching_Form.appearance | Deluge 驗證腳本 |
| Unique 約束 | 重複匯入同 CSV 應報錯 | 二次匯入測試 |

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
| 事業 / 財運 / 考試 | 孔明大易神術 | 卦理最完整，含五行分析，符令可對應商品 |
| 感情 / 婚姻 / 人際 | 觀音靈籤 | 仙機含婚姻/感情分項判斷 |
| 健康 / 訴訟 / 決策 | 關帝靈籤 | 六角度解讀最適合嚴肅問題 |
| 一般 / 旅行 / 其他 | 觀音靈籤（fallback） | 觀音靈籤涵蓋面廣，典故豐富 |

> MVP 先用 `AIInterpreter.classifyQuestionType` 的既有結果做路由，不新增分類器。
> 文王神卦（512 卦）已匯入 repo 備用，待後續版本補充解籤內容後再啟用。

#### 步驟 2：Oracle Selector（籤號計算）

```deluge
// 孔明：以現有爻碼 mod 384 + 1
kongming_sign = (yaoCodeNumeric % 384) + 1;

// 觀音 / 關帝：以 (生日數字和 + 占卜時間數字和) mod 100 + 1
sign_num = ((birthdayDigitSum + divinationTimeDigitSum) % 100) + 1;
```

> 設計原則：**確定性**（同人同時同問 → 同籤），避免純隨機導致使用者質疑。
> 同一組輸入必定產出同一籤號，確保可追蹤與可重現。

#### 步驟 3：LLM Prompt 注入 — 完整模板

籤詩 context 插入在現有 prompt 的 `【符令圖示】` 之後、最終指令之前。

##### 模板 A：孔明大易神術

```
【籤詩輔助參考 — 孔明大易神術】
以下古籤詩與你的易經卦象同源（皆出自易經體系），僅作為解讀的文化補充與靈感素材。
不需逐字翻譯，但應自然融入你的解讀中，讓使用者感受到古人智慧的印證。

籤序：{Sign_Order}（{Fortune_Level}）
本位：{Palace}宮 ｜ 現爻：{Current_Hexagram} ｜ 變爻：{Changed_Hexagram}
五行：{Five_Elements} ｜ 吉凶：{Fortune_Category}
符令五行序列：{Symbol_1} → {Symbol_2} → {Symbol_3} → {Symbol_4} → {Symbol_5}

籤文：
{Poem_Text}

籤解（摘要）：
{Interpretation 前 200 字}

整合要求：
1. 在你的解讀中引用此籤文的意境，但以易經卦象為主體
2. 若此籤的吉凶與卦象一致，可用「古籤亦云…」語氣強化
3. 若此籤的吉凶與卦象矛盾，應解讀為「不同角度的提醒」，例如：
   「卦象雖示吉兆，但古籤提醒我們仍需留意…」
4. 在回覆最後，請附上以下格式的籤文明示區塊（一字不改）：
━━━━━━━━━━━━━━━━━━
🏮 孔明大易神術・{Sign_Order}・{Fortune_Level}
「{Poem_Text}」
━━━━━━━━━━━━━━━━━━
```

##### 模板 B：觀音靈籤

```
【籤詩輔助參考 — 觀音靈籤】
以下觀音靈籤僅作為解讀的文化補充。觀音靈籤側重人生際遇與處世態度，
可為你的易經/塔羅解讀提供更具人情味的視角。

籤序：{Sign_Order}（{Fortune_Level}）
籤詩標題：{Poem_Title}

籤文：
{Poem_Text}

聖意：{Holy_Meaning}
籤解：{Sign_Interpretation}

仙機（分項參考）：
{Divine_Guidance}

典故：
{Allusion 前 150 字}

整合要求：
1. 以易經/塔羅為主體，觀音靈籤為「古人智慧的另一面鏡子」
2. 仙機中的分項判斷（婚姻、疾病、求財等）可對應使用者問題類型，擇相關項目引用
3. 典故可簡化為一句話帶過，增加故事感（例：「正如古時{Poem_Title}的故事…」）
4. 若吉凶矛盾：「觀音菩薩從慈悲角度另有提醒…」
5. 回覆最後附上籤文明示區塊：
━━━━━━━━━━━━━━━━━━
🏮 觀音靈籤・{Sign_Order}・{Fortune_Level}
「{Poem_Text}」
━━━━━━━━━━━━━━━━━━
```

##### 模板 C：關帝靈籤

```
【籤詩輔助參考 — 關帝靈籤】
以下關帝靈籤側重忠義正道與決斷力，適合需要勇氣面對的問題。
關帝靈籤有多家註解，你可以擇取最貼合使用者情境的角度。

籤序：{Sign_Order}（{Fortune_Level}）
籤詩標題：{Poem_Title}

籤文：
{Poem_Text}

聖意：{Holy_Meaning}

解讀角度（擇一或融合）：
- 籤解：{Sign_Interpretation}
- 白話釋意：{Meaning_Explanation 前 150 字}
- 東坡解：{DongPo_Commentary}
- 碧仙注：{BiXian_Commentary}

整合要求：
1. 以易經/塔羅為主體，關帝靈籤為「正氣角度的補充」
2. 多家註解中，選最貼合問題的 1–2 個角度引用即可，不需全部列出
3. 若吉凶矛盾：「關聖帝君從忠義正道的角度提醒…」
4. 回覆最後附上籤文明示區塊：
━━━━━━━━━━━━━━━━━━
🏮 關帝靈籤・{Sign_Order}・{Fortune_Level}
「{Poem_Text}」
━━━━━━━━━━━━━━━━━━
```

#### 步驟 4：Few-Shot 範例（供 Prompt 調優參考）

以下為「卦象吉 + 籤詩吉」和「卦象吉 + 籤詩凶」兩種情境的 AI 回覆風格參考：

##### 範例 A：吉凶一致（卦象吉 + 觀音上籤）

> 從卦象來看，你目前的感情運勢如同春日暖陽，漸入佳境。上卦離火代表熱情與光明，下卦巽風代表柔順溝通——這正是感情中最需要的兩個元素。
>
> 古人的智慧也為你留下了印證。觀音靈籤中有云：「千年古鏡復重圓，女再求夫男再婚」，正如玉蓮與十朋歷經波折終得團圓的故事，你們之間的緣分也正在慢慢修復。
>
> 建議你在接下來的兩週內，主動釋出善意，但不必急於求成……
>
> ━━━━━━━━━━━━━━━━━━
> 🏮 觀音靈籤・第 4 籤・【上籤子宮】
> 「千年古鏡復重圓，女再求夫男再婚；自此門庭重改換，更添福祿在兒孫。」
> ━━━━━━━━━━━━━━━━━━

##### 範例 B：吉凶矛盾（卦象吉 + 關帝下下籤）

> 卦象整體呈現向好的趨勢，你在事業上的努力正在累積能量。然而，關聖帝君從忠義正道的角度另有提醒：「去年百事可相宜，若較今年時運衰」——這並非否定你的方向，而是提醒你在順境中不可掉以輕心。
>
> 東坡解中點出關鍵：「先吉後兇、時運將否、謀事無成、頓非前比」，意思是好運不會永遠持續，你需要在順境中為可能的逆風做好準備。
>
> 具體建議：維持目前的事業方向，但務必在財務上預留安全邊際……
>
> ━━━━━━━━━━━━━━━━━━
> 🏮 關帝靈籤・第 4 籤・甲丁（下下）
> 「去年百事可相宜，若較今年時運衰；好把瓣香告神佛，莫教福謝悔無追。」
> ━━━━━━━━━━━━━━━━━━

#### 步驟 5：孔明符令 → 商品推薦（D4 已確認）

當籤詩系統為孔明大易神術時，額外觸發符令推薦邏輯：

1. 讀取 `Symbol_1~5`（五行符令：金木水火土）
2. 呼叫 `Talisman.getRecommendationByElements(symbols)` 匹配商品（詳見 §3.4）
3. 在 LINE 回覆的 CTA 區段附加：「本籤建議符令：{符令名稱} → 點此請購」

### 3.2 LLM 提示詞策略

| 策略 | 說明 | 對應 Prompt 區段 |
|------|------|-----------------|
| **輔助非主導** | 明確告知 LLM：籤詩是參考素材，主體仍是易經/塔羅解讀 | 模板開頭「僅作為…文化補充」 |
| **截斷控制** | 籤解超過 200 字只取前 200 字；典故超過 150 字截斷 | `Oracle.buildPromptContext` |
| **吉凶校準** | 卦籤矛盾時，明確指示 LLM 的處理語氣（見各模板第 3/4 點） | 整合要求 3 |
| **文化包裝** | 引導 LLM 以「古人智慧」「古籤亦云」語氣引用，增加儀式感 | 整合要求 1–2 |
| **明示引用** | LINE 回覆末尾固定附加籤詩原文區塊（步驟 4） | 整合要求最後一條 |
| **角度選擇** | 關帝靈籤有多家註解，LLM 擇最貼合的 1–2 個 | 模板 C 解讀角度 |
| **仙機精選** | 觀音靈籤仙機分項，只引用與問題類型相關的項目 | 模板 B 整合要求 2 |

### 3.3 字數控制

Phase 1 已有 LINE 4300 字截斷邏輯。各模板注入後的 prompt 增量估算：

| 系統 | Prompt 增量 | Output 增量（含明示區塊） | 合計增量 |
|------|-----------|------------------------|---------|
| 孔明 | ~400 字 | ~300 字 | ~700 字 |
| 觀音 | ~500 字 | ~350 字 | ~850 字 |
| 關帝 | ~600 字 | ~350 字 | ~950 字 |

現有 Phase 1 output 約 2500–3500 字，加上籤詩增量最多 ~950 字，接近但仍在 4300 安全線內。

**降級策略（依序執行）**：

1. 優先截斷籤解（只保留籤文四句） → 省約 200 字
2. 移除仙機/釋意/典故 → 再省約 300 字
3. 移除整個籤詩區塊 → 降級為 Phase 1 行為（oracleContext = null）

### 3.4 符令五行 → Talisman 商品映射（D4 細化）

#### 映射架構

```
孔明籤詩 Symbol_1~5（金/木/水/火/土）
  ↓ 映射
I_Ching_Form.symbol_1~5（現有易經卦象的符令五行）
  ↓ 已有邏輯
Talisman.getBasicRecommendation → Talisman.getCompleteRecommendation
  ↓
符令推薦 + AI 個人化說明 + 價格 360 元
```

#### 映射規則

| 場景 | 規則 | 說明 |
|------|------|------|
| **孔明 Symbol 與易經 Symbol 一致** | 直接引用現有 Talisman 推薦流程 | 最常見情況，孔明籤詩本身就出自易經體系 |
| **孔明 Symbol 與易經 Symbol 不一致** | 以易經 Symbol 為準（已有付費流程） | 籤詩符令僅作為輔助參考，不覆蓋現有商品邏輯 |
| **使用者已購買過符令** | 推薦序列中的下一張（Current_Talisman_Index + 1） | 沿用現有 `Talisman.getTalismanRecommendation` 邏輯 |
| **符令已推薦完畢（>5 張）** | 不再推薦 | 沿用現有上限邏輯 |

#### CTA 文案模板

```
🔮 古籤與卦象共同指引——
本次孔明大易神術與你的卦象五行相合，建議以「{talisman_element}」屬性符令
平衡能量。

📿 {talisman_element}符令・NT$360
{ai_explanation（由 Talisman.generateTalismanExplanation 產出）}

👉 點此請購：{purchase_url}
```

#### 技術銜接點

- **現有函數**：`Talisman.getBasicRecommendation` 已實作 symbol_1~5 的動態讀取邏輯（if/else if 分支）
- **新增邏輯**：在 `Oracle.buildPromptContext` 中，若系統為 KongMing，額外輸出 `talisman_cta` 欄位
- **API.predictFromLine**：在最終合併結果時，若 `oracleResult.talisman_cta` 存在，附加到 LINE reply 末尾（在籤文明示區塊之後）

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
| **S0** | Excel → CSV 轉檔腳本（3 系統） | Repo (Python) | 0.5 天 | 無 |
| **S1** | Creator 建立 3 張籤詩表單（孔明/觀音/關帝） | Creator UI | 0.5 天 | 無 |
| **S2** | CSV 匯入 + 筆數驗證 | Creator Bulk Import | 0.5 天 | S0 + S1 |
| **S3** | Oracle.routeByQuestionType | Creator Deluge | 0.5 天 | S1 |
| **S4** | Oracle.selectSign（確定性計算） | Creator Deluge | 1 天 | S2 |
| **S5** | Oracle.buildPromptContext + LINE 明示籤文格式 | Creator Deluge | 0.5 天 | S4 |
| **S5.5** | 孔明符令 → Talisman 商品映射表 | Creator Deluge | 0.5 天 | S2 |
| **S6** | 修改 API.predictFromLine 整合 | Creator Deluge | 1 天 | S3 + S4 + S5 + S5.5 |
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

### 6.3 已結案決策點

> 以下決策已於 2026-03-12 由 Pinni 確認，詳見文件頂部「已確認決策」表格。
> D1: 文王先不啟用 / D2: 明示籤文 / D3: 確定性計算 / D4: 符令對應商品

### 6.4 待確認事項

| # | 事項 | 說明 |
|---|------|------|
| T1 | 孔明符令（金木水火土）與 Talisman_Purchases 的具體映射規則 | 需確認現有符令商品庫存與圖檔是否齊全 |
| T2 | LIFF 互動搖籤（Phase 3 預留） | 確定性計算為 MVP 方案，搖籤動畫留後續版本 |

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
