# Zoho Creator 技術支援信件 - Content-Type 支援問題

## 📧 **主旨**
```
Custom API Content-Type Support - application/x-www-form-urlencoded compatibility issue
```

## 📝 **信件內容**

---

**Dear Zoho Creator Support Team,**

We are experiencing a Content-Type compatibility issue with Zoho Creator Custom API endpoints when receiving webhooks from third-party payment gateways.

### **Technical Details**

**Current Setup:**
- Custom API Function: `string Webhook.handleECPayReturn(map crmAPIRequest)`
- API Endpoint: `https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=W6nH8Tnw5SwYT4O3pQX01RSNy`
- Authentication: Public Key
- Expected Content-Type from external service: `application/x-www-form-urlencoded`

### **Problem Description**

We're integrating with ECPay payment gateway (綠界科技), which **固定發送** `application/x-www-form-urlencoded` format for webhook callbacks. ECPay engineer confirmed they cannot change this format.

**Error Received:**
- HTTP 400 Bad Request from Zoho Creator
- Suspected error code: 9410 (Content-Type mismatch)

**Test Data from ECPay logs:**
```
URL: https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=W6nH8Tnw5SwYT4O3pQX01RSNy
Content-Type: application/x-www-form-urlencoded
Data: CustomField1=&CustomField2=&CustomField3=&CustomField4=&MerchantID=3002607&MerchantTradeNo=LAI20250819025659&PaymentDate=2025/08/19 03:04:45&PaymentType=Credit_CreditCard&PaymentTypeChargeFee=2&RtnCode=1&RtnMsg=交易成功&SimulatePaid=0&StoreID=&TradeAmt=50&TradeDate=2025/08/19 03:02:37&TradeNo=2508190302372898&CheckMacValue=8411906EAC43619E46735E69B54B35D491B0EB1FCB11942AC81157D9F57245C3
Result: System.Net.WebException: 遠端伺服器傳回一個錯誤: (400) 不正確的要求。
```

### **Questions**

1. **Content-Type Support**: Does Zoho Creator Custom API support receiving `application/x-www-form-urlencoded` data?

2. **Data Processing**: If supported, how should the `crmAPIRequest` parameter process form-urlencoded data? Should it automatically parse into a Map structure?

3. **Configuration**: Is there a specific Content-Type setting in the Custom API configuration to accept form-urlencoded data?

4. **Documentation Reference**: Based on [Zoho Deluge invokeURL documentation](https://www.zoho.com/deluge/help/webhook/invokeurl-api-task.html), we see that **outgoing** requests support both `multipart/form-data` and `application/x-www-form-urlencoded` via headers. Does this same flexibility apply to **incoming** Custom API endpoints?

### **Current Workaround Consideration**

ECPay engineer suggested using an intermediate server to convert the format, but we prefer a direct integration if Zoho Creator supports it.

### **Environment**
- Application: 易經靈學占卜專案  
- Account: uneedwind
- Zoho Creator Plan: [您的方案]

### **Expected Response**
Please confirm:
1. Whether `application/x-www-form-urlencoded` is supported for incoming Custom API requests
2. If yes, the correct way to process the data in the `crmAPIRequest` parameter
3. If no, recommended alternatives for receiving third-party webhooks

Thank you for your assistance.

**Best regards,**  
[您的名字]  
[您的公司/組織]  
[您的聯絡方式]

---

## 🔧 **中文版本**

**親愛的 Zoho Creator 技術支援團隊，**

我們在接收第三方金流服務的 webhook 時遇到 Content-Type 兼容性問題。

### **技術細節**

**目前設定：**
- Custom API 函數：`string Webhook.handleECPayReturn(map crmAPIRequest)`
- API 端點：`https://www.zohoapis.com/creator/custom/uneedwind/handle_ecpay_return?publickey=W6nH8Tnw5SwYT4O3pQX01RSNy`
- 認證方式：Public Key
- 外部服務預期 Content-Type：`application/x-www-form-urlencoded`

### **問題描述**

我們正在與綠界科技金流整合，綠界工程師確認他們**固定發送** `application/x-www-form-urlencoded` 格式，無法更改。

**收到的錯誤：**
- Zoho Creator 回傳 HTTP 400 Bad Request
- 疑似錯誤代碼：9410 (Content-Type 不符)

### **請協助確認**

1. **Content-Type 支援**：Zoho Creator Custom API 是否支援接收 `application/x-www-form-urlencoded` 資料？

2. **資料處理**：如果支援，`crmAPIRequest` 參數應該如何處理 form-urlencoded 資料？

3. **設定方式**：Custom API 設定中是否有特定的 Content-Type 選項？

4. **文件參考**：根據 [Zoho Deluge invokeURL 文件](https://www.zoho.com/deluge/help/webhook/invokeurl-api-task.html)，**發送** 請求支援多種格式，**接收** 端點是否也有相同彈性？

謝謝您的協助。

---

## 📎 **附件建議**

1. ECPay 錯誤日誌截圖
2. Zoho Creator Custom API 設定截圖  
3. 測試用 curl 命令（由 ECPay 提供）
4. 目前的 Deluge 函數程式碼
