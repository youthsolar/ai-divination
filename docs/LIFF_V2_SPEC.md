# LIFF V2 改版規格書

**版本**：2.0  
**日期**：2026-03-13  
**負責人**：Dora（Claude Code）  
**交付目標**：`liff/index.html`（改版）、`liff/delivery.html`（新建）、`liff/reference/simplybook-winds-widget.html`（設計參考）

---

## 一、整體目標

將 winds.tw SimplyBook 頁面的三層選題 UX 整合進 LIFF，同步收集個人資料，統一品牌視覺，完善付款與交付流程。

---

## 二、設計系統

### 2.1 參考來源
設計語言完全沿用 `liff/reference/simplybook-winds-widget.html`。

### 2.2 配色
| 用途 | 色碼 |
|------|------|
| 主色（文字、邊框選中）| `#3b262a` |
| 次色（石板灰、邊框）| `#5a656b` |
| Hover 底色 | `#f0e6e6` |
| 頁面背景 | `#faf8f6` |
| 金色 Accent（CTA、裝飾）| `#c9a84c` |
| 邊框預設 | `#dcd2d2` |

### 2.3 CSS 前綴
所有新增 class 使用 `winds-` 前綴，與 SB 頁面共用系統。

### 2.4 動畫
```css
@keyframes windsFadeInUp {
  0%   { opacity: 0; transform: translateY(15px); }
  100% { opacity: 1; transform: translateY(0); }
}
```
出現的元素（卡片展開、結果顯示）套用 `animation: windsFadeInUp 0.6s ease-out forwards`。

### 2.5 文案規則
- **禁止出現**：AI、人工智能、智能體、機器人、LLM 等詞彙（避免讓用戶覺得是電腦自動產出）
- 標題：「🌙 找風問幸福」
- 副標：「易經 × 塔羅 × 靈性占卜」

---

## 三、頁面結構（index.html）

### 3.1 三個狀態切換
```
[狀態 A] 三層選題卡片
    ↓ 選完第三層後展開
[狀態 B] 個人資料 + 引導問題
    ↓ 送出後
[狀態 C-Loading] 等待畫面（30–60秒）
    ↓ 收到結果
[狀態 C-Result] 摘要結果 + 解鎖按鈕
```

---

## 四、狀態 A：三層選題卡片

### 4.1 互動行為
完全複製 `simplybook-winds-widget.html` 的 `handleTopicClick`、`handleSubClick`、`handleThirdClick` 邏輯：

- 點第一層卡片 → 隱藏其他第一層卡片 → 展開對應的第二層列
- 點第二層卡片 → 隱藏其他第二層卡片 → 展開對應的第三層列
- 點第三層卡片 → 收合呈三欄（topic-row / sub-row / third-row 各佔一欄）→ 展開個人資料表單（animates in）
- 任一層可點選中的卡片取消，往上層回收

### 4.2 CSS 階段 class
| 階段 | `.winds-topic-section` 的 class |
|------|-------------------------------|
| 初始 | 無 |
| 選完第一層 | `winds-has-sub-selected` |
| 選完第二層 | `winds-has-sub-selected winds-has-third-selected` |
| 選完第三層 | `winds-has-sub-selected winds-has-third-selected winds-step-3` |

### 4.3 分類內容

**移除「老師」類別**，保留以下三類（內容完全同 SB 頁面）：

#### 感情與婚姻困擾
| 第二層 | 第三層（各 4 題）|
|--------|----------------|
| 復合與舊愛 | 1.1.1–1.1.4（同 SB）|
| 暗戀與曖昧 | 1.2.1–1.2.4（同 SB）|
| 伴侶與婚姻 | 1.3.1–1.3.4（同 SB）|
| 單身與桃花 | 1.4.1–1.4.4（同 SB）|

#### 事業與財富規劃
| 第二層 | 第三層（各 4 題）|
|--------|----------------|
| 求職與換工作 | 2.1.1–2.1.4（同 SB）|
| 創業與副業 | 2.2.1–2.2.4（同 SB）|
| 職場人際與升遷 | 2.3.1–2.3.4（同 SB）|
| 投資與財運 | 2.4.1–2.4.4（同 SB）|

#### 身心與健康狀態
| 第二層 | 第三層（各 4 題）|
|--------|----------------|
| 身體健康 | 3.1.1–3.1.4（同 SB）|
| 心理與情緒 | 3.2.1–3.2.4（同 SB）|
| 靈異與運勢 | 3.3.1–3.3.4（同 SB）|
| 家庭與寵物 | 3.4.1–3.4.4（同 SB）|

> 每一張卡的標題、說明文字直接從 `simplybook-winds-widget.html` 複製，不需重新撰寫。

---

## 五、狀態 B：個人資料表單

### 5.1 顯示時機
選完第三層卡片後，`birthCardWrapper` 展開（`windsFadeInUp` 動畫）。

### 5.2 欄位定義

| 欄位 | 類型 | Creator API Name | 驗證規則 |
|-----|------|----------------|---------|
| 姓 | text | `Visitor_Name.last_name` | 必填 |
| 名 | text | `Visitor_Name.first_name` | 必填 |
| 手機 | tel | `Phone_Number` | 必填，台灣格式 `^09\d{8}$`，轉 E.164 存 `+886` |
| Email | email | `Email` | 必填，**只接受 @gmail.com**（驗證：`email.endsWith('@gmail.com')`）|
| 出生日期 | date | `Date_Of_Birth`（日期部分）| 必填，預設 focus 帶入 `1990-07-01` |
| 出生時間 | time | `Date_Of_Birth`（時間部分）| 必填，預設 focus 帶入 `12:00`，step=300 |

### 5.3 引導問題 Textarea
- 選完第三層後**自動填入模板**（可手動編輯）
- 模板邏輯（同 SB `updateSummaryTemplate()`）：
  ```
  "我目前最想處理的問題是「{topicTitle} - {subTitle}」，
  狀況比較接近「{thirdTitle}」：{thirdDesc}
  實際情況是：（請簡單在後面補充）"
  ```
- 字數限制：200 字，右下角顯示計數器

### 5.4 用戶識別與預填（重要）
- 頁面載入完成後，用 LINE User ID 查詢 Creator `Clients_Report`（`Line_User_ID` 欄位）
- **若有舊記錄**：自動預填姓、名、手機、Email、生日、出生時間（回訪用戶不需重填）
- **若無記錄**：空白表單，首次填寫

### 5.5 送出按鈕
- 文字：「🔮 送出占卜」
- 點擊後前端驗證，通過則切換至狀態 C-Loading

---

## 六、狀態 C-Loading（等待畫面）

隱藏整個選題表單，顯示：

```html
<div class="winds-loading">
  <div class="winds-dots">
    <span></span><span></span><span></span>
  </div>
  <p class="winds-loading-title">正在為您解讀命盤中…</p>
  <p class="winds-loading-sub">通常需要 30–60 秒，請稍候</p>
</div>
```

CSS 三點動畫（純 CSS，無外部依賴）：
```css
.winds-dots span {
  display: inline-block;
  width: 10px; height: 10px;
  margin: 0 4px;
  background: #c9a84c;
  border-radius: 50%;
  animation: windsBounce 1.2s infinite ease-in-out;
}
.winds-dots span:nth-child(2) { animation-delay: 0.2s; }
.winds-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes windsBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1; }
}
```

---

## 七、狀態 C-Result（結果顯示）

```
[標籤] ✨ 免費摘要（金色裝飾線）
[摘要文字]  ← \n 轉 <br>，字體 14px，行距 1.8
[解鎖 CTA 按鈕]
```

### 7.1 解鎖按鈕
- 文字：**「🏮 解鎖完整版解讀及改運符令 NT$360」**
- 樣式：金色背景 `#c9a84c`，深色文字 `#3b262a`，圓角，寬 100%
- 點擊行為：
  1. 呼叫 Creator `API.createTalismanOrder`（見第八節）
  2. 取得回傳的 `paymentHtml`（ECPay POST form）
  3. 將 form 插入 DOM 並自動 `submit()`
  4. 頁面跳轉至 ECPay 付款頁

---

## 八、API 規格

### 8.1 liffDivinationMvp（現有，需更新）

**新增接收參數：**
```json
{
  "lastName": "王",
  "firstName": "大明",
  "phone": "+886912345678",
  "email": "example@gmail.com",
  "topicKey": "love",
  "subKey": "love-reunion",
  "thirdKey": "1.1.1",
  "topicTitle": "感情與婚姻困擾",
  "subTitle": "復合與舊愛",
  "thirdTitle": "我們分手了，我想知道復合機會有多大？"
}
```

**新增動作（在原有 Divination_Logs 寫入之前）：**

1. **查詢或建立 Clients_Report**：
   - 用 `lineUserId` 查 `Clients_Report[Line_User_ID == lineUserId]`
   - 有記錄 → 取 `clientId`（不更新）
   - 無記錄 → 新建：`Visitor_Name`、`Phone_Number`、`Email`、`Date_Of_Birth`、`Line_User_ID`、`Client_Type = "真實"`

2. **寫入 Zoho CRM Leads**（用 Zoho CRM API 或 Connection）：
   - `Last_Name` = lastName
   - `First_Name` = firstName
   - `Mobile` = phone（E.164）
   - `Email` = email
   - `Lead_Source` = `"LINE占卜LIFF"`
   - 若 Email 已存在則跳過（不重複建立）

3. **Divination_Logs 新增欄位**（若表單有則填，無則跳過）：
   - `Topic_Key` = topicKey
   - `Sub_Key` = subKey
   - `Third_Key` = thirdKey

**新增回傳欄位：**
```json
{
  "divination_log_id": "4707400000000XXXXXX"
}
```

### 8.2 API.createTalismanOrder（現有，直接呼叫）

位置：`zoho-creator/functions/api/API.createTalismanOrder.deluge`  
呼叫方式：Creator Custom API（public key 待確認是否已部署為 Custom API）

呼叫參數：
```json
{
  "firstName": "大明",
  "lastName": "王",
  "email": "example@gmail.com",
  "phoneNumber": "+886912345678",
  "divinationId": "4707400000000XXXXXX",
  "talismanName": "改運符令",
  "element": "",
  "price": "360",
  "lineUserId": "Uxxxxxxxxxxxx"
}
```

回傳：
```json
{
  "success": true,
  "data": {
    "payment_url": "...",
    "paymentHtml": "<form method='POST' action='https://payment.ecpay.com.tw/...'>"
  }
}
```

LIFF 端取得 `paymentHtml` 後：
```javascript
document.body.insertAdjacentHTML('beforeend', paymentHtml);
document.querySelector('form[action*="ecpay"]').submit();
```

---

## 九、delivery.html（新建）

### 9.1 用途
用戶付款後收到 LINE 推播，點連結進入，查看完整版解讀（800–1200 字）。

### 9.2 URL 格式
```
https://youthsolar.github.io/ai-divination/liff/delivery.html?deliveryToken=TOKEN
```

### 9.3 流程
1. LIFF init（LIFF ID 同 index.html：`2009168674-G2KqF3Jv`）
2. 取 URL param `deliveryToken`
3. 取得 LINE User ID
4. 呼叫 Creator `API.getTalismanByToken`（已存在，見 `functions/api/API.getTalismanByToken.deluge`）
5. 驗證 LINE UID 與 token 對應（防盜看）
6. 顯示結果

### 9.4 視覺
```
[標題] 🏮 完整版解讀
[金色分隔線]
[解讀內文]  ← 字體 15px，行距 1.9，\n 轉 <br>
[底部 CTA] 「分享到 LINE 好友」（liff.sendMessages）
[Footer] 找風問幸福
```

### 9.5 錯誤狀態
- token 不存在或 LINE UID 不符：顯示「連結已失效或無使用權限」
- 尚未付款完成：顯示「解讀生成中，請稍後再試」

---

## 十、部署方式

LIFF 部署在 GitHub Pages（`gh-pages` branch）：
```bash
# 修改 main branch 的 liff/ 目錄
git checkout main
# ... 修改 index.html, 新增 delivery.html ...
git add liff/
git commit -m "feat: LIFF V2 - 三層選題 + 個人資料表單 + delivery 頁面"
git push origin main

# 同步到 gh-pages
git checkout gh-pages
git checkout main -- liff/
git commit -m "deploy: LIFF V2"
git push origin gh-pages
```

LIFF URL：`https://youthsolar.github.io/ai-divination/liff/index.html`  
LIFF ID：`2009168674-G2KqF3Jv`

---

## 十一、不在本次範圍內

- ECPay 切換正式版（目前測試環境，上市前另行切換）
- Phase 2B 籤詩輔助模式
- Rowy / SalesIQ 整合
- delivery.html 的「再次占卜」流程

---

## 十二、驗收標準

- [ ] 三層選題卡片完整運作（48 張，感情/事業/健康各 16 張）
- [ ] 退選行為正確（點已選卡片往上回收）
- [ ] 表單預填（回訪用戶自動帶入資料）
- [ ] Email 只允許 @gmail.com
- [ ] 手機轉 E.164 格式
- [ ] 引導問題自動填入模板
- [ ] 送出後顯示三點等待動畫
- [ ] 免費摘要正確顯示
- [ ] 解鎖按鈕文字：「🏮 解鎖完整版解讀及改運符令 NT$360」
- [ ] 點解鎖 → createTalismanOrder → paymentHtml submit → 跳轉 ECPay
- [ ] delivery.html 正確顯示完整解讀
- [ ] delivery.html LINE UID 驗證有效
- [ ] 全文無「AI」、「智能體」等字樣
- [ ] 副標：「易經 × 塔羅 × 靈性占卜」
- [ ] RWD 手機版正常顯示
