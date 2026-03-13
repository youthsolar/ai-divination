# LIFF V2 Patch 1 — 補丁任務

**日期**：2026-03-13  
**優先級**：上市前必修  
**負責人**：Dora（Claude Code）

---

## 問題 1：回訪用戶表單預填 + 防止 Clients_Report 重複建立

### 現狀問題
- 每次用戶送出占卜，都會在 Creator `Clients_Report` 新建一筆紀錄
- 同一個 LINE User ID 會出現多筆重複資料
- 回訪用戶每次都要重填所有個人資料

### 修改範圍

#### A. 新增 Creator Custom API：`API.getClientByLineUID`
位置：`zoho-creator/functions/api/API.getClientByLineUID.deluge`（新建檔案）

功能：
- 輸入：`lineUserId` (string)
- 查詢 `Clients_Report[Line_User_ID == lineUserId]`
- 有找到 → 回傳 `{ found: true, data: { lastName, firstName, phone, email, birthDate, birthTime } }`
- 找不到 → 回傳 `{ found: false }`

> 注意：`Date_Of_Birth` 在 Creator 是 DateTime 欄位，回傳時拆成 `birthDate`（yyyy-MM-dd）和 `birthTime`（HH:mm）兩個欄位

#### B. 修改前端 `liff/index.html`

在 LIFF init 完成、取得 `lineUserId` 之後，立即呼叫 `API.getClientByLineUID`：
- 若 `found: true`：自動預填 #windsLastName、#windsFirstName、#windsPhone（去掉 +886 前綴，還原成 09xxxxxxxx）、#windsEmail、#birthDate、#birthTime
- 若 `found: false`：表單維持空白

API URL 格式（Dora 部署完 Custom API 後填入 public key）：
```
https://www.zohoapis.com/creator/custom/uneedwind/getClientByLineUID?publickey=XXXX
```

#### C. 修改 Creator `liffDivinationMvp` 函數
位置：`zoho-creator/functions/api/API.liffDivinationMvp.deluge`（若已存在）或等效的處理函數

在建立 `Clients_Report` 之前，先查：
```deluge
existingClient = Clients_Report[Line_User_ID == lineUserId];
if (existingClient.count() > 0) {
  // 用現有的 clientId，不新建
  clientId = existingClient.getFirst().ID;
} else {
  // 新建 Clients_Report 記錄
  newClient = insert into Clients_Report [ ... ];
  clientId = newClient;
}
```

---

## 問題 2：寫入 Zoho CRM Leads

### 現狀問題
- LIFF 免費用戶的聯絡資料只存在 Creator `Clients_Report`，不進 Zoho CRM
- 沒有付款的用戶完全無法用於後續行銷

### 修改範圍

#### A. 修改 Creator `liffDivinationMvp` 函數

在 Clients_Report 處理完成後，加入 CRM Leads 寫入邏輯（用 Zoho CRM API 或 Connection）：

```deluge
// 檢查 CRM Leads 是否已存在（用 Email 去重）
// 若不存在 → 新建 Lead
crmPayload = Map();
crmPayload.put("Last_Name", lastName);
crmPayload.put("First_Name", firstName);
crmPayload.put("Mobile", phoneE164);
crmPayload.put("Email", email);
crmPayload.put("Lead_Source", "LINE占卜LIFF");

// 用 Zoho CRM Connection 呼叫 CRM API
// Connection name 請參考現有函數（如 API.createTalismanOrder 的 CRM 串接方式）
```

> **去重規則**：先用 Email 查 CRM Leads，若已存在則跳過，不重複建立。

---

## 驗收標準

- [ ] 回訪用戶（已有 LINE User ID 在 Clients_Report）進 LIFF 後，表單自動帶入舊資料
- [ ] 同一個 LINE User ID 不會產生第二筆 Clients_Report 記錄
- [ ] 首次用戶送出占卜後，Zoho CRM Leads 新增一筆（Lead Source = "LINE占卜LIFF"）
- [ ] 同一 Email 不會重複建立 CRM Lead
- [ ] 預填的手機號碼格式為 09xxxxxxxx（非 E.164）

---

## 部署說明

1. `API.getClientByLineUID` 建立後，需在 Zoho Creator 手動建立對應的 Custom API 並取得 public key
2. 取得 public key 後更新 `liff/index.html` 的 `PREFILL_API` 變數
3. Push 到 `gh-pages` branch 讓 LIFF 上線
4. `liffDivinationMvp` 修改後需在 Creator 重新儲存並確認編譯版本已更新（如遇 cache 問題，刪除重建）
