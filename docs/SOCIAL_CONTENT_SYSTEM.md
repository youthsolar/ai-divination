# 社群發文功能（內容工廠）— 規格草案（v0）

> 目標：把 Jeffery 的口述經驗（Whisper 轉文字）系統化 → 產出多平台內容 → 排程/半自動發布 → 追蹤導流到 LINE 免費占卜與符令購買。
> 原則：n8n CE 執行紀錄只留 1 天，所以所有「素材/排程/發布/成效」必須以 **Zoho Creator 為 SSOT**。

## 一、共識（已定）
- 內容方向 #1：週運勢（溫柔安撫 + Render 風格）
  - 基準：週一 12:00 八字
  - 輸出：IG/Threads 文案 + 30–45 秒短影音口播腳本
  - CTA：先導向 LINE 免費占卜（生日+問題）
- Phase 2：SimplyBook 真人老師預約（當不買數位符令、或出現「很麻煩/很急」訊號時，提供預約入口/連結；先做單一入口，後續再做個人化推薦）

## 二、系統範圍（Phase 1：先把內容產出與排程跑起來）
### 2.1 輸入（Input）
1) Jeffery 口述語音（Telegram / 本機音檔）
2) 系統型內容（週運勢）：由 Creator 算出週一 12:00 八字（後續接入）

### 2.2 處理（Process）
A) Whisper → 逐字稿
B) 逐字稿 → 結構化筆記（title/context/insight/actions/CTA）
C) 結構化筆記 → 多平台輸出
- IG/Threads 貼文
- 短影音口播稿
- 留言/私訊導流模板
D) 排程/發布
- 先採 S1/S2（穩定優先）：
  - S1：產出「排程包」交由 Meta Business Suite / Buffer / Later 排程
  - S2：n8n 定時推送「今日/本週待發內容」到操作人（Jeffery/助理），按鈕回報已發布
- 不先做 S3（官方 API 全自動發文），除非後續要申請平台權限

### 2.3 輸出（Output）
- 內容素材（文案/口播稿/圖片需求）
- 排程清單（何時、何平台、哪一則）
- 追蹤連結（UTM/短連結）

## 三、資料模型（Zoho Creator SSOT，建議新增）
> 先定欄位，不必一次做完 UI。

### 3.1 Content_Ideas（原始素材）
- Source_Type: voice / weekly_bazi / manual
- Source_Text: Whisper 逐字稿
- Topic_Tags: 愛情/事業/靈擾/…
- Status: draft / ready / archived

### 3.2 Content_Assets（可發布素材）
- Idea_Link
- Platform: ig / threads / short_video
- Copy_Text
- Script_Text
- CTA_Text
- UTM_URL / Short_URL
- Review_Status: pending / approved / rejected

### 3.3 Content_Schedule（排程與成效）
- Asset_Link
- Scheduled_At
- Published_At
- Published_By
- Publish_Status: scheduled / posted / failed
- Performance (optional): clicks / conversions

## 四、n8n 工作流（Phase 1）
- 已新增模板：`Weekly Fortune — Noon BaZi → Generate & Queue (Template)`
  - repo 檔：`n8n/workflows/Weekly_Fortune__NoonBaZi__Generate_And_Queue.json`
  - n8n workflow id：`qG0UCMKcAGcv7mK8`
- 待新增：
  1) `Creator -> Queue Weekly Fortune` API（n8n 用 env：`ZOHO_CREATOR_WEEKLY_FORTUNE_URL`）
  2) `Daily/Weekly Publish Reminder`（推送待發內容給操作人 + 回寫 Creator）

## 五、驗收（Definition of Done）
Phase 1 DoD（先能營運）：
1) 每週能穩定產出 1 篇週運勢內容（貼文 + 口播稿）
2) 內容在 Creator 有留存（SSOT）
3) n8n 能把待發內容在固定時間推送提醒（S2）或產出排程包（S1）

## 六、風險與注意事項
- n8n CE execution 只留 1 天 → 必須回寫 Creator 留存。
- 平台 API 自動發文（S3）權限/風控高，先不要一開始做。

