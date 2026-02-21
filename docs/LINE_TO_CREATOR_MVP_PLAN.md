# LINE → Creator 資料打通 — MVP 修正計畫

> 目標：MVP 最快上線，不跨太多平台，讓 LINE LIFF 完成商業閉環（可收費）。
> 第一步：**打通「資料從 LINE 進 Creator」**。

---

## 一、專案理解摘要

### 1.1 AI易經.ds 核心結構

| 元件 | 說明 |
|------|------|
| **Clients_Report**（個案） | 有 `Line_User_ID`、`Date_Of_Birth`，可依 LINE userId 建立虛擬個案 |
| **Divination_Logs**（占卜紀錄） | 有 `Client_Link`（必填 picklist→個案）、`Original_Question`、`AI_Interpretation` |
| **API.LIFF_Divination_MVP** | 已存在，簽名 `(lineUserId, birthday, question)`，流程：找/建個案 → 冷卻檢查 → 產摘要 → 寫 Divination_Logs → LINE push |
| **Talisman_Purchases** | 訂單表，有 `Line_User_ID`、`Client_Link`，ECPay 付款後可交付 |

### 1.2 商業閉環（MVP）

```
LINE 使用者 → LIFF（生日+問題）→ Creator API → 免費摘要 + CTA
                                              ↓
                                    解鎖/購買符令 → ECPay → 付款成功
                                              ↓
                                    Creator 更新訂單 → LINE push 交付
```

### 1.3 現況與斷點

| 項目 | 現況 | 問題 |
|------|------|------|
| **LIFF 前端** | `liff/index.html` | 使用 Cloudflare Worker 代理 `liff-api-proxy.youthsun.workers.dev`（多一層） |
| **API 端點** | DS 內嵌頁寫 `LINE_LIFF_Fetch_API` | Custom API 是否已建立？handler 是否正確轉呼叫 `API.LIFF_Divination_MVP`？ |
| **欄位** | LIFF 要求 birthDate + birthTime | `API.LIFF_Divination_MVP` 只收 `birthday`（YYYY-MM-DD），birthTime 未用 |
| **Client_Link** | Divination_Logs 必填 | `API.LIFF_Divination_MVP` 會建立虛擬個案並填入，邏輯正確 |

---

## 二、打通「LINE → Creator」的最小改動

### 2.1 架構目標（不跨太多平台）

```
LIFF（靜態託管）→ Creator Custom API（Public Key）→ API.LIFF_Divination_MVP
```

- **移除**：Cloudflare Worker 代理
- **保留**：Creator 單一後端；LIFF 直接打 Creator

### 2.2 必要修正清單

#### A) Creator 端：Custom API 與 Handler

1. **確認/建立 Custom API** `LINE_LIFF_Fetch_API`
   - 路徑：Microservices → Custom API
   - 認證：Public Key
   - HTTP Method：POST
   - Content-Type：application/json

2. **Handler 函數**（若尚未存在，需新增）
   - 簽名：`map API.LIFF_Divination_MVP_Handler(map crmAPIRequest)`
   - 邏輯：從 `crmAPIRequest` 取出 `lineUserId`、`birthday`、`question`，呼叫 `API.LIFF_Divination_MVP`，回傳結果
   - 註：Creator Custom API 收到的 JSON body 會自動轉成 map 傳入

#### B) LIFF 前端：`liff/index.html`

1. **API_URL**：改為 Creator 直連
   ```
   https://www.zohoapis.com/creator/custom/uneedwind/LINE_LIFF_Fetch_API?public_key=<你的public_key>
   ```

2. **欄位簡化**：MVP 只收「生日 + 問題」
   - 移除 `birthTime` 必填
   - 或改為選填（後端仍只傳 `birthday`）

3. **Request body**：維持
   ```json
   { "lineUserId": "...", "birthday": "YYYY-MM-DD", "question": "..." }
   ```

#### C) 可選：Divination_Logs 欄位

- 若未來要區分「LIFF 來源」或存 `Line_User_ID` 備查，可在 Divination_Logs 新增 `Line_User_ID`、`LIFF_Birthday`
- MVP 可先不做，`Client_Link` 已可追溯到個案與 Line_User_ID

---

## 三、驗收標準

1. **LIFF 送出**：使用者在 LIFF 填生日+問題，點送出
2. **Creator 收到**：Custom API 被呼叫，`API.LIFF_Divination_MVP` 執行
3. **資料入庫**：Clients_Report（若新）與 Divination_Logs 有正確紀錄
4. **回應正確**：LIFF 收到 `success`、`summary_text`，並顯示摘要
5. **LINE push**：使用者收到免費摘要（若 `System.LINE_ChannelAccessToken` 已設定）

---

## 四、執行順序建議

1. **Creator**：確認/建立 `LINE_LIFF_Fetch_API` 與 handler
2. **LIFF**：改 API_URL 為 Creator 直連，簡化欄位
3. **測試**：從 LIFF 實際送一筆，檢查 Creator 紀錄與回應
4. **清理**：確認打通後，移除 Cloudflare Worker 與相關 DNS（若存在）

---

## 五、已設定項目

| 項目 | 值 |
|------|-----|
| Custom API URL | `https://www.zohoapis.com/creator/custom/uneedwind/LINE_LIFF_Fetch_API` |
| Public Key | `wqWnHTZqhSTFBNTARwwNjAERw` |

## 六、待確認項目

1. LIFF 託管位置：pages.dev、自架、或 Zoho LandingPage？（影響 CORS 與最終 URL）
2. `System.LINE_ChannelAccessToken`、`DeliveryPageBaseURL` 是否已在 Creator 變數中設定？
