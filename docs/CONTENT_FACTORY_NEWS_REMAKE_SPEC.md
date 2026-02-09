# 內容工廠 #2：winds.tw News 再製 — Spec（v0）

> 目的：把 winds.tw（SimplyBook）「最新消息」長文，轉成可投放的多平台短內容。
> 原則：n8n CE log 只留 1 天 → 所有素材/排程/發布結果必須回寫 Zoho Creator 作為 SSOT。

## A) Input（來源資料）
### A1) news 文章欄位（建議）
- `source`: 固定 `winds_news`
- `newsId`: 文章 id（例如 70）
- `url`: `https://winds.tw/#news/<id>`
- `title`: 標題
- `publishedAt`: 原始發布日期（可空）
- `contentHtml` / `contentText`: 內文（至少要有純文字）

### A2) 產生設定
- `timezone`: `Asia/Taipei`
- `tone`: `warm_clear`（由系統決定，不讓使用者選）
- `channels`: `['ig','threads','fb','linkedin']`
- `cta`: 預設導向 `LINE 免費占卜（生日+問題）`

## B) Output（產出）
每篇 news 產出一個 `Content_Ideas` + 多個 `Content_Assets`：

### B1) IG / Threads 貼文（短文）
- `hook`（第一句）
- `body`（3–7 段，易讀換行）
- `cta`（引導到 LINE）
- `hashtags`（5–12 個）

### B2) LinkedIn（偏專業）
- 100–220 字左右
- 以「洞察/方法/案例」語氣

### B3) FB（可稍長）
- 300–600 字
- 有段落、有 CTA

### B4) AI 深圖 prompt（選配）
- `imagePrompt`：可直接拿去 openai-image-gen 生成
- `imageStyle`：一致風格（避免每張風格散掉）

## C) Pipeline（建議實作）
1) n8n：抓取 winds news（或先用手動貼上）→ 呼叫 Creator `API.QueueNewsRemake_v1`
2) Creator：入庫（Content_Ideas/Assets），狀態 `draft/pending`
3) 人工審核/修改 → `approved`
4) 發佈（S1 手動排程 / S2 提醒）→ n8n 回寫 `API.PublishCallback_v1`

## D) Creator SSOT APIs（本 repo 會提供 stub）
- `API.QueueNewsRemake_v1(map payload)`
  - Input：`{ source, newsId, url, title, contentText, timezone, tone, channels, cta }`
  - Output：`{ ok, idea_id, asset_ids, message }`

> 注意：本 API 先做「入庫 + 產出骨架」，真正的文案生成可以 Phase 2 再接 OpenAI。
