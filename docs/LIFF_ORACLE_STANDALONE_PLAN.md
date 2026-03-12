# LIFF 籤詩獨立功能 — 規劃文件

Owner: Zoe (規劃) / Pinni (產品) / Jeffery (決策)
Last updated: 2026-03-12

> **目標**：在 LIFF 前端新增「獨立求籤」專區，讓已綁定生日的使用者不需輸入問題即可求籤，
> 作為輕量級互動入口吸引回訪，同時為符令商品提供新的轉換路徑。
> 求籤共用現有冷卻機制，並記錄到 Divination_Logs。

### 已確認決策

| # | 決策 | 結論 | 確認者 | 確認日期 |
|---|------|------|--------|---------|
| L-D1 | 頁面架構 | **新頁面 `oracle.html`**，獨立 URL 可直連 | Jeffery | 2026-03-12 |
| L-D2 | 冷卻/重置規則 | **共用現有冷卻機制**（參考易經卦規則） | Jeffery | 2026-03-12 |
| L-D3 | 生日門檻 | **需要已綁定生日**，可用於籤號計算與符令推薦 | Jeffery | 2026-03-12 |
| L-D4 | 結果推送 | **使用者可選「分享到 LINE」**，不自動推送 | Jeffery | 2026-03-12 |

### 前置依賴

本文件依賴 `DIVINATION_AUXILIARY_MODE_PLAN.md` 中的籤詩資料模型（§2）與 API 設計（§4），
籤詩表單（KongMing_Oracle / GuanYin_Oracle / GuanDi_Oracle）必須先完成建表與匯入。

---

## 一、產品定位與使用者旅程

### 1.1 定位

| 維度 | 說明 |
|------|------|
| **目標使用者** | 已綁定生日的 LINE 好友；想「再來一支籤」的回訪使用者 |
| **核心價值** | 不需輸入問題（只需選系統+按搖籤）、即時結果、文化儀式感 |
| **商業目的** | ① 輕量互動增加回訪 → 引流至完整占卜 ② 孔明籤 → 符令商品轉換 ③ 增加 LINE OA 活躍度 |
| **與完整占卜的差異** | 不需輸入問題、不消耗 LLM token（直接回傳固定解籤），但**共用冷卻機制**且**需已綁定生日** |

### 1.2 使用者旅程

```
LINE OA 選單 / 訊息指令（例如「求籤」「觀音靈籤」）
  ↓
LIFF 籤詩專區頁面（oracle.html）
  ↓
[檢查] 已綁定生日？
  ├── 否 → 顯示提示，引導至 LIFF Binding 頁面綁定生日
  └── 是 ↓
  ↓
選擇籤詩系統（觀音 / 關帝 / 孔明）
  ↓
[檢查] 冷卻機制（共用現有規則）
  ├── 觸發冷卻 → 顯示安撫訊息 + 剩餘等待時間
  └── 通過 ↓
  ↓
[互動] 點擊「搖籤」按鈕（MVP：按鈕觸發；未來：搖晃動畫）
  ↓
顯示結果（籤文 + 固定解籤 + 吉凶等級）
  ↓
CTA 分流：
  ├── 「想更深入了解？」 → 引導至完整占卜（需填問題）
  ├── 「請購符令」 → 孔明籤專屬 CTA（連結至付款）
  ├── 「分享到 LINE」 → liff.sendMessages()（L-D4）
  └── 「再來一支」 → 換系統求籤（同系統受冷卻限制）
```

### 1.3 入口設計

| 入口 | 實作方式 | 優先序 |
|------|---------|--------|
| LINE Rich Menu | 新增「求籤」按鈕 → 開啟 LIFF URL | MVP |
| LINE 訊息指令 | n8n 偵測「求籤」「抽籤」等關鍵字 → 回覆 LIFF 連結 | MVP |
| 完整占卜結果末尾 | 在占卜結果後附加「想抽支籤看看？」按鈕 | 後續 |

---

## 二、LIFF 前端設計

### 2.1 頁面架構

延伸現有 `liff/index.html` 的設計風格（winds-* CSS 體系），新增 `liff/oracle.html`。

```
liff/
├── index.html          # 現有：完整占卜（生日+問題）
└── oracle.html         # 新增：獨立求籤
```

> 共用 LIFF App ID，以 URL path 區分功能。

### 2.2 頁面狀態流程

```
[選擇系統] → [搖籤中] → [顯示結果] → [CTA 分流]
     ↑                                      │
     └──────── [再來一支] ←─────────────────┘
```

### 2.3 UI 規格

#### 狀態 1：選擇系統

```
┌──────────────────────────────┐
│       🏮 求籤問卦 🏮          │
│    不需要問題，只需一念誠心    │
│       選擇神明，搖籤即得       │
│                              │
│  ┌────────────────────────┐  │
│  │  🔮 觀音靈籤            │  │
│  │  百首靈籤・慈悲指引      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  ⚔️ 關帝靈籤             │  │
│  │  百首靈籤・忠義正道      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  📜 孔明大易神術         │  │
│  │  三百八十四籤・卦理五行  │  │
│  └────────────────────────┘  │
│                              │
│  找風問幸福 © 宇風企管顧問    │
└──────────────────────────────┘
```

#### 狀態 2：搖籤中（MVP 簡易版）

```
┌──────────────────────────────┐
│                              │
│         🏮                    │
│      搖籤中…                  │
│    ━━━━━━━━━━━               │
│    （進度條動畫 1.5s）        │
│                              │
└──────────────────────────────┘
```

> MVP 用 CSS 進度條動畫（1.5 秒）模擬搖籤，API 呼叫在此期間完成。
> 未來可升級為搖晃手機觸發（DeviceMotionEvent）。

#### 狀態 3：顯示結果

```
┌──────────────────────────────┐
│                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  🏮 觀音靈籤・第 4 籤         │
│     【上籤子宮】              │
│     玉蓮會十朋                │
│                              │
│  「千年古鏡復重圓，            │
│  　女再求夫男再婚；            │
│  　自此門庭重改換，            │
│  　更添福祿在兒孫。」          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                              │
│  【聖意】                     │
│  此卦古鏡重圓之象…            │
│                              │
│  【籤解】                     │
│  淘沙見金 騎龍踏虎…           │
│                              │
│  【仙機】                     │
│  自身秋冬旺 求財秋冬旺…       │
│                              │
│  【典故】                     │
│  荊錄記。宋朝。王十朋少時…     │
│                              │
│  ┌────────────────────────┐  │
│  │  🔮 想更深入？免費占卜   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  🔄 再來一支             │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

> 孔明籤額外顯示：五行符令序列 + 「📿 請購對應符令」CTA 按鈕。

### 2.4 CSS 擴充

沿用現有 `winds-*` 設計系統，新增元件：

| 元件 | Class | 說明 |
|------|-------|------|
| 系統選擇卡片 | `.winds-oracle-card` | 可點擊卡片，含圖示+標題+副標 |
| 搖籤動畫 | `.winds-shaking` | CSS keyframe 搖晃 + 進度條 |
| 籤詩結果區 | `.winds-oracle-result` | 帶裝飾邊框的結果展示 |
| 分項標籤 | `.winds-oracle-section` | 聖意/籤解/仙機等分區 |
| 吉凶標籤 | `.winds-fortune-badge` | 彩色標籤（上籤=金、中籤=藍、下籤=灰） |

---

## 三、Creator API 設計

### 3.1 新增端點：`API.drawOracle`

| 項目 | 規格 |
|------|------|
| **Custom API 名稱** | `LIFF_Oracle_Draw_API` |
| **認證** | Public Key |
| **HTTP Method** | POST |
| **Content-Type** | application/json |

#### 請求格式

```json
{
  "lineUserId": "U1234567890abcdef",
  "system": "GuanYin"
}
```

| 參數 | 必填 | 說明 |
|------|------|------|
| `lineUserId` | ✅ | LINE 使用者 ID（必須已綁定生日，L-D3） |
| `system` | ✅ | 籤詩系統：`KongMing` / `GuanYin` / `GuanDi` |

#### 回應格式

```json
{
  "success": true,
  "oracle": {
    "system": "GuanYin",
    "sign_order": "第 4 籤",
    "sign_order_num": 4,
    "fortune_level": "【上籤子宮】",
    "poem_title": "玉蓮會十朋",
    "poem_text": "千年古鏡復重圓，女再求夫男再婚；自此門庭重改換，更添福祿在兒孫。",
    "holy_meaning": "此卦古鏡重圓之象，凡事勞心有貴也。",
    "sign_interpretation": "淘沙見金 騎龍踏虎 雖是勞心 於中有補",
    "divine_guidance": "自身秋冬旺 求財秋冬旺...",
    "allusion": "荊錄記。宋朝。王十朋少時...",
    "talisman_cta": null
  },
  "cta": {
    "full_divination_url": "https://liff.line.me/{LIFF_ID}",
    "talisman_url": null
  }
}
```

> 孔明籤額外回傳 `oracle.symbols` 陣列和 `cta.talisman_url`。

### 3.2 籤號計算邏輯

使用者已綁定生日（L-D3），因此可用生日參與籤號計算，與 MVP-2 輔助模式共用相似邏輯：

```
// 從 Clients_Report 取得使用者生日
birthday = client.Date_Of_Birth  // e.g. 1990-05-15

// 子時換日（L-D2）：23:00 起算隔天
today_date = adjustForZiHour(zoho.currenttime)  // 參考現有 Calendar.normalizeToTaipei

// 確定性計算
birthdayDigitSum = sumOfDigits(birthday)  // 1+9+9+0+0+5+1+5 = 30
dateDigitSum = sumOfDigits(today_date)    // 2+0+2+6+0+3+1+2 = 16
systemSeed = hash(system)                 // 不同系統不同種子

seed = birthdayDigitSum + dateDigitSum + systemSeed

if system == "KongMing":
    sign_num = (seed % 384) + 1
else:  // GuanYin or GuanDi
    sign_num = (seed % 100) + 1
```

| 設計決策 | 說明 |
|----------|------|
| **每日換籤** | 同一人每天得到不同籤（因 dateDigitSum 每日不同），鼓勵回訪 |
| **跨系統不同** | systemSeed 確保同一人同一天不同系統得到不同籤 |
| **生日參與** | 不同人同一天同系統也會得到不同籤（因 birthdayDigitSum 不同） |
| **子時換日** | 23:00 起算隔天，與現有占卜系統一致（L-D2） |

### 3.3 共用冷卻機制（L-D2 決策）

求籤**共用現有冷卻機制** `AIInterpreter.checkCooldownStatus`：

| 現有規則 | 在求籤場景的適用方式 |
|----------|-------------------|
| **規則 1：相同問題 3 天** | 求籤視為固定問題「求籤:{system}」，同系統 3 天內只能求一次 |
| **規則 2：同類型 6 小時** | 求籤統一歸類為「其他」類型，6 小時內跨系統也只能求一次 |
| **規則 3：不同類型 24 小時最多 2 種** | 求籤佔用 1 個「其他」配額，與完整占卜共享 24 小時額度 |

#### 實作方式

```
Oracle.drawIndependent 流程：
1. 查詢 Clients_Report（by lineUserId）→ 確認已綁定生日
2. 呼叫 AIInterpreter.checkCooldownStatus(clientId, "求籤:" + system, now)
   → 若 allowed == false → 回傳冷卻訊息（含 time_remaining）
   → 若 allowed == true → 繼續
3. 計算籤號 → 查詢籤詩表 → 組裝結果
4. 寫入 Divination_Logs（Divination_Method = "籤詩"，Oracle_System = system）
5. 回傳結果
```

> **關鍵變更**：求籤結果寫入 `Divination_Logs`（而非獨立的 Oracle_Draw_Logs），
> 確保冷卻機制可正確追蹤，且所有占卜/求籤行為集中在同一張表，利於分析。

#### Divination_Logs 求籤記錄欄位

| 欄位 | 值 |
|------|-----|
| `Client_Link` | clientId |
| `Original_Question` | `"求籤:{system}"` |
| `Divination_Method` | `"籤詩"` （新增 picklist 選項） |
| `Oracle_System` | `KongMing` / `GuanYin` / `GuanDi` |
| `Oracle_Sign_Order` | 籤號 |
| `Oracle_Poem_Text` | 籤文快照 |
| `Oracle_Fortune_Level` | 吉凶等級快照 |
| `AI_Interpretation` | 空（求籤不消耗 LLM） |
| `Question_Type_AI` | `"其他"` |
| `Status` | `"已提問"` |

### 3.4 新增 Creator 函數

| 函數 | 簽名 | 用途 |
|------|------|------|
| `Oracle.drawIndependent` | `map Oracle.drawIndependent(string lineUserId, string system)` | 獨立求籤主函數（含冷卻檢查） |
| `Oracle.calculateSignByBirthday` | `int Oracle.calculateSignByBirthday(date birthday, string system, date divinationTime)` | 生日+日期+系統 → 籤號 |
| `Oracle.formatOracleResponse` | `map Oracle.formatOracleResponse(string system, map oracleRecord)` | 格式化回應 |

---

## 四、n8n 訊息指令整合

### 4.1 LINE 關鍵字觸發

在現有 `LINE_Webhook__Router.json` 中新增路由規則：

| 關鍵字 | 動作 |
|--------|------|
| `求籤` `抽籤` `靈籤` | 回覆 LIFF Oracle URL |
| `觀音` `觀音靈籤` | 回覆 LIFF Oracle URL + 預選觀音 |
| `關帝` `關帝靈籤` | 回覆 LIFF Oracle URL + 預選關帝 |
| `孔明` `孔明神術` | 回覆 LIFF Oracle URL + 預選孔明 |

回覆格式（Flex Message 或文字+按鈕）：

```
🏮 求籤問卦
心誠則靈，點擊下方開始：

👉 [開始求籤] → https://liff.line.me/{LIFF_ID}/oracle?system={system}
```

### 4.2 結果分享回 LINE

求籤完成後，LIFF 可選擇「分享到 LINE」：
- 使用 `liff.sendMessages()` 將籤文結果發送到使用者自己的聊天室
- 格式與 MVP-2 輔助模式的明示籤文區塊一致

---

## 五、實作優先序

### 5.1 前置條件

- [x] 籤詩 Excel 已上傳 repo
- [ ] Creator 籤詩表已建立並匯入資料（DIVINATION_AUXILIARY_MODE_PLAN §S0–S2）
- [ ] Divination_Logs 已擴充 Oracle 欄位（DIVINATION_AUXILIARY_MODE_PLAN §S7）
- [ ] `Divination_Method` picklist 已新增 `"籤詩"` 選項

### 5.2 實作階段

| 階段 | 任務 | 負責 | 估計工作量 | 前置依賴 |
|------|------|------|-----------|---------|
| **L1** | Creator: `Oracle.calculateSignByBirthday` + `Oracle.drawIndependent`（含冷卻整合） | Creator Deluge | 1.5 天 | 籤詩表+Divination_Logs 已就緒 |
| **L2** | Creator: `LIFF_Oracle_Draw_API` Custom API + Handler | Creator UI | 0.5 天 | L1 |
| **L3** | LIFF: `oracle.html` 前端（生日檢查 + 選擇系統 + 搖籤動畫 + 結果展示 + 冷卻提示） | 前端 | 2.5 天 | L2 |
| **L4** | LIFF: CTA 分流（完整占卜引導 + 孔明符令 CTA + 分享到 LINE） | 前端 | 0.5 天 | L3 |
| **L5** | n8n: LINE 關鍵字路由（求籤/觀音/關帝/孔明） | n8n | 0.5 天 | L3 |
| **L6** | LINE: Rich Menu 新增「求籤」按鈕 | LINE OA 設定 | 0.5 天 | L3 |
| **L7** | GitHub Pages 部署 `oracle.html` | 部署 | 0.5 天 | L3 |
| **L8** | 端到端測試（含冷卻規則驗證） | 手動 | 1 天 | L5 + L6 + L7 |

**總估計：7.5 工作天**

### 5.3 部署清單

#### Creator — 新增

| # | 項目 | 類型 |
|---|------|------|
| 1 | `Oracle.calculateSignByBirthday.deluge` | Standalone Function |
| 2 | `Oracle.drawIndependent.deluge` | Standalone Function |
| 3 | `Oracle.formatOracleResponse.deluge` | Standalone Function |
| 4 | `LIFF_Oracle_Draw_API` + Handler | Custom API |

#### Creator — 修改

| # | 項目 | 修改 |
|---|------|------|
| 5 | `Divination_Logs` → `Divination_Method` picklist | 新增 `"籤詩"` 選項 |

#### LIFF — 新增

| # | 項目 | 說明 |
|---|------|------|
| 6 | `liff/oracle.html` | 獨立求籤前端頁面 |

#### n8n — 修改

| # | 項目 | 修改範圍 |
|---|------|---------|
| 7 | `LINE_Webhook__Router.json` | 新增求籤關鍵字路由分支 |

#### LINE OA — 設定

| # | 項目 | 說明 |
|---|------|------|
| 8 | Rich Menu | 新增「求籤」按鈕 → LIFF URL |

---

## 六、技術風險與緩解

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| **冷卻機制限制求籤頻率，使用者覺得太嚴格** | 中 | 冷卻觸發時顯示安撫訊息+等待時間；CTA 引導至完整占卜（問不同問題可繞過） |
| **需綁定生日提高進入門檻** | 中 | 未綁定時顯示友善提示+一鍵跳轉 LIFF Binding 頁面；綁定後自動返回求籤 |
| **LIFF 新頁面 CORS 問題** | 低 | 與現有 `index.html` 同 domain（GitHub Pages），CORS 設定已驗證 |
| **求籤與完整占卜共用冷卻配額，互相干擾** | 中 | 求籤歸「其他」類型，大部分完整占卜問題歸其他類型（愛情/工作等），互不佔用同類型配額 |
| **使用者未登入 LINE 就開啟 LIFF** | 低 | LIFF SDK `liff.isLoggedIn()` 檢查 → 自動 `liff.login()` |
| **子時換日（23:00）可能讓使用者困惑** | 低 | 前端不顯示技術細節，只在冷卻提示中顯示「預計 XX 時可再次求籤」 |

---

## 附錄：與 MVP-2 輔助模式的關係

| 維度 | MVP-2 籤詩輔助模式 | LIFF 獨立求籤 |
|------|-------------------|-------------|
| 入口 | LINE 訊息 → 完整占卜 → 自動附加 | LIFF 頁面 → 選系統 → 搖籤 |
| 輸入 | 生日 + 問題 + 爻碼 | 生日（已綁定）+ 系統選擇 |
| 籤號算法 | 爻碼 mod / 生日+時間 mod | 生日+日期+系統 → digitSum mod |
| LLM 消耗 | 有（注入 prompt） | **無**（直接回傳固定文字） |
| 冷卻機制 | **共用** checkCooldownStatus | **共用**（求籤歸「其他」類型） |
| 記錄 | Divination_Logs（Method=易經/塔羅） | Divination_Logs（Method=**籤詩**） |
| 符令推薦 | 孔明籤觸發現有 Talisman 流程 | 孔明籤附加 CTA 連結 |
| 共用 | 籤詩資料表 + Divination_Logs + 冷卻機制 | 同左 |
