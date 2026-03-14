# MVP-2 籤詩系統 — 部署操作手冊

> 建立時間：2026-03-14
> 範圍：MVP-2 輔助模式 Oracle 函數 + LIFF 獨立求籤頁面
> 預估操作時間：**3–4 小時**（可分兩天）
> 前置文件：`DIVINATION_AUXILIARY_MODE_PLAN.md`（§2 資料模型）、`LIFF_ORACLE_STANDALONE_PLAN.md`（§3 API 設計）

---

## ⚠️ 部署前必讀

### Zoho Creator Deluge 注意事項

沿用 `LIFF_BINDING_DEPLOY_RUNBOOK.md` 中的所有注意事項，特別是：

1. **`for each` 雙空格**：`for each  record in collection`（each 後兩個空格）
2. **`insert into` 用 Creator 原生語法**，不用 Map.insert()
3. **null 判斷**：`if(record.field != null, record.field.toString(), "")`
4. **存檔警告**：黃色可忽略，紅色才需修

### 部署相依鏈

```
正確部署順序：

  Phase 1 — Creator 表單建立 + 資料匯入（無程式碼相依）
    ├── 1-A. 建立 3 張籤詩表（KongMing/GuanYin/GuanDi_Oracle）
    ├── 1-B. CSV 匯入 3 張表
    └── 1-C. Divination_Logs 擴充 Oracle 欄位 + picklist

  Phase 2 — Creator 函數部署（有相依順序）
    ├── 2-A. Oracle.calculateSignByBirthday  ← 無相依
    ├── 2-B. Oracle.formatOracleResponse     ← 無相依
    ├── 2-C. Oracle.selectSign               ← 相依籤詩表
    ├── 2-D. Oracle.routeByQuestionType      ← 無相依
    ├── 2-E. Oracle.buildPromptContext        ← 相依 Oracle.selectSign
    └── 2-F. Oracle.drawIndependent          ← 相依 2-A, 2-B, AIInterpreter.checkCooldownStatus

  Phase 3 — Custom API 端點
    └── 3-A. LIFF_Oracle_Draw_API            → handler: Oracle.drawIndependent

  Phase 4 — LIFF 前端部署
    └── 4-A. oracle.html → GitHub Pages

  Phase 5 — n8n + LINE OA（後續，非本次必要）
    ├── 5-A. n8n 關鍵字路由
    └── 5-B. Rich Menu 新增按鈕
```

---

## Phase 1：Creator 表單建立 + 資料匯入

### Step 1-A：建立 3 張籤詩表單

**操作位置：** Creator → `AI易經` → Create New → Form

#### 表 1：`KongMing_Oracle`（孔明大易神術 384 籤）

| 欄位名 | 類型 | 必填 | 備註 |
|--------|------|------|------|
| `Sign_Order` | Single Line | ✅ | 例：「第 1 籤」 |
| `Sign_Order_Num` | Number | ✅ | 1~384，**設為 Unique** |
| `Fortune_Level` | Single Line | ✅ | 例：「上上籤」 |
| `Palace` | Single Line | | 例：「乾宮」 |
| `Current_Hexagram` | Single Line | | 例：「乾」 |
| `Change_Trigger` | Single Line | | 例：「九五」 |
| `Changed_Hexagram` | Single Line | | 例：「大有」 |
| `Fortune_Category` | Single Line | | 例：「持持」 |
| `Five_Elements` | Single Line | | 例：「金」 |
| `Symbol_1` ~ `Symbol_5` | Single Line (×5) | | 五行符令序列 |
| `Poem_Text` | Multi Line | ✅ | 籤詩原文 |
| `Interpretation` | Multi Line | | 解籤文 |

#### 表 2：`GuanYin_Oracle`（觀音靈籤 100 籤）

| 欄位名 | 類型 | 必填 | 備註 |
|--------|------|------|------|
| `Sign_Order` | Single Line | ✅ | 例：「第 1 籤」 |
| `Sign_Order_Num` | Number | ✅ | 1~100，**設為 Unique** |
| `Fortune_Level` | Single Line | ✅ | 例：「上籤子宮」 |
| `Poem_Title` | Single Line | | 例：「鍾離成道」 |
| `Poem_Text` | Multi Line | ✅ | 籤詩四句 |
| `Holy_Meaning` | Multi Line | | 聖意 |
| `Sign_Interpretation` | Multi Line | | 籤解 |
| `Divine_Guidance` | Multi Line | | 仙機（各事項） |
| `Allusion` | Multi Line | | 典故 |

#### 表 3：`GuanDi_Oracle`（關帝靈籤 100 籤）

| 欄位名 | 類型 | 必填 | 備註 |
|--------|------|------|------|
| `Sign_Order` | Single Line | ✅ | 例：「第 1 籤」 |
| `Sign_Order_Num` | Number | ✅ | 1~100，**設為 Unique** |
| `Fortune_Level` | Single Line | ✅ | 例：「甲甲 (大吉)」 |
| `Poem_Title` | Single Line | | 例：「十八學士登瀛洲」 |
| `Poem_Text` | Multi Line | ✅ | 籤詩四句 |
| `Holy_Meaning` | Multi Line | | 聖意 |
| `Sign_Interpretation` | Multi Line | | 籤解 |
| `Meaning_Explanation` | Multi Line | | 白話解釋 |
| `Detailed_Explanation` | Multi Line | | 詳解 |
| `DongPo_Commentary` | Multi Line | | 東坡解 |
| `BiXian_Commentary` | Multi Line | | 碧仙註 |

```
驗收：
□ 3 張表都已建立
□ 每張表的 Sign_Order_Num 欄位已設為 Unique
□ 欄位名稱完全一致（注意大小寫）
```

---

### Step 1-B：CSV 匯入

**來源檔案（repo 內）：**

| 檔案 | 目標表 | 預期筆數 |
|------|--------|---------|
| `data/divination-database/csv/kongming_oracle.csv` | `KongMing_Oracle` | 384 |
| `data/divination-database/csv/guanyin_oracle.csv` | `GuanYin_Oracle` | 100（※） |
| `data/divination-database/csv/guandi_oracle.csv` | `GuanDi_Oracle` | 100 |

> ※ 觀音靈籤 CSV 有 382 行資料（含重複/備用版本），匯入時以 `Sign_Order_Num` Unique 約束為準，
> 重複筆數會報錯跳過，最終應為 100 筆。若不符，請先用 `scripts/verify_oracle_import.py` 驗證。

**操作步驟：**
```
1. Creator → AI易經 → KongMing_Oracle 表單 → 右上角 ⋯ → Import Data
2. 選擇 CSV 檔案
3. 欄位對應：確認每個 CSV 欄位對應到正確的表單欄位
4. 編碼：UTF-8（CSV 已含 BOM）
5. 執行匯入
6. 對每張表重複以上步驟
```

**匯入後驗證：**

```
驗收：
□ KongMing_Oracle：384 筆
□ GuanYin_Oracle：100 筆（若 CSV 有多餘行，Unique 約束會跳過重複）
□ GuanDi_Oracle：100 筆
□ 抽查第 1 籤、第 50 籤、最後一籤的內容是否正確
□ （選配）執行 scripts/verify_oracle_import.py 驗證
```

---

### Step 1-C：Divination_Logs 擴充欄位

**操作位置：** Creator → `AI易經` → `Divination_Logs` 表單 → Edit Form

#### 新增欄位

| 欄位名 | 類型 | 預設值 | 說明 |
|--------|------|--------|------|
| `Oracle_System` | Picklist | `None` | 選項：`None` / `KongMing` / `GuanYin` / `GuanDi` |
| `Oracle_Sign_Order` | Number | — | 籤號數字 |
| `Oracle_Poem_Text` | Multi Line | — | 籤文快照 |
| `Oracle_Fortune_Level` | Single Line | — | 吉凶等級快照 |

#### 修改現有欄位

| 欄位名 | 修改內容 |
|--------|---------|
| `Divination_Method` (Picklist) | **新增選項 `"籤詩"`**（現有選項保留不動） |

```
驗收：
□ Oracle_System 欄位已新增，Picklist 包含 4 個選項
□ Oracle_Sign_Order、Oracle_Poem_Text、Oracle_Fortune_Level 已新增
□ Divination_Method picklist 包含「籤詩」選項
□ 現有記錄不受影響（新欄位為空/預設值）
```

---

## Phase 2：Creator 函數部署

**操作位置：** Creator → `AI易經` → Settings → Application IDE → Custom Functions

> 部署順序重要！請按 2-A → 2-F 的順序執行。

### Step 2-A：`Oracle.calculateSignByBirthday`（新建）

```
操作步驟：
  1. Custom Functions → 新增 group "Oracle"（若不存在）
  2. group "Oracle" → [+] 新增函數
  3. 函數名稱：calculateSignByBirthday
  4. 貼入 zoho-creator/functions/oracle/Oracle.calculateSignByBirthday.deluge
  5. Save
```

**驗收（Mock 測試）：**
```
輸入：birthday="1990-05-15", system="GuanYin", divinationDate="2026-03-14"
預期：回傳 1~100 之間的整數

輸入：birthday="1990-05-15", system="KongMing", divinationDate="2026-03-14"
預期：回傳 1~384 之間的整數

驗證確定性：相同輸入連續呼叫兩次，結果必須一致
```

---

### Step 2-B：`Oracle.formatOracleResponse`（新建）

```
操作步驟：
  1. group "Oracle" → [+] 新增函數
  2. 函數名稱：formatOracleResponse
  3. 貼入 zoho-creator/functions/oracle/Oracle.formatOracleResponse.deluge
  4. Save
```

> 無外部相依，應可直接存檔。

---

### Step 2-C：`Oracle.selectSign`（新建）

```
操作步驟：
  1. group "Oracle" → [+] 新增函數
  2. 函數名稱：selectSign
  3. 貼入 zoho-creator/functions/oracle/Oracle.selectSign.deluge
  4. Save
```

> 相依 KongMing_Oracle / GuanYin_Oracle / GuanDi_Oracle 表單（Step 1-A 須已完成）。

---

### Step 2-D：`Oracle.routeByQuestionType`（新建）

```
操作步驟：
  1. group "Oracle" → [+] 新增函數
  2. 函數名稱：routeByQuestionType
  3. 貼入 zoho-creator/functions/oracle/Oracle.routeByQuestionType.deluge
  4. Save
```

> 無外部相依。

---

### Step 2-E：`Oracle.buildPromptContext`（新建）

```
操作步驟：
  1. group "Oracle" → [+] 新增函數
  2. 函數名稱：buildPromptContext
  3. 貼入 zoho-creator/functions/oracle/Oracle.buildPromptContext.deluge
  4. Save
```

> 相依 `Oracle.selectSign`（Step 2-C 須已完成）。

---

### Step 2-F：`Oracle.drawIndependent`（新建）

```
操作步驟：
  1. group "Oracle" → [+] 新增函數
  2. 函數名稱：drawIndependent
  3. 貼入 zoho-creator/functions/oracle/Oracle.drawIndependent.deluge
  4. Save
```

> 相依：`Oracle.calculateSignByBirthday`（2-A）、`Oracle.formatOracleResponse`（2-B）、
> `AIInterpreter.checkCooldownStatus`（已存在）、`Divination_Logs`（1-C）。

**存檔時可能出現的警告：**
- `AIInterpreter.checkCooldownStatus is not found` → 確認 AIInterpreter group 存在且函數名稱正確
- 若出現紅色錯誤，先確認 Phase 1 和 Step 2-A/2-B 都已完成

**驗收（Mock 測試）：**
```
// 測試 1：正常求籤
輸入：lineUserId="U已綁定生日的測試帳號", system="GuanYin"
預期：{ "success": true, "oracle": { "system": "GuanYin", "sign_order": "第 X 籤", ... } }

// 測試 2：未綁定生日
輸入：lineUserId="U未綁定生日帳號", system="GuanYin"
預期：{ "success": false, "message": "需先綁定生日" }

// 測試 3：冷卻觸發（緊接測試 1 再呼叫一次）
輸入：lineUserId="U已綁定生日的測試帳號", system="GuanYin"
預期：{ "success": true, "blocked": true, "cooldown": true, "message": "..." }

// 測試 4：無效系統
輸入：lineUserId="Utest", system="Tarot"
預期：{ "success": false, "message": "無效的籤詩系統..." }
```

---

## Phase 3：Custom API 端點

**操作位置：** Creator → `AI易經` → Settings → Microservices → Custom API

### Step 3-A：新增 `LIFF_Oracle_Draw_API`

| 欄位 | 值 |
|------|-----|
| Endpoint Name | `liff_oracle_draw` |
| Handler | `Oracle.drawIndependent` |
| Method | POST |
| Authentication | Public（使用 public_key） |

```
建立後：
  1. 複製完整 endpoint URL（含 public_key）
  2. 記下此 URL，Phase 4 需填入 oracle.html
```

**驗收：**
```
□ 用 curl 測試端點：
  curl -X POST "<endpoint_url>" \
    -H "Content-Type: text/plain" \
    -d '{"lineUserId":"U測試帳號","system":"GuanYin"}'
□ 回傳 JSON 包含 success 欄位
```

---

## Phase 4：LIFF 前端部署

### Step 4-A：更新 `oracle.html` API URL 並部署

**操作步驟：**

```
1. 開啟 liff/oracle.html
2. 找到 ORACLE_API 變數（約第 480 行附近）：
   var ORACLE_API = "...";
3. 替換為 Step 3-A 取得的完整 endpoint URL
4. 同時確認 LIFF_ID 變數正確
5. Commit + Push 到 main → GitHub Pages 自動部署
```

**LIFF 設定（LINE Developers Console）：**

```
操作步驟：
  1. LINE Developers Console → Channel → LIFF
  2. 若使用現有 LIFF App：在「Additional URLs」新增 oracle.html 路徑
     → https://<github-pages-domain>/oracle.html
  3. 若需要新 LIFF App：建立新的 LIFF，Endpoint URL 指向 oracle.html
  4. Save
```

**驗收：**
```
□ 用手機 LINE 開啟 LIFF URL → oracle.html 正常載入
□ 頁面顯示「求籤問卦」標題 + 3 個系統選擇卡片
□ 未綁定生日的帳號 → 顯示「需先綁定生日」提示
□ 已綁定生日的帳號 → 點擊系統卡片 → 搖籤動畫 → 顯示籤詩結果
□ 點「分享到 LINE」→ shareTargetPicker 開啟 → 可選擇好友/群組分享
□ 點「再來一支」→ 返回系統選擇畫面
□ 冷卻觸發時 → 顯示安撫訊息 + 等待時間
□ 點「換個系統試試」→ 返回系統選擇畫面
```

---

## Phase 5：n8n + LINE OA（後續階段）

> 此階段非必要，可在 Phase 1–4 驗收通過後擇期執行。

### Step 5-A：n8n 關鍵字路由

**操作位置：** n8n → `LINE_Webhook__Router` workflow

新增路由規則：

| 關鍵字 | 回覆動作 |
|--------|---------|
| `求籤` `抽籤` `靈籤` | 回覆 LIFF Oracle URL |
| `觀音` `觀音靈籤` | 回覆 LIFF Oracle URL + `?system=GuanYin` |
| `關帝` `關帝靈籤` | 回覆 LIFF Oracle URL + `?system=GuanDi` |
| `孔明` `孔明神術` | 回覆 LIFF Oracle URL + `?system=KongMing` |

### Step 5-B：Rich Menu 新增按鈕

**操作位置：** LINE Official Account Manager → Rich Menu

```
操作步驟：
  1. 編輯現有 Rich Menu（或建新版本）
  2. 新增「求籤」按鈕區塊
  3. 動作類型：URI
  4. URI：https://liff.line.me/{LIFF_ID}/oracle
  5. 儲存 + 啟用
```

---

## 端到端驗收清單

### 獨立求籤完整流程

```
□ LINE 使用者點 Rich Menu「求籤」或輸入「求籤」
  → 開啟 LIFF oracle.html

□ 頁面載入正常，顯示 3 系統選擇卡片

□ 已綁定生日的使用者：
  □ 點「觀音靈籤」→ 搖籤動畫 1.5s → 顯示籤詩結果
  □ 結果包含：籤序、吉凶、籤文、聖意、籤解等
  □ 點「分享到 LINE」→ 成功發送文字訊息
  □ 點「再來一支」→ 回到選擇畫面
  □ 再次點同系統 → 觸發冷卻 → 顯示安撫訊息

□ 未綁定生日的使用者：
  □ 點任何系統 → 顯示「需先綁定生日」提示
  □ 點「前往綁定生日」→ 跳轉至 LIFF Binding 頁面

□ Divination_Logs 驗證：
  □ 成功求籤後，Divination_Logs 新增一筆記錄
  □ Divination_Method = "籤詩"
  □ Oracle_System = 所選系統
  □ Oracle_Sign_Order = 籤號
  □ Original_Question = "求籤:{system}"
  □ Question_Type_AI = "其他"
  □ Status = "已提問"

□ 子時換日驗證（23:00 後測試）：
  □ 22:59 求籤得到籤號 A
  □ 23:01 求籤得到籤號 B（應與隔天相同）
```

### 跨功能驗證

```
□ 求籤後，完整占卜的冷卻機制正常運作
  （求籤佔「其他」類型配額，不影響愛情/事業等類型）
□ 完整占卜後，求籤的冷卻計算正常
□ 孔明籤結果顯示五行符令序列 + 符令 CTA（若已設定）
□ URL 參數預選功能：oracle.html?system=GuanYin → 直接開始觀音搖籤
```

---

## 相關檔案清單

| 檔案路徑 | 動作 | 部署目標 |
|----------|------|---------|
| `data/divination-database/csv/kongming_oracle.csv` | 匯入 | Creator KongMing_Oracle |
| `data/divination-database/csv/guanyin_oracle.csv` | 匯入 | Creator GuanYin_Oracle |
| `data/divination-database/csv/guandi_oracle.csv` | 匯入 | Creator GuanDi_Oracle |
| `zoho-creator/functions/oracle/Oracle.calculateSignByBirthday.deluge` | 新建 | Creator Function |
| `zoho-creator/functions/oracle/Oracle.formatOracleResponse.deluge` | 新建 | Creator Function |
| `zoho-creator/functions/oracle/Oracle.selectSign.deluge` | 新建 | Creator Function |
| `zoho-creator/functions/oracle/Oracle.routeByQuestionType.deluge` | 新建 | Creator Function |
| `zoho-creator/functions/oracle/Oracle.buildPromptContext.deluge` | 新建 | Creator Function |
| `zoho-creator/functions/oracle/Oracle.drawIndependent.deluge` | 新建 | Creator Function |
| `liff/oracle.html` | 部署 | GitHub Pages |
| `scripts/verify_oracle_import.py` | 工具 | 本機執行（驗證用） |
| `scripts/xlsx_to_csv.py` | 工具 | 本機執行（轉檔用） |

---

## 常見問題 FAQ

### Q1. Oracle.drawIndependent 存檔時出現 `checkCooldownStatus not found`
**A.** 確認 AIInterpreter group 下的 `checkCooldownStatus` 函數存在且名稱拼寫一致。
此函數在 MVP-1 已部署，若未更名應可直接引用。

### Q2. CSV 匯入後筆數不對
**A.** 檢查：
- 觀音靈籤 CSV 有備用/重複版本行，Unique 約束會跳過，最終應為 100 筆
- 確認 CSV 編碼為 UTF-8（含 BOM）
- 用 `scripts/verify_oracle_import.py` 交叉驗證

### Q3. 冷卻訊息中的 `time_remaining` 為空
**A.** `checkCooldownStatus` 回傳的 `time_remaining` 格式由該函數決定。
若為空，前端會顯示預設訊息「您已於近期求過籤，請稍候再試」，不影響功能。

### Q4. 23:00 後求籤結果沒有換日
**A.** 確認部署的是最新版 `Oracle.drawIndependent.deluge`（含子時換日修正，commit `00715e8`）。
檢查第 105-110 行是否有 `hourNow >= 23` 判斷。

### Q5. oracle.html 開啟後顯示空白
**A.** 檢查：
- LIFF_ID 是否正確填入
- ORACLE_API URL 是否已替換為實際 endpoint URL
- 瀏覽器 Console 是否有 CORS 或 JS 錯誤
- 確認 oracle.html 已 push 到 GitHub Pages 且部署完成

### Q6. 分享到 LINE 沒反應
**A.** `liff.shareTargetPicker` 需在 LINE 內建瀏覽器中才能使用。
桌面瀏覽器測試時會靜默失敗（已有 fallback 到 `liff.sendMessages`）。
確認 LIFF 設定的 Scope 包含 `shareTargetPicker`。

---

## 回滾方案

如需緊急回滾：

| 層級 | 動作 | 影響 |
|------|------|------|
| **LIFF 前端** | GitHub Pages revert oracle.html | 求籤頁面下線，不影響其他功能 |
| **Custom API** | 刪除 `liff_oracle_draw` endpoint | API 停用，前端顯示錯誤 |
| **Creator 函數** | 不需刪除（函數存在但不被呼叫即無影響） | 無影響 |
| **Divination_Logs 欄位** | 不可回滾（新欄位為空值，不影響現有記錄） | 無影響 |
| **籤詩表** | 保留（資料表獨立，不影響其他功能） | 無影響 |
