# Deluge / Zoho Creator 程式撰寫規範（SSOT）

> 目的：確保 Jeffery 在 Zoho Creator Application IDE 內能快速理解、修改、驗收。

## 1) 強制規則（Hard rules）
1. **所有新增/修改的程式碼，必須有繁體中文註記**
   - 至少包含：用途、輸入/輸出、注意事項（時區/冷卻/不改規則/驗簽）
2. **不可改占卜規則本質**
   - 易經起卦/卦象/符令、塔羅抽牌/解牌邏輯不可改
   - 允許：封裝、註解、debug、效能、錯誤處理、載入策略（結果必須一致）
3. **冷卻觸發：安撫但不占卜，且必須直接 return，不呼叫 OpenAI**

## 2) 註記模板（建議每個 function 貼最上面）
```deluge
// =============================================================================
// 功能：<一句話說清楚用途>
// 入口/被誰呼叫：<n8n/Creator API/表單 workflow>
// 輸入：<參數 or payload schema>
// 輸出：<回傳格式>
// 注意：<不改規則/時區口徑/冷卻/驗簽/SSOT>
// =============================================================================
```

## 3) 時區口徑
- 一律以 `Asia/Taipei` 為準
- n8n payload 需帶：`timezone` + `referenceLocalTime`（台北時間字串）

## 4) Creator 6 匯入/解析地雷（已知）
- function 宣告建議貼齊行首（避免 DS 匯入 parser 誤判）
- 避免超長單行（pages content / picklist values）
- 註解不要卡在奇怪的位置（Creator 6 parser 很嚴格）

## 5) SSOT 作業方式
- repo 內程式碼為準：`repos/ai-divination/`
- 每次修改必須：
  - `git commit`
  - 同步更新必要文件（`docs/LAUNCH_ENV.md`, runbook 等）
