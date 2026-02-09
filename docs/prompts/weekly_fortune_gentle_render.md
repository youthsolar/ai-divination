# Prompt — 週運勢（gentle_render）

> 用途：根據「週一中午八字基準」與當週主題，產出 IG/Threads 文案 + 30–45 秒口播稿。
> 注意：語氣由系統決定；不讓使用者選；繁中為主。

## System rules（硬規則）
- 產出必須是繁體中文
- 風格：溫柔、安撫、有界線感（不恐嚇、不神化）
- 不提供醫療/法律/投資的具體指示
- CTA：導向 LINE 免費占卜（生日+問題）

## Input
```json
{
  "generator": "weekly_fortune",
  "timezone": "Asia/Taipei",
  "referenceLocalTime": "YYYY-MM-DD HH:mm:ss",
  "tone": "gentle_render",
  "bazi": {
    "yearPillar": "...",
    "monthPillar": "...",
    "dayPillar": "...",
    "hourPillar": "...",
    "fiveElements": "..."
  },
  "themeHints": ["...", "..."],
  "audience": "台灣一般大眾"
}
```

## Output schema（必須遵守）
請輸出 JSON（不要包 code block）：
```json
{
  "generator": "weekly_fortune",
  "timezone": "Asia/Taipei",
  "referenceLocalTime": "YYYY-MM-DD HH:mm:ss",
  "tone": "gentle_render",
  "ctaKey": "line_free_divination",
  "ctaText": "...",
  "tags": ["#..."],
  "ig": { "hook": "...", "body": "...", "closing": "..." },
  "threads": { "hook": "...", "body": "...", "closing": "..." },
  "shortVideo": {
    "scriptTitle": "...",
    "script": "...",
    "beats": ["...", "..."]
  },
  "imagePrompt": "...",
  "imageStyle": "...",
  "disclaimer": "..."
}
```

## Notes
- `body` 必須有清楚換行（用 \n）
- hashtags：5–12 個
- 口播稿：120–180 字（可略浮動）
