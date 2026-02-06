# TODO (from one-shot reminders)

> Source: migrated from disabled/one-shot OpenClaw cron reminders so we keep the intent without recurring noise.

## 1) OpenClaw Browser Relay / Chrome 接管（待修）
- **Goal**: 讓 Pinni 能接管你的 Chrome tab 來操作 Zoho / n8n / Simplybook / Easystore。
- **Symptom (historical)**: external 網站 attach 仍紅驚嘆號；gateway log 出現 invalid handshake/timeout。
- **Next actions**
  - [ ] 重新測一次 Browser Relay：在目標 Chrome 分頁點 OpenClaw Browser Relay 工具列按鈕，確認 badge ON。
  - [ ] 若仍失敗：抓一段 gateway log（含時間點）＋ Chrome console error，定位 handshake/timeout。
  - [ ] 決策：是否改走 Playwright/openclaw-managed browser profile 作為備援。

## 2) Cloudflared tunnel 正式化/收尾（named tunnel + 開機自動跑）
- **Goal**: 讓 Zoho 能穩定打回 `n8n.winds.tw`，且 cloudflared 開機自動啟動。
- **Current status (as of 2026-02-06)**
  - 已完成 cloudflared login、建立 named tunnel、config.yml/ingress、並設定 `n8n.winds.tw` 指向 tunnel。
  - winds.tw NS 轉移 Cloudflare propagation 進行中（由 hourly check cron 監控，達標會自動停用）。
- **Next actions**
  - [ ] 等 NS propagation 完成後，驗證：`https://n8n.winds.tw` 可達 + Zoho webhook 可打通。
  - [ ] 將 cloudflared 變成常駐服務（launchd / brew services），確保重開機後自動跑。
  - [ ] 視需要：把 n8n docker listener 從 `0.0.0.0:5678` 收斂到 `127.0.0.1:5678`，只允許透過 tunnel 進入（降低 LAN 風險）。

## 3) Codex「B 模式」整合決策（B1 vs B2）
- **Decision needed**
  - **B1**: n8n 直接打 OpenAI API（最穩、少本機依賴、部署簡單）
  - **B2**: 本機安裝 OpenAI CLI/pipx（可用 exec 控制，但本機維運/權限/金鑰管理更複雜）
- **Evaluation checklist**
  - [ ] 金鑰管理（n8n credentials vs 本機 env）
  - [ ] 部署維護成本（換機/備援/重啟）
  - [ ] 與 Zoho / LINE 工作流銜接（超時、重試、log）
  - [ ] 成本與延遲（token/requests）
- **Output**
  - [ ] 決定後寫一份短 ADR：`docs/adr/XXXX-codex-integration.md`
