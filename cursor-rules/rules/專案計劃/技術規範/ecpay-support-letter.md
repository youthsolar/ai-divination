# 致綠界科技技術支援團隊

## 基本資料
- **特店編號**: 3002607 (測試環境)
- **問題分類**: 金流技術問題 - ReturnURL/NotifyURL 回調
- **開發平台**: Zoho Creator
- **問題發生時間**: 2025年8月19日起
- **緊急程度**: 高 (影響正式上線)

## 問題描述

我們正在整合綠界全方位金流 API 到 Zoho Creator 平台，在 ReturnURL/NotifyURL 回調接收方面遇到技術問題。

### 技術架構
- **前端**: 成功生成付款表單並跳轉到綠界付款頁面
- **回調接收端**: Zoho Creator Custom API 端點
- **問題現象**: 無法接收到綠界的付款結果通知

### 具體技術細節

#### 1. ReturnURL 設定
```
https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=W6nH8Tnw5SwYT4O3pQX01RSNy
```

#### 2. Zoho Creator API 端點配置
- **HTTP Method**: POST
- **Content Type**: application/json (Creator 平台限制)
- **Authentication**: Public Key
- **Function**: Webhook.handleECPayReturn

#### 3. 測試結果
使用 curl 模擬綠界回調：
```bash
curl -X POST "https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=W6nH8Tnw5SwYT4O3pQX01RSNy" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MerchantTradeNo=TEST123&RtnCode=1&TradeNo=TEST456"
```

**錯誤回應**: `{"code":9410,"message":"The Content-Type specified for this Custom API is invalid."}`

#### 4. 平台限制
Zoho Creator 的 Custom API 端點僅支援：
- application/json
- multipart/form-data

**不支援**: application/x-www-form-urlencoded

## 技術問題

### 主要疑問
1. **Content-Type 兼容性**: 綠界是否支援發送 `application/json` 格式的回調通知？
2. **參數格式**: 如果使用 JSON 格式，參數結構應該如何？
3. **替代方案**: 是否有其他推薦的回調接收方式？

### 已嘗試的解決方案
1. ✅ 設定 Creator API 為 `application/json` (Creator 自動轉換 form-data)
2. ✅ 使用 Public Key 認證避免 OAuth2 限制
3. ✅ 完整的 CheckMacValue 驗證邏輯
4. ✅ 確保回傳 "1|OK" 格式給綠界
5. ✅ 測試 multipart/form-data 格式
6. ✅ 函數執行成功驗證

### 詳細測試結果
```bash
# 測試 1: application/json
curl -X POST "https://...?publickey=XXX" -H "Content-Type: application/json" 
結果: 函數執行成功，但參數為 null

# 測試 2: application/x-www-form-urlencoded  
curl -X POST "https://...?publickey=XXX" -H "Content-Type: application/x-www-form-urlencoded"
結果: 9410 錯誤 - Content-Type 不支援

# 測試 3: multipart/form-data
curl -X POST "https://...?publickey=XXX" -F "MerchantTradeNo=XXX"
結果: 函數執行成功，但參數為 null
```

### 測試環境資訊
- **測試訂單號**: FINAL20250819031558
- **測試金額**: NT$ 50
- **付款方式**: 信用卡
- **CheckMacValue**: 正確計算並驗證

## 請求協助

### 1. 技術確認
請協助確認以下技術細節：
- 綠界 ReturnURL/NotifyURL 的 Content-Type 是否固定為 `application/x-www-form-urlencoded`？
- 是否可以配置為發送 `application/json` 格式？
- 建議的 Zoho Creator 整合最佳實踐？

### 2. 測試支援
如果可能，請協助：
- 提供測試環境的回調日誌
- 確認我們的 ReturnURL 是否可達
- 驗證 CheckMacValue 計算邏輯

### 3. 文件補充
建議在技術文件中增加：
- 針對 Zoho Creator 平台的整合指南
- Content-Type 相關的詳細說明
- 常見整合平台的兼容性列表

## 聯絡資訊
- **技術負責人**: [您的姓名]
- **電子郵件**: [您的信箱]
- **電話**: [您的電話]
- **預期回覆時間**: 3個工作天內

## 附件
- CheckMacValue 計算程式碼
- API 端點設定截圖
- 錯誤訊息截圖
- 測試用 curl 命令

---

感謝綠界技術團隊的支援，期待您的專業建議！

**[您的公司名稱]**  
**技術開發團隊**  
**日期**: 2025年8月19日
