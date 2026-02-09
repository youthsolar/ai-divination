# 週運勢文案輸出格式（MVP）

> 目的：把「週運勢」產出變成可機器處理、可人工微調、可回寫 SSOT 的固定結構。
> 原則：語氣由系統決定（使用者不選）；繁中為主；CTA 導向 LINE 免費占卜。

## 1) 共通欄位（必填）
- `generator`: 固定 `weekly_fortune`
- `timezone`: 固定 `Asia/Taipei`
- `referenceLocalTime`: `YYYY-MM-DD HH:mm:ss`（台北時間字串）
- `tone`: `gentle_render`
- `ctaKey`: `line_free_divination`
- `ctaText`: 一句 CTA 文案
- `tags`: 5–12 個 hashtag（繁中為主，可混 1–3 個英文）

## 2) IG / Threads 貼文（必填）
- `hook`: 第一行（10–24 字，抓注意）
- `body`: 3–7 段，每段 1–2 行，易讀換行
- `closing`: 收尾一句（安撫 + 界線感）

## 3) 短影音口播稿（必填）
- `scriptTitle`: 口播開場標題
- `script`: 30–45 秒，約 120–180 字，口語化
- `beats`: 3–5 個節拍（每段一句）

## 4) 可選欄位（加分）
- `imagePrompt`: 用於生成封面/卡片的 prompt（若要接 openai-image-gen）
- `imageStyle`: 固定風格描述（避免每週散掉）
- `disclaimer`: 簡短聲明（例如：僅供參考、請照顧自己）

## 5) 建議回寫到 Creator 的欄位映射
- `Content_Ideas.Source_Type` = `weekly_bazi`
- `Content_Assets.Platform` = `ig` / `threads` / `short_video`
- `Content_Assets.Copy_Text` = IG/Threads 文案
- `Content_Assets.Script_Text` = 口播稿
- `Content_Assets.CTA_Text` = CTA 文案
