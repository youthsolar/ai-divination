# Data Model（最小可跑）— Phase 1

Last updated: 2026-02-18

> 目標：用 Zoho Creator 做 SSOT，支撐「占卜、冷卻、付款、交付、回購序列」。

## 1) 核心主鍵
- **line_user_id**：LINE 的 userId（外部身份主鍵之一）
- **question_key**：同題判定鍵（v1：normalize(question_text) + line_user_id → hash）
- **order_no**：內部訂單號（Creator 產生）
- **ecpay_trade_no / merchant_trade_no**：金流對帳鍵

## 2) 表/集合（MVP）

### 2.1 Users
- id (Creator)
- line_user_id (unique)
- created_at
- locale (optional)

### 2.2 Questions
- id
- user_id (ref Users)
- line_user_id (denormalized)
- birthday_gregorian (YYYY-MM-DD)
- question_text (raw)
- question_key (indexed)
- status: NEW | ANSWERED | COOLDOWN
- cooldown_until (datetime)
- created_at

### 2.3 DivinationRuns
- id
- question_id (ref Questions)
- method: TAROT | ICHING | HYBRID
- model: (string, optional)
- prompt_version (string)
- result_text (long text)
- result_meta_json (json)
- created_at

### 2.4 TalismanSeries（同題回購序列）
- id
- question_key
- user_id
- max_steps = 5
- current_step (0..5)
- next_purchase_earliest_at (datetime)  # = last_paid_at + cooldown_days
- last_paid_at (datetime)
- status: ACTIVE | COMPLETED

### 2.5 Orders
- id
- order_no (unique)
- user_id
- line_user_id
- question_key
- series_id (ref TalismanSeries)
- series_step (1..5)
- amount (360)
- currency (TWD)
- status: INIT | PENDING_PAYMENT | PAID | FAILED | REFUNDED
- ecpay_merchant_trade_no
- ecpay_trade_no
- paid_at
- callback_received_at
- idempotency_key (optional)

### 2.6 Deliveries
- id
- order_id
- channel: LINE
- type: TOKEN_URL | IMAGE
- payload: (url / image_id / file_ref)
- status: QUEUED | SENT | FAILED
- sent_at
- error_message
- dedupe_key (unique)  # e.g. order_no + type

## 3) 狀態機（簡化）

### Question
- NEW → ANSWERED（產出免費結果）
- ANSWERED → COOLDOWN（冷卻中，觸發固定回覆）
- COOLDOWN → NEW（過了 cooldown_until 才可再次產生新 run/或允許回購下一步）

### Order
- INIT → PENDING_PAYMENT（建立 ECPay 交易）
- PENDING_PAYMENT → PAID（callback 驗章成功）
- PAID →（觸發 Delivery）

## 4) 冪等性策略（建議）
- Orders：以 `ecpay_merchant_trade_no` 或 `order_no` 做 unique；callback 重送則 update 而非 insert。
- Deliveries：以 `dedupe_key` unique，避免重送。
