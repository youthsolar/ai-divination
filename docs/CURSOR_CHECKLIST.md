# Cursor 校錯 / 部署一致性 Checklist（必讀）

> 目的：讓 Cursor（gpt5.2-codex）在校錯時「同時」檢查程式碼 + 部署/環境，避免上線漏東漏西。

## 0) 專案真源（SSOT）
- Repo：`/Users/youthsun/.openclaw/workspace/repos/ai-divination/`
- 任何修正都必須以 **git commit** 留痕。

## 1) 硬性約束（不可違反）
- **不可改占卜規則本質**：易經起卦/卦象/符令、塔羅抽牌/解牌邏輯不可改。
- 允許改動：語法/封裝/註解/debug/log、效能（但結果一致）、錯誤處理、可配置化、查詢範圍（需保持結果一致）。
- Deluge 規範：
  - function 宣告需可被 Creator 正確識別（匯入 DS 時避免宣告縮排/註解越界等）。

## 2) 校錯前必讀文件（顺序）
1) `docs/MDP_RUNBOOK.md`
2) `docs/LAUNCH_ENV.md`
3) `docs/TODO.md`

## 3) 必查項目（Code + Deploy）
### 3.1 Zoho Creator（Deluge/DS）
- 檔案：`zoho-creator/apps/AI易經.ds`
- 檢查：
  - 匯入 DS 的語法風險（宣告行首、註解位置、缺分號、不完整 statement）
  - `API.ECPayReturn(map ecpay_params)` 回拋驗簽/回應格式（1|OK）
  - Paid 後 token 生成、去重推播邏輯

### 3.2 n8n（整合層）
- Workflow：
  - `LINE Webhook — Router (MVP)`
  - `LINE Webhook — Zoho Creator → Reply (MVP)`
  - `ECPay Paid Notify — LINE Push (MVP)`
- 檢查：
  - 需要的 env vars 是否齊全（見 LAUNCH_ENV）
  - webhook path 與對外 URL 是否正確

### 3.3 Cloudflare Tunnel
- 目標：`https://n8n.winds.tw` 穩定可達。
- 檢查：tunnel 常駐（launchd）、healthcheck 能回 ok。

## 4) 輸出格式（Cursor 請遵守）
- 先列：**CRIT / WARN / NICE**
- 每項必附：檔案路徑、行號/搜尋關鍵字、原因、修正方案（最好含 patch）
- 若涉及部署參數：必須同步更新 `docs/LAUNCH_ENV.md`

## 5) 交付判定（Definition of Done）
- 修正後：
  - `git diff` 乾淨（已 commit）
  - 文件同步更新（runbook/env/todo）
  - 提供最小驗收步驟（可手動重現）
