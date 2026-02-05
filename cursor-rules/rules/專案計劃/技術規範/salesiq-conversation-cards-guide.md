# SalesIQ 對話卡片開發指南

## 📖 概述

SalesIQ 對話卡片（Conversation Cards）是收集用戶結構化資料的強大工具，特別適用於需要多步驟資料收集的場景，如塔羅占卜、命理諮詢等服務。

## 🎯 對話卡片 vs 傳統參數

### 傳統插件參數的限制
- 一次性收集所有參數
- 用戶體驗較差（需要填寫長表單）
- 參數驗證困難
- 無法實現對話式引導

### 對話卡片的優勢
- ✅ 分步驟收集資料，用戶體驗佳
- ✅ 可以進行實時驗證和引導
- ✅ 支援多種輸入類型
- ✅ 可以根據前面的回答調整後續問題
- ✅ 資料暫存在 session 中，不會丟失

## 🛠️ 實作架構

### 1. 資料流程設計
```
用戶觸發插件 
    ↓
顯示第一張卡片（姓氏）
    ↓
收集回應，存入 session
    ↓
顯示第二張卡片（名字）
    ↓
... 重複流程 ...
    ↓
收集完所有資料後調用 Creator API
    ↓
顯示最終結果
```

### 2. 標準五步驟資料收集
基於塔羅占卜需求設計的標準流程：

1. **firstName** - 名字
2. **lastName** - 姓氏  
3. **phoneNumber** - 電話號碼
4. **email** - 電子郵件
5. **dateOfBirth** - 出生日期
6. **timeOfBirth** - 出生時間
7. **userQuestion** - 占卜問題

## 💻 技術實作

### 1. Session 資料存取語法
```deluge
// 讀取 session 中的資料
firstName = "預設值";  // 設定預設值
if(session.get("firstName") != null && session.get("firstName").get("value") != null)
{
    firstName = session.get("firstName").get("value").toString();
}
```

### 2. 完整的參數收集模板
```deluge
// SalesIQ 插件：對話卡片資料收集模板

try
{
    // === 步驟 1：從對話卡片中收集用戶資料 ===
    
    // 姓名資料
    firstName = "測試";  // 預設值
    lastName = "王";     // 預設值
    if(session.get("firstName") != null && session.get("firstName").get("value") != null)
    {
        firstName = session.get("firstName").get("value").toString();
    }
    if(session.get("lastName") != null && session.get("lastName").get("value") != null)
    {
        lastName = session.get("lastName").get("value").toString();
    }
    
    // 聯絡資訊
    phoneNumber = "0912345678";  // 預設值
    email = "test@example.com";  // 預設值
    if(session.get("phoneNumber") != null && session.get("phoneNumber").get("value") != null)
    {
        phoneNumber = session.get("phoneNumber").get("value").toString();
    }
    if(session.get("email") != null && session.get("email").get("value") != null)
    {
        email = session.get("email").get("value").toString();
    }
    
    // 出生資料
    dateOfBirth = "1990-01-01";  // 預設值
    timeOfBirth = "12:00";       // 預設值
    if(session.get("dateOfBirth") != null && session.get("dateOfBirth").get("value") != null)
    {
        dateOfBirth = session.get("dateOfBirth").get("value").toString();
    }
    if(session.get("timeOfBirth") != null && session.get("timeOfBirth").get("value") != null)
    {
        timeOfBirth = session.get("timeOfBirth").get("value").toString();
    }
    
    // 問題內容
    userQuestion = "我想知道我的工作發展如何？";  // 預設值
    if(session.get("userQuestion") != null && session.get("userQuestion").get("value") != null)
    {
        userQuestion = session.get("userQuestion").get("value").toString();
    }
    
    // === 步驟 2：資料驗證 ===
    
    // 檢查必要欄位
    missing_fields = list();
    if(firstName == "測試") { missing_fields.add("名字"); }
    if(lastName == "王") { missing_fields.add("姓氏"); }
    if(userQuestion == "我想知道我的工作發展如何？") { missing_fields.add("問題"); }
    
    if(missing_fields.size() > 0)
    {
        // 還有資料未收集完成
        message = "請完成以下資訊的填寫：" + missing_fields.toString();
        status = "incomplete";
    }
    else
    {
        // 資料收集完成，可以調用 API
        // === 步驟 3：調用 Creator API ===
        
        publicKey = "your_public_key_here";
        apiUrl = "https://www.zohoapis.com/creator/custom/account/api?publickey=" + publicKey +
                 "&firstName=" + firstName + 
                 "&lastName=" + lastName + 
                 "&phoneNumber=" + phoneNumber + 
                 "&email=" + email + 
                 "&dateOfBirth=" + dateOfBirth + 
                 "&timeOfBirth=" + timeOfBirth + 
                 "&userQuestion=" + userQuestion;
        
        apiResponse = invokeurl
        [
            url: apiUrl
            type: GET
        ];
        
        // 處理 API 回應
        if(apiResponse != null && apiResponse.get("code") == 3000)
        {
            message = "占卜完成！";
            status = "completed";
        }
        else
        {
            message = "占卜過程遇到問題，請稍後再試";
            status = "error";
        }
    }
}
catch (error)
{
    message = "系統維護中，請稍後再試";
    status = "exception";
    info "插件執行錯誤：" + error.toString();
}

// 回傳結果
result = Map();
result.put("message", message);
result.put("status", status);
result.put("firstName", firstName);
result.put("lastName", lastName);

return result;
```

## 🎨 卡片設計最佳實踐

### 1. 卡片標題設計
```
✨ 塔羅占卜諮詢 ✨
🔮 第1步：請告訴我您的名字
```

### 2. 輸入提示設計
```
請輸入您的名字（例如：小明）
請輸入您的姓氏（例如：王）
請輸入您的手機號碼（例如：0912345678）
請輸入您的電子郵件（例如：example@gmail.com）
請輸入您的出生日期（例如：1990-01-01）
請輸入您的出生時間（例如：14:30）
請詳細描述您想要占卜的問題
```

### 3. 驗證提示設計
```
✅ 姓名：王小明
✅ 電話：0912345678
✅ 問題：我想知道工作發展

請確認以上資訊是否正確？
```

## 🔄 進階功能

### 1. 條件式問題設計
```deluge
// 根據問題類型決定是否需要額外資訊
questionType = classifyQuestion(userQuestion);
if(questionType == "愛情" || questionType == "婚姻")
{
    // 愛情類問題需要額外收集伴侶資訊
    partnerInfo = session.get("partnerBirthDate");
    if(partnerInfo == null)
    {
        // 需要收集伴侶生日
        needMoreInfo = true;
    }
}
```

### 2. 資料預處理
```deluge
// 出生日期格式標準化
if(dateOfBirth.contains("/"))
{
    dateOfBirth = dateOfBirth.replaceAll("/", "-");
}

// 電話號碼格式驗證
if(!phoneNumber.startsWith("09") || phoneNumber.length() != 10)
{
    // 電話格式錯誤，需要重新輸入
    phoneValid = false;
}
```

### 3. 錯誤恢復機制
```deluge
// 如果 API 調用失敗，保留用戶資料
if(apiCallFailed)
{
    // 將收集到的資料暫存
    session.put("backup_data", userData);
    
    // 提供重試選項
    message = "網路暫時不穩定，您的資料已保存。請點擊重試或稍後再來。";
}
```

## 📊 資料管理

### 1. Session 資料結構
```javascript
// SalesIQ Session 資料範例
{
    "firstName": {
        "value": "小明",
        "timestamp": "2024-01-21T10:30:00Z"
    },
    "lastName": {
        "value": "王",
        "timestamp": "2024-01-21T10:30:05Z"
    },
    "userQuestion": {
        "value": "我想知道我的工作發展如何？",
        "timestamp": "2024-01-21T10:32:00Z"
    }
}
```

### 2. 資料清理
```deluge
// 清理敏感資料（可選）
if(apiCallCompleted)
{
    // 清除 session 中的個人資料
    session.remove("phoneNumber");
    session.remove("email");
    session.remove("dateOfBirth");
    
    // 保留非敏感的互動資料
    session.put("lastServiceType", "tarot");
    session.put("lastServiceTime", zoho.currenttime);
}
```

## 🎯 實際應用案例

### 1. 塔羅占卜完整流程
```deluge
// 文件：SalesIQ/Plugins/CompleteTarotDivination_withCards.deluge
// 功能：完整的對話卡片式塔羅占卜服務

// 初始化
divinationResult = "占卜初始化中...";
divinationStatus = "initializing";

try
{
    // Creator API 設定
    publicKey = "TRKpveVeGqXq2jdeWM2EPFQ0K";
    
    // 從對話卡片收集資料
    firstName = collectFromSession("firstName", "測試");
    lastName = collectFromSession("lastName", "王");
    phoneNumber = collectFromSession("phoneNumber", "0912345678");
    email = collectFromSession("email", "test@example.com");
    dateOfBirth = collectFromSession("dateOfBirth", "1990-01-01");
    timeOfBirth = collectFromSession("timeOfBirth", "12:00");
    userQuestion = collectFromSession("userQuestion", "我想知道我的工作發展如何？");
    
    // 建立 API URL
    apiUrl = "https://www.zohoapis.com/creator/custom/uneedwind/CompleteTarotDivination?publickey=" + publicKey +
             "&firstName=" + firstName + 
             "&lastName=" + lastName + 
             "&phoneNumber=" + phoneNumber + 
             "&email=" + email + 
             "&dateOfBirth=" + dateOfBirth + 
             "&timeOfBirth=" + timeOfBirth + 
             "&userQuestion=" + userQuestion;
    
    // 調用 API
    apiResponse = invokeurl[url: apiUrl, type: GET];
    
    // 處理回應並格式化結果
    if(apiResponse != null && apiResponse.get("code") == 3000)
    {
        result = apiResponse.get("result");
        if(result.get("success") == true)
        {
            // 成功：格式化占卜結果
            message = result.get("message");
            divinationResult = formatTarotResult(message, firstName, lastName, userQuestion);
            divinationStatus = "completed";
        }
        else
        {
            // API 錯誤
            divinationResult = "占卜過程遇到問題，請稍後再試";
            divinationStatus = "api_error";
        }
    }
    else
    {
        // 連線錯誤
        divinationResult = "占卜系統暫時忙碌中，請稍後再試";
        divinationStatus = "connection_error";
    }
}
catch (error)
{
    // 系統錯誤
    divinationResult = "占卜系統維護中，請稍後再試";
    divinationStatus = "system_error";
}

// 回傳結果
result = Map();
result.put("message", divinationResult);
result.put("status", divinationStatus);
result.put("question", userQuestion);

return result;
```

## 🔧 除錯與測試

### 1. 調試技巧
```deluge
// 使用 info 語句追蹤資料流
info "=== 對話卡片資料收集 ===";
info "firstName from session: " + session.get("firstName");
info "最終使用的 firstName: " + firstName;
info "API URL: " + apiUrl;
info "API Response: " + apiResponse.toString();
```

### 2. 測試策略
1. **單步測試**：逐個測試每張卡片的資料收集
2. **整合測試**：測試完整的多步驟流程
3. **邊界測試**：測試異常輸入和錯誤情況
4. **性能測試**：測試大量用戶同時使用的情況

### 3. 常見問題排除
- **資料丟失**：檢查 session.get() 語法
- **格式錯誤**：檢查 toString() 轉換
- **API 失敗**：檢查 URL 編碼和參數格式
- **超時問題**：實作重試機制和錯誤恢復

---

**更新日期**：2025-01-21  
**版本**：1.0  
**適用範圍**：SalesIQ 對話機器人開發

> 💡 **最佳實踐**：對話卡片設計要考慮用戶體驗，每張卡片只收集一項核心資訊，避免用戶感到繁瑣。同時要實作完善的錯誤處理和資料恢復機制。
