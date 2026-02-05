# ECPay 綠界金流整合技術文件

## 專案概述

此專案實現了 Zoho Creator 與 ECPay（綠界科技）金流服務的完整整合，解決了 ECPay 使用 `application/x-www-form-urlencoded` 格式與 Zoho Creator Custom API 只支援 JSON 格式的相容性問題。

## 系統架構

```
客戶瀏覽器 → ECPay 付款頁面 → ECPay 伺服器
                                    ↓
                            ECPay Webhook (form-urlencoded)
                                    ↓
                            Vercel Proxy (轉換為 JSON)
                                    ↓
                            Zoho Creator Custom API
                                    ↓
                            更新訂單狀態 (Talisman_Purchases)
```

## 核心元件

### 1. Deluge 函數

#### ECPay.generateCheckMacValue_private
- **功能**：生成 ECPay 要求的 CheckMacValue 簽章
- **位置**：`ECPay/ECPay.generateCheckMacValue_private.deluge`
- **重點**：
  - 實現 ECPay 特定的 URL 編碼規則
  - 使用 SHA256 加密
  - 處理特殊字元編碼（如單引號、減號等）

#### ECPay.generateCheckoutForm_Production
- **功能**：生成生產環境的付款表單 HTML
- **位置**：`ECPay/ECPay.generateCheckoutForm_Production.deluge`
- **輸入參數**：
  ```deluge
  orderInfo = Map();
  orderInfo.put("merchantTradeNo", "ORDER123");
  orderInfo.put("totalAmount", 1000);
  orderInfo.put("itemName", "商品名稱");
  orderInfo.put("tradeDesc", "商品描述");
  orderInfo.put("clientBackURL", "https://yourdomain.com/success");
  ```

#### Webhook.handleECPayReturn
- **功能**：接收並處理 ECPay 付款回調
- **位置**：`Webhook/Webhook.handleECPayReturn.deluge`
- **特點**：
  - 無參數函數（符合 Creator Custom API 要求）
  - 透過 `crmAPIRequest` 獲取 POST 資料
  - 根據 MerchantTradeNo 更新特定訂單
  - 回傳 "1|OK" 給 ECPay

### 2. Vercel Proxy 服務

#### 部署位置
- **URL**：https://ecpay-webhook-proxy-ptmk.vercel.app/api/webhook
- **原始碼**：`vercel-ecpay-proxy/api/webhook.js`

#### 功能
1. 接收 ECPay 的 form-urlencoded POST 請求
2. 解析並轉換為 JSON 格式
3. 轉發到 Zoho Creator Custom API
4. 回傳 "1|OK" 給 ECPay

#### 關鍵程式碼片段
```javascript
// 解析 form-urlencoded 資料
const parsedData = querystring.parse(body);

// 準備 JSON payload
const updatePayload = {
    merchantTradeNo: parsedData.MerchantTradeNo,
    status: 'Paid',
    tradeNo: parsedData.TradeNo,
    checkMacValue: parsedData.CheckMacValue,
    // ... 其他欄位
};

// 轉發到 Zoho Creator
const zohoApiUrl = 'https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=YOUR_PUBLIC_KEY';
```

### 3. Zoho Creator 設定

#### 應用程式變數
在 Zoho Creator 中設定以下應用程式變數：

**測試環境**：
- `ECPay.merchantID`：3002607
- `ECPay.hashKey`：pwFHCqoQZGmho4w6
- `ECPay.hashIV`：EkRm7iFT261dpevs

**生產環境**：
- `ECPay.merchantID_Production`：您的正式商店代號
- `ECPay.hashKey_Production`：您的正式 HashKey
- `ECPay.hashIV_Production`：您的正式 HashIV
- `ECPay.PublicKey`：Custom API 的 Public Key

#### Custom API 設定
1. 在 Creator 中建立 Custom API
2. 函數名稱：`handle_ecpay_return`
3. 函數簽名：`map Webhook.handleECPayReturn()`（無參數）
4. 啟用 Public Key 認證
5. 複製 Public Key 到 Vercel 代理設定中

#### 表單結構 (Talisman_Purchases)
```
- MerchantTradeNo (text) - 商品號碼
- Status (picklist) - 購買階段 ["Pending", "Paid", "Failed"]
- Item_Name_Chinese (text) - 產品名稱
- Description_Chinese (textarea) - 產品描述
- TradeAmt (decimal) - 交易金額
- Purchase_Timestamp (datetime) - 購買時間
- Transaction_ID (text) - 金流交易號碼
- TradeNo (text) - 交易序號
- PaymentType (text) - 付款形式
- RtnCode (number) - 回調號碼
- RtnMsg (text) - 回調訊息
- PaymentDate (datetime) - 付款時間
- CheckMacValue (textarea) - 檢查碼
```

## 使用流程

### 1. 建立訂單
```deluge
// 在 Creator 中建立訂單記錄
newOrder = insert into Talisman_Purchases
[
    Added_User = zoho.loginuser
    MerchantTradeNo = "ORDER" + zoho.currenttime.toString("yyyyMMddHHmmss")
    Status = "Pending"
    Item_Name_Chinese = "商品名稱"
    Description_Chinese = "商品描述"
    TradeAmt = 1000
];
```

### 2. 生成付款頁面
```deluge
// 準備訂單資訊
orderInfo = Map();
orderInfo.put("merchantTradeNo", newOrder.MerchantTradeNo);
orderInfo.put("totalAmount", newOrder.TradeAmt);
orderInfo.put("itemName", newOrder.Item_Name_Chinese);
orderInfo.put("tradeDesc", newOrder.Description_Chinese);
orderInfo.put("clientBackURL", "https://yourdomain.com/success");

// 生成付款 HTML
paymentHtml = thisapp.ECPay.generateCheckoutForm_Production(orderInfo);
```

### 3. 付款流程
1. 客戶在生成的 HTML 頁面點擊「確認付款」
2. 被導向至 ECPay 付款頁面
3. 完成付款後，ECPay 發送 webhook 到 Vercel proxy
4. Vercel proxy 轉換格式並轉發到 Creator
5. Creator 更新訂單狀態為 "Paid"

## 部署指南

### Vercel 部署
1. 安裝 Vercel CLI：`npm i -g vercel`
2. 進入專案目錄：`cd vercel-ecpay-proxy`
3. 部署：`vercel --prod`
4. 記錄部署的 URL

### 更新 Public Key
1. 在 Creator 中更新 Custom API 的 Public Key
2. 更新 `webhook.js` 中的 `zohoApiUrl` 參數

### 切換到生產環境
1. 在 Creator 中設定生產環境變數
2. 更新 ECPay 管理後台的 ReturnURL 為 Vercel proxy URL
3. 使用 `ECPay.generateCheckoutForm_Production` 函數

## 安全性考量

### CheckMacValue 驗證
目前的實作儲存了 CheckMacValue 但未進行驗證。建議在 `Webhook.handleECPayReturn` 中加入驗證邏輯：

```deluge
// 重新計算 CheckMacValue
calculatedMac = thisapp.ECPay.generateCheckMacValue_private(receivedParams, hashKey, hashIV);

// 比對驗證
if(calculatedMac != receivedCheckMacValue)
{
    info "警告：CheckMacValue 驗證失敗";
    // 拒絕處理此請求
}
```

### IP 白名單
考慮在 Vercel 中加入 ECPay 的 IP 白名單驗證。

## 故障排除

### 常見錯誤

1. **CheckMacValue Error (10200073)**
   - 檢查 HashKey 和 HashIV 是否正確
   - 確認 URL 編碼規則是否正確實現

2. **訂單編號重複 (10300028)**
   - 確保 MerchantTradeNo 是唯一的
   - 使用時間戳或 UUID 生成訂單號

3. **Content-Type 錯誤 (9410)**
   - 確認使用 Vercel proxy 而非直接連接
   - 檢查 Creator API 設定

### 除錯工具
- Vercel 日誌：`vercel logs`
- Creator 函數日誌：查看 info 輸出
- ECPay 測試工具：使用測試商店代號

## Vercel 服務穩定性評估

### 優點
1. **免費方案**足以應付中小型專案
2. **自動擴展**處理流量尖峰
3. **全球 CDN** 確保低延遲
4. **簡單部署**透過 CLI 或 Git

### 限制
- 免費方案：100GB 頻寬/月，100,000 請求/日
- Serverless 函數：10 秒執行時限
- 冷啟動：約 100-500ms 延遲

### 建議
- 對於生產環境，建議升級到 Pro 方案（$20/月）
- 設定監控和告警
- 準備備用方案（如 AWS Lambda 或自建伺服器）

## 維護建議

1. **定期檢查**
   - 每月檢查 Vercel 使用量
   - 監控 API 錯誤率
   - 更新相依套件

2. **備份策略**
   - 定期備份 Deluge 函數
   - 版本控制 Vercel 程式碼
   - 記錄所有設定變更

3. **安全更新**
   - 定期更換 API 金鑰
   - 監控異常交易
   - 實施速率限制

---

**最後更新**：2025-01-21
**維護者**：Lunar Tom
