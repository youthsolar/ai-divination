# 內容工廠 #3：口述一段話 → 產生文案（Voice-to-copy）— Spec（v0）

> 目的：你口述一段想法（先 STT 轉文字），系統幫你生成多平台文案版本。
> 原則：語氣由系統判斷；所有輸出回寫 Creator（SSOT）。

## A) Input
- `source`: 固定 `voice`
- `sourceText`: Whisper 逐字稿（繁中）
- `intent`: `promo|announcement|insight|education`（可先預設 `insight`）
- `channels`: `['ig','threads','fb','linkedin']`
- `timezone`: `Asia/Taipei`
- `cta`: 預設導向 `LINE 免費占卜（生日+問題）`
- `constraints`（選填）
  - `maxChars`
  - `mustMention`
  - `mustAvoid`

## B) Output
- IG/Threads：短文 + hashtags
- FB：中長文 + CTA
- LinkedIn：專業短文
- 可選：短影音口播稿 30–45 秒

## C) Pipeline
1) Whisper STT → n8n webhook（或手動）
2) n8n 呼叫 Creator：`API.QueueVoiceCopy_v1`
3) Creator 入庫 Content_Ideas/Assets
4) 人工審核 → 排程/發佈 → PublishCallback

## D) Creator SSOT APIs（本 repo 會提供 stub）
- `API.QueueVoiceCopy_v1(map payload)`
  - Input：`{ source, sourceText, intent, channels, timezone, cta, constraints }`
  - Output：`{ ok, idea_id, asset_ids, message }`
