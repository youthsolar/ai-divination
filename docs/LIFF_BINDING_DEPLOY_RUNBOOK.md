# LIFF 生日綁定系統 — 部署操作手冊
> 建立時間：2026-02-25
> 影響函數：`API.BindLineUser`、`LIFFBinding`（Page）、`API.PredictFromLine_v1`（修改）
> 預估操作時間：**45–60 分鐘**

---

## ⚠️ 部署前必讀：Zoho Creator Deluge 語言注意事項

在 Creator IDE 貼入程式碼時，以下幾點容易踩雷：

### 1. `insert into` 語法（Creator 原生，非 Map.insert()）
```deluge
// ✅ Creator 原生語法（本專案統一使用）
new_record = insert into Form_Name
[
    Field_Name = value
    Composite_Field.sub_field = value
];
new_id = new_record.get("ID").toString();

// ❌ 不要用 Map().insert() 方式，Creator IDE 存檔時會報錯
```

### 2. `for each` 的雙空格（Creator 特有）
```deluge
// ✅ 正確：each 後有兩個空格
for each  record in collection
{
    // ...
}

// ❌ 錯誤：只有一個空格，Creator IDE 解析會失敗
for each record in collection
```

### 3. Composite 欄位的存取方式（以 Visitor_Name 為例）
```deluge
// insert 時用點記法
insert into Clients_Report
[
    Visitor_Name.last_name  = "(LINE)"
    Visitor_Name.first_name = "使用者"
];

// 讀取時用點記法
name = record.Visitor_Name.last_name;

// update 時 Map key 直接用欄位名（不含子欄位）
updateMap = Map();
updateMap.put("Date_Of_Birth", newDate);
Clients_Report[ID == recordId] = updateMap;
```

### 4. `todate()` 日期格式（Creator 特有格式字串）
```deluge
// 解析 YYYY-MM-DD 字串
dt = todate("1996-08-15", "yyyy-MM-dd");

// 解析含時間的字串
dt = todate("1996-08-15 12:30:00", "yyyy-MM-dd HH:mm:ss");

// 注意：
//   yyyy = 4位西元年（小寫）
//   MM   = 2位月份（大寫）
//   dd   = 2位日期（小寫）
//   HH   = 24小時制小時（大寫）
//   mm   = 分鐘（小寫）
//   ss   = 秒（小寫）
```

### 5. try/catch 格式（Creator Deluge 特有）
```deluge
try
{
    // 可能失敗的程式碼
}
catch (variableName)
{
    // 錯誤處理（variableName 是例外物件）
}
```

### 6. 字串連接（用 `+`，不用 `concat()`）
```deluge
fullMsg = "第一行\n" + "第二行 " + someVariable;
```

### 7. null 判斷慣用模式
```deluge
// Creator 推薦寫法
value = if(record.field != null, record.field.toString(), "");

// 或直接用 if 區塊
if(someMap.get("key") != null)
{
    val = someMap.get("key").toString().trim();
}
```

---

## 部署順序總覽

Creator IDE 有**相依性偵測**：存檔時會檢查函數呼叫的目標是否存在。
若被呼叫的函數還沒建立，IDE 可能出現紅色警告甚至無法儲存。

```
正確部署順序：
  1. 先建後端函數（API 層）
     └─ API.BindLineUser         ← 新建，無相依
     └─ API.GetTalismanByToken   ← 新建，無相依
     └─ API.PredictFromLine_v1   ← 覆蓋，相依 AIInterpreter/Tarot（已存在）

  2. 再建 Custom API Endpoints（Microservices）
     └─ line_binding             → handler: API.BindLineUser
     └─ get_talisman_by_token    → handler: API.GetTalismanByToken

  3. 最後建 Creator Pages（頁面呼叫 endpoint，endpoint 必須先建好）
     └─ TalismanDelivery
     └─ LIFFBinding

  4. 填入設定值（URL 與 public_key）
     └─ LIFFBinding.htmlpage 中的 __LINE_BINDING_PUBLIC_KEY__
     └─ App Variable: System.DeliveryPageBaseURL
```

---

## Step 1：部署 `API.BindLineUser`（新建函數）

**操作位置：**
Creator → `AI易經` → Settings → Application IDE → Custom Functions

```
操作步驟：
  1. 在 Custom Functions 清單左側，找到 group "API"
  2. 點 group "API" 旁的 [+] 新增函數
  3. 函數名稱輸入：BindLineUser
  4. 將 zoho-creator/functions/api/API.BindLineUser.deluge 全文貼入
  5. 點 [Save]
```

**存檔時若出現警告：**
- `thisapp.Zodiac.getZodiacSign is not found` → 正常（計算函數包在 try/catch，可忽略黃色警告，只要不是紅色錯誤就可存）
- `thisapp.LunarAI.SolarToLunar is not found` → 同上，計算函數為選配，若不存在則 catch 靜默處理

**驗收（Mock 測試）：**
```json
// 輸入 1：缺少 birthday → 應回 missing_birthday
{
  "lineUserId": "Utest123",
  "birthday": "",
  "birthTime": ""
}
// 預期輸出
{ "ok": false, "reason": "missing_birthday", "message": "請填入..." }

// 輸入 2：正常綁定
{
  "lineUserId": "Utest456",
  "birthday": "1996-08-15",
  "birthTime": "12:30"
}
// 預期輸出
{ "ok": true, "updated": false, "clientId": "...", "message": "生日綁定成功..." }
```

---

## Step 2：部署 `API.GetTalismanByToken`（新建函數）

```
操作步驟：
  1. group "API" → [+] 新增函數
  2. 函數名稱：GetTalismanByToken
  3. 貼入 zoho-creator/functions/api/API.GetTalismanByToken.deluge
  4. Save
```

**驗收：**
```json
// 輸入：空 token
{ "token": "" }
// 預期：{ "ok": false, "reason": "missing_token" }
```

---

## Step 3：覆蓋 `API.PredictFromLine_v1`（修改現有函數）

> ⚠️ **此步驟為「覆蓋」，會完全取代現有版本。**
> 建議在 IDE 先全選複製現有版本備份，再執行覆蓋。

```
操作步驟：
  1. group "API" → 找到 "PredictFromLine_v1" → 點進去
  2. Ctrl+A 全選現有內容 → 刪除
  3. 貼入 zoho-creator/functions/api/API.PredictFromLine_v1.deluge
  4. Save
```

**修改重點（本次變動說明）：**
| 位置 | 修改前 | 修改後 |
|------|--------|--------|
| `missing_client_binding` 訊息（第 61 行附近） | 只有文字拒絕 | 加入 LIFF 連結（`LIFFBinding` 頁 URL） |

**驗收：**
```json
// 輸入：未知的 lineUserId
{ "lineUserId": "U_nonexistent", "text": "我該怎麼辦？", "timestamp": 1234567890 }
// 預期：
{
  "ok": true,
  "blocked": true,
  "message": "歡迎來到找風問幸福 🔮\n\n...LIFF 連結..."
}
```

---

## Step 4：建立 Microservices Custom API Endpoints

**操作位置：**
Creator → `AI易經` → Settings → Microservices → Custom API

### 4-A. 新增 `line_binding` endpoint

| 欄位 | 值 |
|------|-----|
| Endpoint Name | `line_binding` |
| Handler | `API.BindLineUser` |
| Method | POST |
| Authentication | Public（使用 public_key） |

建立後：
→ 複製 endpoint URL 中的 `?public_key=XXXX` 部分
→ 填入 `LIFFBinding.htmlpage.deluge` 中的 `__LINE_BINDING_PUBLIC_KEY__`

### 4-B. 確認 `get_talisman_by_token` endpoint（若尚未建立）

| 欄位 | 值 |
|------|-----|
| Endpoint Name | `get_talisman_by_token` |
| Handler | `API.GetTalismanByToken` |
| Method | POST |
| Authentication | Public（使用 public_key） |

---

## Step 5：建立 Creator Pages

### 5-A. 建立 `TalismanDelivery` 頁面

```
操作步驟：
  1. Creator → AI易經 → Pages → [新增 Page]
  2. 名稱：TalismanDelivery
  3. 加入 HTML Snippet 元件
  4. 貼入 zoho-creator/functions/pages/TalismanDelivery.htmlpage.deluge
     的 HTML 內容（從 <!DOCTYPE html> 到 </html>）
  5. Save / Publish
  6. 複製頁面完整 URL → 填入 App Variable: System.DeliveryPageBaseURL
```

### 5-B. 建立 `LIFFBinding` 頁面

> ⚠️ **請先完成 Step 4-A（建立 line_binding endpoint 並取得 public_key）**

```
操作步驟：
  1. Creator → AI易經 → Pages → [新增 Page]
  2. 名稱：LIFFBinding
  3. 加入 HTML Snippet 元件
  4. 將 zoho-creator/functions/pages/LIFFBinding.htmlpage.deluge 的 HTML
     部分貼入（<!DOCTYPE html> 到 </html>）
  5. 在 HTML 中找到 __LINE_BINDING_PUBLIC_KEY__
     → 替換為 Step 4-A 取得的實際 public_key
  6. Save / Publish
  7. 複製頁面完整 URL
```

---

## Step 6：LINE Developers Console 設定

**操作位置：**
LINE Developers Console → 你的 Channel → LIFF → `2009168674-G2KqF3Jv`

```
操作步驟：
  1. 進入 LIFF 設定頁
  2. 在「Additional URLs」區塊（若無則找「Endpoint URL」）
     → 新增 LIFFBinding 頁面的完整 URL
     格式：https://creatorapp.zoho.com/uneedwind/ai/page/LIFFBinding
  3. Save
```

> 若 LIFF 僅允許一個 Endpoint URL，可考慮：
> (a) 新建第二個 LIFF（只需在同一 Channel 下新增），
> (b) 或在 LIFFBinding 頁面的 LIFF_ID 改用新 LIFF ID

---

## Step 7：端到端驗收

```
LIFF 綁定流程：
□ LINE 新用戶送任意訊息 → 收到含 LIFF 連結的回覆（含 LIFFBinding URL）
□ 點連結 → LINE 內建瀏覽器開啟 LIFFBinding 頁面
□ Step 1 歡迎畫面顯示，動畫淡入正常 ✅
□ 點「開始設定」→ 進入 Step 2 生日表單
□ 填入 1996-08-15，可選填時間 12:30
□ 點「確認綁定」→ Loading 動畫顯示 → API.BindLineUser 回傳 { ok: true }
□ Creator Clients_Report 新增記錄：
     Line_User_ID = "U..."（正確的 lineUserId）
     Date_Of_Birth = 1996-08-15（或含時間）
     Client_Type = "虛擬"
□ 頁面自動進入 Step 3（成功畫面）
□ 點「返回 LINE 開始占卜」→ LINE 視窗關閉（或跳轉）
□ 回 LINE 輸入問題 → PredictFromLine_v1 找到 clientId → 正常出兩份占卜
```

---

## 常見問題 FAQ

### Q1. IDE 存 API.BindLineUser 時出現「Function not found」
**A.** 計算函數（Zodiac、LunarAI 等）若版本不同名稱不一樣，會出現黃色警告。
由於全部包在 `try/catch`，**只要能存檔（橙/黃色警告可接受，紅色錯誤才需修）**，功能正常。

### Q2. 「for each」貼入後 Creator 說語法錯誤
**A.** 確認 `each` 後面有**兩個空格**：`for each  record in collection`
常見問題：複製時空格被壓縮成一個。

### Q3. LIFFBinding 頁面開啟後顯示「LINE 使用者 ID 缺失」
**A.** 表示 LIFF 初始化失敗，可能原因：
  (a) 此頁面 URL 未加入 LIFF Additional URLs → 去 LINE Developers Console 加入
  (b) 在桌面瀏覽器測試（非 LINE 內建）→ 正常，改用手機 LINE 測試

### Q4. API 呼叫回傳 401 / 403
**A.** `__LINE_BINDING_PUBLIC_KEY__` 未替換 → 回到頁面 HTML 中找 public_key 行替換

### Q5. 送出後一直 Loading 不回來
**A.** 開啟 LINE 內建瀏覽器開發者工具（或改用 ngrok 測試），看 network 請求是否有
  - 404：endpoint 名稱打錯（確認是 `line_binding` 不是 `line-binding`）
  - CORS error：Creator Public API 不會有 CORS 問題，若有請確認 URL 格式正確

---

## 相關檔案清單

| 檔案路徑 | 動作 | 說明 |
|----------|------|------|
| `zoho-creator/functions/api/API.BindLineUser.deluge` | 新建 | 生日綁定後端函數 |
| `zoho-creator/functions/pages/LIFFBinding.htmlpage.deluge` | 新建 | LIFF 3步驟生日綁定頁 |
| `zoho-creator/functions/api/API.PredictFromLine_v1.deluge` | 覆蓋（小幅修改） | missing_client_binding 改含 LIFF 連結 |
| `zoho-creator/functions/api/API.GetTalismanByToken.deluge` | 新建（上次已建） | Token 驗證後端 |
| `zoho-creator/functions/pages/TalismanDelivery.htmlpage.deluge` | 新建（上次已建） | 符令交付頁 |
| `docs/MVP_DEPLOY_CHECKLIST.md` | 參考 | 完整 MVP 部署清單 |
