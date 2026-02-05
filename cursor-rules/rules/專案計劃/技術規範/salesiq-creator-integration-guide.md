# SalesIQ 與 Creator 整合技術指南

## 📖 概述

本文件詳細記錄了 SalesIQ 聊天機器人與 Zoho Creator 靈學占卜系統的整合過程，特別是解決 OAuth2 範圍限制問題並成功實現塔羅占卜功能的完整技術方案。

## 🎯 專案目標

建立穩定可靠的 SalesIQ 到 Creator 連接，實現：
- 塔羅占卜服務
- 八字命理計算  
- 易經占卜系統
- 其他靈學服務的 API 整合

## ❌ 遇到的核心問題

### 1. OAuth2 範圍限制
**問題描述**：SalesIQ 的 OAuth2 連接設定無法添加 `ZohoCreator.customapi.EXECUTE` 範圍

**錯誤訊息**：
```
The scope required to perform these methods is ZohoCreator.customapi.EXECUTE
```

**根本原因**：SalesIQ 連接設定介面的平台層級限制

### 2. API 呼叫失敗
**問題描述**：使用現有 OAuth2 連接時，所有 `invokeUrl` 呼叫都回傳錯誤

**嘗試過的方法**：
- ✗ 使用 `zoho.creator.executeFunction()` - SalesIQ 中不存在
- ✗ 標準 Creator REST API (`/api/v2/...`) - 需要複雜認證
- ✗ 添加更多 OAuth2 範圍 - SalesIQ 不支援

## ✅ 解決方案：Public Key 認證

### 核心概念
當 OAuth2 範圍受限時，使用 **Public Key 認證**繞過限制：

1. **Creator 端**：將 Custom API 認證方式設為 Public Key
2. **SalesIQ 端**：使用 URL 參數傳遞 Public Key

### 實作步驟

#### 步驟 1：Creator Custom API 設定
```
1. 進入 Zoho Creator 後台
2. 導航至：設定 > 開發者空間 > API
3. 找到目標 Custom API 端點
4. 將認證方式從 'OAuth2' 改為 'Public Key'
5. 記錄生成的 Public Key
```

#### 步驟 2：SalesIQ 插件實作
**正確的 URL 格式**：
```
https://www.zohoapis.com/creator/custom/<account_name>/<app_name>?publickey=<value>
```

**實際範例**：
```deluge
publicKey = "mhnAu6damzyprNWVBZ5Ft1vyn";

tarotResponse = invokeurl
[
    url: "https://www.zohoapis.com/creator/custom/uneedwind/getTarotDivination?publickey=" + publicKey
    type: GET
];
```

### 關鍵技術要點

#### 1. URL 參數格式
- ✅ 使用 `publickey=` 參數
- ✗ 不要使用 `authtoken=` 參數

#### 2. HTTP 方法
- 建議使用 `GET` 方法（除非 Creator 函數需要 POST）

#### 3. 無需 Connection 參數
```deluge
// ✅ 正確寫法
tarotResponse = invokeurl
[
    url: "https://www.zohoapis.com/creator/custom/uneedwind/getTarotDivination?publickey=" + publicKey
    type: GET
];

// ✗ 錯誤寫法
tarotResponse = invokeurl
[
    url: "https://www.zohoapis.com/creator/custom/uneedwind/getTarotDivination"
    type: GET
    connection: "someConnection"  // 不需要！
];
```

## 🔧 塔羅占卜實作詳解

### JSON 資料解析
Creator 回傳的原始 JSON 格式：
```json
{
  "result": [
    {
      "Card_ID": 4707400000000384019,
      "Card_Meaning": "穩定、權威、結構、保護、秩序",
      "Is_Reversed": false
    },
    // ... 其他 4 張牌
  ],
  "code": 3000
}
```

### 人性化結果轉換
將原始 JSON 轉換為具有靈性感的占卜結果：

```deluge
// 使用 Map 儲存解析結果（避免 List.set() 問題）
cardMeanings = Map();
cardReversed = Map();
cardPositions = {"過去", "現在", "未來", "挑戰", "結果"};

// 解析每張牌的資訊
for each cardNum in {1, 2, 3, 4, 5}
{
    // 提取牌義
    meaningStart = responseText.indexOf("\"Card_Meaning\":\"", searchPos);
    if(meaningStart > searchPos)
    {
        meaningEnd = responseText.indexOf("\"", meaningStart + 16);
        extractedMeaning = responseText.substring(meaningStart + 16, meaningEnd);
        cardMeanings.put(cardIndex.toString(), extractedMeaning);
    }
    
    // 提取正逆位
    reversedStart = responseText.indexOf("\"Is_Reversed\":", searchPos);
    if(reversedStart > searchPos)
    {
        reversedSection = responseText.substring(reversedStart, nextComma + 1);
        isReversedCard = reversedSection.contains("true");
        cardReversed.put(cardIndex.toString(), isReversedCard);
    }
}
```

### 最終輸出格式
```
✨ 塔羅五張牌陣占卜完成！

🎯 你的問題：我想知道我的工作發展如何？
👤 占卜對象：王小明

🔮 宇宙為你揭示的訊息：

⏪ 過去（正位）：
   穩定、權威、結構、保護、秩序

⏸️ 現在（正位）：
   負擔過重、責任、壓力

⏩ 未來（逆位）：
   迷失方向、決策困難

⚡ 挑戰（逆位）：
   分離、誘惑、不忠、選擇困難

🌟 結果（逆位）：
   不安、家庭問題、缺乏安全感

💫 綜合指引：
這個牌陣顯示了你人生旅程中的重要轉折點。請仔細聆聽每張牌帶來的智慧，它們將指引你走向光明的道路。

🙏 願宇宙的智慧與愛與你同在！
```

## ⚠️ 常見陷阱與注意事項

### 1. Deluge 語法限制
```deluge
// ✗ 錯誤：Deluge 中沒有 List.set() 方法
cardMeanings = {"", "", "", "", ""};
cardMeanings.set(0, "新值");  // 會報錯

// ✅ 正確：使用 Map 代替
cardMeanings = Map();
cardMeanings.put("0", "新值");
```

### 2. 迴圈限制
```deluge
// ✗ 錯誤：不支援傳統 for 迴圈
for(i = 0; i < 5; i++) { ... }

// ✅ 正確：使用 for each
cardNumbers = {1, 2, 3, 4, 5};
for each cardNum in cardNumbers { ... }
```

### 3. API 端點命名
```deluge
// ✅ 正確：使用實際的 Custom API 名稱
url: "https://www.zohoapis.com/creator/custom/uneedwind/getTarotDivination?publickey=" + key

// ✗ 錯誤：混淆應用程式名稱和 API 名稱
url: "https://www.zohoapis.com/creator/custom/uneedwind/lunar-ai-bazi?publickey=" + key
```

## 🔄 適用於其他功能

這個解決方案適用於所有需要 SalesIQ 呼叫 Creator 的場景：

### 八字命理
```deluge
baziResponse = invokeurl
[
    url: "https://www.zohoapis.com/creator/custom/uneedwind/getBaziReading?publickey=" + publicKey
    type: GET
];
```

### 易經占卜
```deluge
yijingResponse = invokeurl
[
    url: "https://www.zohoapis.com/creator/custom/uneedwind/getYijingDivination?publickey=" + publicKey
    type: GET
];
```

### 通用模式
1. 在 Creator 中建立 Custom API（Public Key 認證）
2. 在 SalesIQ 中建立對應插件
3. 使用 `invokeUrl` + URL 參數傳遞 Public Key
4. 解析 JSON 回應並格式化輸出

## 📝 檢查清單

建立新的 SalesIQ-Creator 整合時：

- [ ] Creator Custom API 已建立
- [ ] 認證方式設為 Public Key  
- [ ] Public Key 已記錄
- [ ] SalesIQ 插件使用正確的 URL 格式
- [ ] 使用 `publickey=` 參數而非 `authtoken=`
- [ ] JSON 解析邏輯已實作
- [ ] 錯誤處理機制已加入
- [ ] 人性化輸出格式已設計

## 🎉 成功指標

整合成功的標誌：
- ✅ SalesIQ 插件能成功呼叫 Creator API
- ✅ 獲得結構化的 JSON 回應資料
- ✅ 用戶能看到人性化的占卜結果
- ✅ 錯誤情況有適當的提示訊息

## 📚 官方參考資料

### Zoho Creator Custom API 官方文件
- **[Create and Manage Custom APIs](https://help.zoho.com/portal/en/kb/creator/developer-guide/microservices/custom-api/articles/create-and-manage-custom-apis#6_Points_to_note)**
  - 詳細說明 Custom API 的建立和管理流程
  - 包含認證方式（OAuth2 vs Public Key）的選擇指南
  - 重要注意事項和最佳實踐

### 核心技術文件

#### 1. **API 錯誤診斷**
- **[Custom API Status Codes](https://help.zoho.com/portal/en/kb/creator/developer-guide/microservices/custom-api/articles/custom-api-status-codes)**
  - 完整的 API 狀態碼對照表
  - 常見錯誤情況與解決方案
  - 用於快速診斷 API 呼叫問題

**常見狀態碼**：
```
3000 - 成功
4000 - 無效請求
4001 - 認證失敗  
4003 - 權限不足
5000 - 內部伺服器錯誤
```

#### 2. **資料結構查詢**
- **[Get Fields API](https://www.zoho.com/creator/help/api/v2/get-fields.html)**
  - 取得表單所有欄位的詳細資訊
  - 查詢欄位類型、屬性、選項等元資料
  - 用於動態建構 API 請求

**API 端點格式**：
```
GET https://creator.zoho.com/api/v2/<account>/<app>/form/<form>/fields
```

**回應範例**：
```json
{
  "fields": [
    {
      "display_name": "姓名",
      "link_name": "Name",
      "type": 1,
      "mandatory": true,
      "max_char": 255
    }
  ]
}
```

**欄位類型對照**：
- `1` - 單行文字
- `3` - 電子郵件
- `5` - 數字
- `10` - 日期
- `12` - 下拉選單

#### 3. **完整 REST API 指南**
- **[Creator API v2 Documentation](https://www.zoho.com/creator/help/api/v2/)**
  - Zoho Creator 的完整 REST API 參考
  - 包含資料 CRUD 操作、認證、批次處理等
  - 支援 OAuth2 和 API Token 兩種認證方式

**核心功能**：
```
GET    /records - 查詢記錄
POST   /records - 新增記錄  
PATCH  /records - 更新記錄
DELETE /records - 刪除記錄
```

**認證方式**：
```bash
# OAuth2
Authorization: Zoho-oauthtoken <access_token>

# API Token (建議用於伺服器端)
Authorization: Zoho-authtoken <auth_token>
```

### 相關 Zoho 文件
- [SalesIQ Developer Documentation](https://www.zoho.com/salesiq/help/developer-section/)
- [Deluge Script Reference](https://www.zoho.com/creator/help/script/)
- [Zoho API Authentication Guide](https://www.zoho.com/creator/help/api/)

## 🔗 延伸閱讀

### 本專案相關文件
- `Deluge Function Rules（Creator程式規則）.md` - Creator 程式規則
- `deluge-coding-standards.mdc` - Deluge 編碼標準

### 實作參考
- `ECPay/ECPay.finalSolution.deluge` - Public Key 認證的成功案例
- `Auth/Auth.getValidAccessToken.deluge` - OAuth2 Token 管理範例

---

**作者**：AI 助手 & uneedwind  
**建立日期**：2024-12-28  
**最後更新**：2024-12-28  
**版本**：1.0

> 💡 **提示**：此文件應隨著新功能的加入而持續更新，特別是當發現新的整合模式或解決方案時。請定期查閱 [Zoho 官方文件](https://help.zoho.com/portal/en/kb/creator/developer-guide/microservices/custom-api/articles/create-and-manage-custom-apis#6_Points_to_note)以獲取最新的 API 功能和最佳實踐。
- [SalesIQ JS API - Visitor ID](https://www.zoho.com/salesiq/help/developer-section/js-api-visitor-id.html)
  - SalesIQ 訪問者 ID 記錄技術文件
  - 用於追蹤和識別網站訪問者
  - 支援自訂訪問者 ID 和取得系統生成的 ID

- [SalesIQ JS API Documentation](https://www.zoho.com/salesiq/help/developer-section/js-api.html)
  - SalesIQ JavaScript API 完整參考文件
  - 包含聊天機器人、訪問者追蹤、自訂事件等功能
  - 支援網頁端即時互動和資料收集