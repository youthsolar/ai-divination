# 文案產生器（Content Generators）— Phase plan

> 目標：把內容生產變成可 SSOT、可追蹤、可排程的流程（n8n + Creator）。

## 四個文案產生器（順序）
### 1) 週運勢（優先）
- Input：參考日期（台北時區）、八字基準（Noon BaZi）、受眾 persona/語氣由系統決定
- Output：可發佈到社群的週運勢文案 + tags + 建議發佈時間
- Pipeline：n8n 產生 → Creator QueueWeeklyFortune → 人工審核/排程 → PublishCallback

### 2) winds.tw News 再製（Phase 2）
- Input：news 文章（標題/內文/URL/日期）
- Output：多平台短文（FB/IG/Threads/LINKEDIN）+ 關鍵句 + Hashtags + AI 深圖 prompt
- Pipeline：n8n 抓取/同步 → Creator 入庫 → 轉寫/拆段 → 排程

### 3) 口述一段話 → 產生文案（Voice-to-copy）
- Input：語音文字稿（STT）、目的（促銷/公告/心得/教育）、限制（字數/平台）
- Output：多版本文案 + CTA + 標題
- Pipeline：Whisper STT → Creator Content_Ideas 入庫 → 轉寫生成

## 通用規範（適用三者）
- 語氣：使用者不選；由 persona/context 決定
- 產出格式：必含 `generator`, `source`, `timezone`, `referenceLocalTime` 等 debug 欄位
- SSOT：所有產出與發布結果回寫 Creator（n8n CE logs 不可靠）

## 下一步（本 repo 要補的東西）
- [ ] 在 `docs/SOCIAL_CONTENT_SYSTEM.md` 內補齊「三生成器」的 I/O schema
- [ ] 在 `n8n/workflows/` 補齊對應模板（先週運勢）
- [ ] 在 Creator 端建立 API：Queue/Callback（已在 docs 列出）
