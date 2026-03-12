# LIFF 籤詩獨立功能 — 規劃文件

Owner: Zoe (規劃) / Pinni (產品) / Jeffery (決策)
Last updated: 2026-03-12

> **目標**：在 LIFF 前端新增「獨立求籤」專區，讓使用者不經過完整占卜流程即可求籤，
> 作為輕量級入口吸引回訪，同時為符令商品提供新的轉換路徑。

### 前置依賴

本文件依賴 `DIVINATION_AUXILIARY_MODE_PLAN.md` 中的籤詩資料模型（§2）與 API 設計（§4），
籤詩表單（KongMing_Oracle / GuanYin_Oracle / GuanDi_Oracle）必須先完成建表與匯入。

---

## 一、產品定位與使用者旅程

### 1.1 定位

| 維度 | 說明 |
|------|------|
| **目標使用者** | 已加 LINE 好友但尚未使用完整占卜的輕度使用者；或已占卜過想「再來一支籤」的回訪使用者 |
| **核心價值** | 零門檻（不需生日、不需長文問題）、即時結果、文化儀式感 |
| **商業目的** | ① 降低首次互動門檻 → 引流至完整占卜 ② 孔明籤 → 符令商品轉換 ③ 增加 LINE OA 活躍度 |
| **與完整占卜的差異** | 不做命理計算、不走冷卻機制、不消耗 LLM token（直接回傳籤詩原文+固定解籤） |

### 1.2 使用者旅程

```
LINE OA 選單 / 訊息指令（例如「求籤」「觀音靈籤」）
  ↓
LIFF 籤詩專區頁面（新頁面 or 現有 LIFF 新 Tab）
  ↓
選擇籤詩系統（觀音 / 關帝 / 孔明）
  ↓
[互動] 點擊「搖籤」按鈕（MVP：按鈕觸發；未來：搖晃動畫）
  ↓
顯示結果（籤文 + 固定解籤 + 吉凶等級）
  ↓
CTA 分流：
  ├── 「想更深入了解？」 → 引導至完整占卜（需填生日+問題）
  ├── 「請購符令」 → 孔明籤專屬 CTA（連結至付款）
  └── 「再來一支」 → 重新求籤（同系統或換系統）
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
│    不需要生日，不需要問題      │
│       心誠則靈，點即求         │
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
| `lineUserId` | ✅ | LINE 使用者 ID（追蹤用，不需已綁定生日） |
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

### 3.2 籤號計算邏輯（獨立版）

獨立求籤**不使用易經爻碼**（使用者未提供生日），改用以下確定性算法：

```
seed = hash(lineUserId + system + today_date_string)
// today_date_string = "2026-03-12"（每天換一次）

if system == "KongMing":
    sign_num = (seed % 384) + 1
else:  // GuanYin or GuanDi
    sign_num = (seed % 100) + 1
```

| 設計決策 | 說明 |
|----------|------|
| **每日一籤** | 同一人同一天同一系統得到同一支籤（避免無限重抽找好籤） |
| **跨系統不同** | 同一人同一天換系統會得到不同籤（鼓勵嘗試多系統） |
| **隔天換籤** | 隔天再來會得到不同籤（鼓勵回訪） |

> 注意：此邏輯與 MVP-2 輔助模式（§3.1 步驟 2）的算法不同，因為輔助模式有爻碼和生日可用。

### 3.3 不走冷卻機制

獨立求籤**不消耗 LLM token**，也**不走冷卻機制**：
- 結果直接從籤詩表讀取固定文字，不經過 AI 解讀
- 不寫入 `Divination_Logs`（不佔占卜配額）
- 寫入獨立的 `Oracle_Draw_Logs`（見 §3.4）

### 3.4 新增表單：`Oracle_Draw_Logs`

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `ID` | Auto Number | PK |
| `Line_User_ID` | Single Line | 使用者 ID |
| `System` | Picklist | KongMing / GuanYin / GuanDi |
| `Sign_Order_Num` | Number | 籤號 |
| `Draw_Date` | Date | 抽籤日期（用於每日一籤邏輯） |
| `Created_At` | Date-Time | 建立時間 |

> 用於分析：哪個系統最受歡迎、使用者回訪頻率、是否轉換至完整占卜。

### 3.5 新增 Creator 函數

| 函數 | 簽名 | 用途 |
|------|------|------|
| `Oracle.drawIndependent` | `map Oracle.drawIndependent(string lineUserId, string system)` | 獨立求籤主函數 |
| `Oracle.calculateDailySign` | `int Oracle.calculateDailySign(string lineUserId, string system, string dateStr)` | 每日籤號計算 |
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
- [ ] MVP-2 輔助模式已上線（非必須，但共用資料表）

### 5.2 實作階段

| 階段 | 任務 | 負責 | 估計工作量 | 前置依賴 |
|------|------|------|-----------|---------|
| **L0** | Creator: `Oracle_Draw_Logs` 建表 | Creator UI | 0.5 天 | 無 |
| **L1** | Creator: `Oracle.calculateDailySign` + `Oracle.drawIndependent` | Creator Deluge | 1 天 | 籤詩表已匯入 |
| **L2** | Creator: `LIFF_Oracle_Draw_API` Custom API + Handler | Creator UI | 0.5 天 | L1 |
| **L3** | LIFF: `oracle.html` 前端（選擇系統 + 搖籤動畫 + 結果展示） | 前端 | 2 天 | L2 |
| **L4** | LIFF: CTA 分流（完整占卜引導 + 孔明符令 CTA） | 前端 | 0.5 天 | L3 |
| **L5** | n8n: LINE 關鍵字路由（求籤/觀音/關帝/孔明） | n8n | 0.5 天 | L3 |
| **L6** | LINE: Rich Menu 新增「求籤」按鈕 | LINE OA 設定 | 0.5 天 | L3 |
| **L7** | GitHub Pages 部署 `oracle.html` | 部署 | 0.5 天 | L3 |
| **L8** | 端到端測試 | 手動 | 1 天 | L5 + L6 + L7 |

**總估計：7 工作天**

### 5.3 部署清單

#### Creator — 新增

| # | 項目 | 類型 |
|---|------|------|
| 1 | `Oracle_Draw_Logs` 表單 | Form |
| 2 | `Oracle.calculateDailySign.deluge` | Standalone Function |
| 3 | `Oracle.drawIndependent.deluge` | Standalone Function |
| 4 | `Oracle.formatOracleResponse.deluge` | Standalone Function |
| 5 | `LIFF_Oracle_Draw_API` + Handler | Custom API |

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
| **每日一籤限制導致使用者流失** | 中 | 鼓勵跨系統嘗試（3 系統 = 每天 3 次機會）；CTA 引導至完整占卜 |
| **LIFF 新頁面 CORS 問題** | 低 | 與現有 `index.html` 同 domain（GitHub Pages），CORS 設定已驗證 |
| **hash 碰撞導致籤號分佈不均** | 低 | 使用 SHA-256 hash 前 8 碼轉數字，分佈足夠均勻 |
| **使用者未登入 LINE 就開啟 LIFF** | 中 | LIFF SDK `liff.isLoggedIn()` 檢查 → 自動 `liff.login()` |
| **獨立求籤不記錄到 Divination_Logs，無法追蹤轉換** | 中 | `Oracle_Draw_Logs` 記錄求籤行為；CTA 連結帶 UTM 參數追蹤轉換 |

---

## 七、待確認決策

| # | 決策 | 選項 | 建議 |
|---|------|------|------|
| L-D1 | LIFF 是新增頁面還是在現有頁面加 Tab？ | A. 新頁面 `oracle.html`（獨立 URL）<br>B. 現有 `index.html` 加 Tab 切換 | **A**：URL 可獨立分享、Rich Menu 可直連 |
| L-D2 | 每日一籤的重置時間？ | A. 午夜 00:00 <br>B. 子時 23:00（與占卜系統一致） | **B**：與現有子時換日政策一致 |
| L-D3 | 求籤是否需要已綁定生日？ | A. 不需要（零門檻）<br>B. 需要（可精準推薦符令） | **A**：降低門檻為首要目標 |
| L-D4 | 求籤結果是否也推送 LINE 訊息？ | A. 不推送（只在 LIFF 內顯示）<br>B. 自動推送<br>C. 使用者可選「分享到 LINE」 | **C**：使用者主動分享，不打擾 |

---

## 附錄：與 MVP-2 輔助模式的關係

| 維度 | MVP-2 籤詩輔助模式 | LIFF 獨立求籤 |
|------|-------------------|-------------|
| 入口 | LINE 訊息 → 完整占卜 → 自動附加 | LIFF 頁面 → 直接求籤 |
| 輸入 | 生日 + 問題 + 爻碼 | LINE userId only |
| 籤號算法 | 爻碼 mod / 生日+時間 mod | userId + system + date hash |
| LLM 消耗 | 有（注入 prompt） | 無（直接回傳固定文字） |
| 冷卻機制 | 受限 | 不受限（每日一籤自帶限制） |
| 記錄 | Divination_Logs | Oracle_Draw_Logs |
| 符令推薦 | 孔明籤觸發現有 Talisman 流程 | 孔明籤附加 CTA 連結 |
| 共用 | 籤詩資料表（KongMing/GuanYin/GuanDi_Oracle） | 同左 |
