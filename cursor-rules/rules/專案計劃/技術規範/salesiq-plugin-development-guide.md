# SalesIQ 插件開發技術指南

## 📖 概述

本文件詳細記錄了 Zoho SalesIQ 插件的開發規範、語法限制和最佳實踐，基於實際開發經驗總結。

## 🎯 SalesIQ 插件核心特性

### 1. 插件執行環境
- SalesIQ 插件在獨立的 JavaScript V8 引擎中執行
- 整個 `.deluge` 腳本文件本身就是執行的主體
- **不需要**像 Creator Functions 那樣使用函數簽名包裝

### 2. 語法限制

#### ❌ 錯誤寫法（會導致語法錯誤）
```deluge
// 錯誤：在 SalesIQ 插件中使用函數簽名
void functionName()
{
    // 程式碼
}

// 錯誤：在 SalesIQ 插件中使用 Map 回傳簽名
map functionName()
{
    // 程式碼
}
```

#### ✅ 正確寫法
```deluge
// 正確：直接開始寫邏輯，無需函數包裝
// SalesIQ 插件參數會由系統自動注入，無需聲明

// 初始化變數
result = Map();
message = "處理中...";

try
{
    // 主要邏輯
    // ...
}
catch (error)
{
    // 錯誤處理
}

// 回傳結果
return result;
```

## 🔧 參數處理規範

### 1. 輸入參數命名規則
- **SalesIQ 插件參數必須全部小寫**
- 不能包含底線 `_` 或其他特殊字符
- 系統會自動注入參數變數，無需手動聲明

#### 參數命名對照表
| Creator API 參數 | SalesIQ 插件參數 | 說明 |
|-----------------|-----------------|------|
| `firstName` | `firstname` | 名字 |
| `lastName` | `lastname` | 姓氏 |
| `phoneNumber` | `phonenumber` | 電話 |
| `userQuestion` | `userquestion` | 用戶問題 |
| `dateOfBirth` | `dateofbirth` | 出生日期 |
| `timeOfBirth` | `timeofbirth` | 出生時間 |

### 2. 參數存取方式

#### ❌ 錯誤方式
```deluge
// 錯誤：SalesIQ 插件中沒有 input.get()
firstName = input.get("firstName");

// 錯誤：使用駝峰命名
lastName = lastName;  // Variable not defined 錯誤
```

#### ✅ 正確方式
```deluge
// 方法 1：直接使用（如果參數一定存在）
firstName = firstname;
lastName = lastname;

// 方法 2：安全檢查（推薦）
firstName = if(firstname != null, firstname, "預設值");
lastName = if(lastname != null, lastname, "預設值");

// 方法 3：固定值（測試階段）
firstName = "測試";
lastName = "王";
```

### 3. Session 資料存取（對話卡片）
```deluge
// 從對話卡片中取得資料
firstName = "預設值";
if(session.get("firstName") != null && session.get("firstName").get("value") != null)
{
    firstName = session.get("firstName").get("value").toString();
}
```

## 🌐 API 調用規範

### 1. Creator Custom API 整合

#### URL 格式
```deluge
// 正確的 Creator Custom API URL 格式
publicKey = "your_public_key_here";
apiUrl = "https://www.zohoapis.com/creator/custom/account_name/api_name?publickey=" + publicKey;
```

#### API 調用方式
```deluge
// GET 方法（推薦）
apiResponse = invokeurl
[
    url: apiUrl
    type: GET
];

// POST 方法（如果需要）
apiResponse = invokeurl
[
    url: apiUrl
    type: POST
    parameters: postData
];
```

### 2. 回應處理
```deluge
// 檢查 API 回應狀態
if(apiResponse != null && apiResponse.get("code") == 3000)
{
    result = apiResponse.get("result");
    // 處理成功回應
}
else
{
    // 處理錯誤回應
    errorMessage = "API 調用失敗";
}
```

## 📤 輸出參數規範

### 1. 輸出參數類型限制
- **僅支援 String 類型**
- Boolean 和 Number 類型會導致錯誤
- 所有輸出都必須轉換為字符串

#### ❌ 錯誤設定
```
參數名稱：success
類型：Boolean  // 不支援！
```

#### ✅ 正確設定
```
參數名稱：success
類型：String
可能值："true" 或 "false"
```

### 2. 輸出格式化
```deluge
// 確保所有輸出都是字符串
result = Map();
result.put("message", divinationResult);
result.put("success", "true");  // 字符串，不是布林值
result.put("divinationId", if(newDivinationId != null, newDivinationId.toString(), ""));
result.put("status", divinationStatus);

return result;
```

## 🛠️ 常見問題與解決方案

### 1. 變數未定義錯誤
**問題**：`Variable 'xxx' is not defined`

**解決方案**：
```deluge
// 使用安全初始化
paramValue = if(paramname != null, paramname, "預設值");

// 或使用固定值（測試階段）
paramValue = "測試值";
```

### 2. 輸出參數類型錯誤
**問題**：`Invalid value is found in the response`

**解決方案**：
```deluge
// 確保所有輸出都轉換為字符串
result.put("divinationId", divination_id.toString());
result.put("success", if(isSuccess, "true", "false"));
```

### 3. API 調用失敗
**問題**：無法連接 Creator API

**檢查清單**：
- [ ] Public Key 是否正確
- [ ] API 端點 URL 是否正確
- [ ] Creator API 是否設為 Public Key 認證
- [ ] 參數格式是否正確

## 📝 開發最佳實踐

### 1. 插件結構模板
```deluge
// SalesIQ 插件標準結構模板

// 初始化回傳變數
result_message = "初始化中...";
status = "initializing";

try
{
    // 步驟 1：參數處理
    param1 = if(param1name != null, param1name, "預設值");
    param2 = if(param2name != null, param2name, "預設值");
    
    // 步驟 2：API 調用
    publicKey = "your_public_key";
    apiUrl = "https://www.zohoapis.com/creator/custom/account/api?publickey=" + publicKey;
    
    apiResponse = invokeurl
    [
        url: apiUrl
        type: GET
    ];
    
    // 步驟 3：回應處理
    if(apiResponse != null && apiResponse.get("code") == 3000)
    {
        // 成功處理
        result_message = "處理成功";
        status = "completed";
    }
    else
    {
        // 錯誤處理
        result_message = "處理失敗";
        status = "error";
    }
}
catch (error)
{
    // 異常處理
    result_message = "系統錯誤：" + error.toString();
    status = "exception";
}

// 回傳結果
result = Map();
result.put("message", result_message);
result.put("status", status);

return result;
```

### 2. 調試技巧
```deluge
// 使用 info 語句進行調試
info "插件開始執行";
info "參數值：" + param1;
info "API 回應：" + apiResponse.toString();
info "插件執行完成";
```

### 3. 錯誤處理模式
```deluge
try
{
    // 主要邏輯
}
catch (error)
{
    // 記錄錯誤但不中斷用戶體驗
    error_message = error.toString();
    info "插件執行錯誤：" + error_message;
    
    // 提供友善的錯誤訊息給用戶
    result_message = "系統維護中，請稍後再試";
    status = "maintenance";
}
```

## 🔗 對話卡片整合

### 1. Session 資料結構
```deluge
// SalesIQ 對話卡片資料格式
session_value = session.get("fieldName");
if(session_value != null && session_value.get("value") != null)
{
    actual_value = session_value.get("value").toString();
}
```

### 2. 多步驟對話流程
```deluge
// 檢查對話階段
current_step = session.get("step");
if(current_step == null)
{
    // 第一次對話
    message = "請提供您的姓名";
}
else
{
    // 後續對話
    step_number = current_step.get("value");
    // 根據步驟處理不同邏輯
}
```

## 🔄 Zia Skills 與 Zobot 混合架構

### 1. 混合模式的技術優勢

#### 為什麼需要混合架構？
- **Zobot**：適合文字對話、基本資料收集
- **Zia Skills**：擅長複雜 UI 元件（Calendar、選擇器等）
- **混合使用**：發揮兩種模式的各自優勢

#### 典型混合場景
```
步驟1-2：Zobot 收集姓名
    ↓
步驟3：切換到 Zia Skills Calendar 收集生日 🎯
    ↓
步驟4-5：返回 Zobot 收集電話、Email
    ↓
完成：顯示資料摘要
```

### 2. Zia Skills Calendar 小工具

#### 核心優勢
- ✅ **跨裝置友善**：原生 Calendar 介面，自動適配手機/桌面
- ✅ **時區支援**：自動偵測用戶時區
- ✅ **日期範圍控制**：可設定可選擇的年份範圍
- ✅ **時間選擇**：支援精確到分鐘的時間選擇
- ✅ **用戶體驗佳**：視覺化選擇，避免手動輸入錯誤

#### 技術實作
```deluge
// Zia Skills Context Handler
result = Map();
response = Map();
response.put("action", "reply");
response.put("replies", ["請選擇您的出生日期和時間"]);
response.put("input", {
    "type": "calendar",
    "time": true,           // 啟用時間選擇
    "tz": true,             // 啟用時區選擇
    "from": "-30000",       // 從1940年開始（約30000天前）
    "to": "-5475",          // 到15年前（約5475天前）
    "label": "請選擇您的出生日期和時間",
    "select_label": "確認生日時間"
});
prompt = Map();
prompt.put("param_name", "birthDateTime");
prompt.put("data", response);
result.put("prompt", prompt);
result.put("todo", "prompt");
return result;
```

### 3. 混合架構實作模式

#### 模式 A：插件調用模式
```deluge
// 主對話插件
if(current_step == "birthday_collection")
{
    // 調用專門的 Zia Skills 插件
    birthday_response = invokeBirthdayCollector();
    return birthday_response;
}
else
{
    // 繼續 Zobot 對話流程
    return conversation_card_response;
}
```

#### 模式 B：內嵌切換模式
```deluge
// 在同一個插件內切換模式
if(collection_type == "calendar")
{
    // 直接返回 Zia Skills Calendar 格式
    return calendar_widget_response;
}
else
{
    // 返回標準 Zobot 對話卡片格式
    return conversation_card_response;
}
```

### 4. 資料流程管理

#### Session 資料統一管理
```deluge
// 設定步驟追蹤
session.put("data_collection_step", {"value": current_step});

// 設定完成標記
session.put("birth_collection_completed", {"value": true});

// 統一格式存儲
session.put("collected_birth_datetime", {"value": "1990-05-15 14:30"});
session.put("dateOfBirth", {"value": "1990-05-15"});
session.put("timeOfBirth", {"value": "14:30"});
```

#### 跨插件資料傳遞
- 使用 `session` 作為資料暫存空間
- 設定明確的完成標記
- 統一的資料格式和命名規範

### 5. 錯誤處理與降級方案

#### Calendar 小工具失效時的降級策略
```deluge
try
{
    // 嘗試使用 Calendar 小工具
    return calendar_response;
}
catch (error)
{
    // 降級到文字輸入模式
    response.put("action", "reply");
    response.put("replies", [
        "❌ 日曆介面暫時無法使用，請手動輸入：",
        "📅 請輸入出生日期（格式：1990-01-01）：",
        "⏰ 請輸入出生時間（格式：14:30）："
    ]);
    return response;
}
```

### 6. 完整混合流程範例

#### 智慧資料收集器架構
```deluge
// SmartDataCollector.deluge - 混合模式資料收集
current_step = getCurrentCollectionStep();

if(!has_name && current_step <= 2)
{
    // Zobot 模式：收集姓名
    return collectNameWithConversationCard();
}
else if(!has_birthday && current_step == 3)
{
    // Zia Skills 模式：Calendar 小工具 🎯
    return showCalendarWidget();
}
else if(!has_contact && current_step <= 5)
{
    // Zobot 模式：收集聯絡資訊
    return collectContactWithConversationCard();
}
else
{
    // 完成：顯示摘要並進入下一階段
    return showDataSummaryAndProceed();
}
```

## 📝 函數命名與註解規範

### 1. SalesIQ 插件函數規範

#### 函數名稱
- **必須使用駝峰命名**：`dynamicTarotWelcome`、`sendSmsOtp`
- **避免底線**：❌ `send_sms_otp` ✅ `sendSmsOtp`
- **描述性命名**：能清楚表達函數功能

#### 註解格式
```deluge
// =============================================================================
// 函數名稱：DynamicTarotWelcome
// 函數用途：動態本命塔羅歡迎顯示 - 根據訪客身份顯示不同塔羅牌
// 平台：SalesIQ 插件
// 
// 功能描述：
// - 回頭客：顯示其個人本命塔羅（基於生日計算）
// - 新訪客：顯示當下時間的本命塔羅（每時每刻都不同）
// 
// 觸發方式：插件被調用時（可設為自動觸發或按鈕觸發）
// =============================================================================

// 插件主邏輯開始...
response = Map();
```

### 2. Creator 函數規範

#### ⚠️ 重要限制
- **第一行必須是函數宣告**：不能有任何註解
- **註解必須在大括號內部**：函數體開始後才能加註解

#### 正確格式
```deluge
map API.queryExistingClient(string salesiqVisitorId, string email, string phone)
{
    // =============================================================================
    // 函數名稱：queryExistingClient
    // 函數用途：查詢現有客戶資料 - 支援SalesIQ動態塔羅歡迎功能
    // 平台：Zoho Creator Custom API
    // 命名空間：API
    // 
    // 參數說明：
    // @param salesiqVisitorId (string) - SalesIQ訪客唯一識別碼
    // @param email (string) - 客戶電子郵件地址
    // @param phone (string) - 客戶手機號碼
    // 
    // 回傳格式：
    // @return (map) - 包含客戶資料和查詢狀態的Map物件
    // =============================================================================
    
    // 函數邏輯開始...
    api_result = Map();
}
```

#### 錯誤格式（會導致編譯錯誤）
```deluge
// ❌ 錯誤：第一行不能有註解
// 函數名稱：queryExistingClient
map API.queryExistingClient(string salesiqVisitorId, string email, string phone)
{
    // 邏輯...
}
```

### 3. 函數註解必須包含的資訊

#### 必要資訊
- **函數名稱**：完整的函數名稱，方便複製貼上
- **函數用途**：簡潔的功能描述，用於 Creator/SalesIQ 建立函數時填寫
- **平台說明**：Zoho Creator Custom API / SalesIQ 插件
- **命名空間**：如 `API`、`Tarot` 等

#### 可選資訊
- **功能描述**：詳細的功能說明
- **參數說明**：每個參數的類型和用途
- **回傳格式**：回傳值的結構說明
- **觸發方式**：如何調用或觸發
- **相依性**：需要的其他函數或 API

### 4. 複製貼上操作指南

#### SalesIQ 插件建立
1. **函數名稱**：從註解中的「函數名稱」複製
2. **函數描述**：從註解中的「函數用途」複製
3. **程式碼**：複製整個檔案內容

#### Creator 函數建立
1. **函數名稱**：從註解中的「函數名稱」複製
2. **函數描述**：從註解中的「函數用途」複製
3. **命名空間**：從註解中的「命名空間」複製
4. **程式碼**：複製整個函數（包含簽名和函數體）

## 📚 版本兼容性

### 支援的 Deluge 功能
- ✅ 基本變數操作
- ✅ Map 和 List 資料結構
- ✅ if-else 條件判斷
- ✅ for each 迴圈
- ✅ try-catch 錯誤處理
- ✅ invokeurl API 調用
- ✅ 字符串操作函數

### 不支援的功能
- ❌ 函數定義 (void, map)
- ❌ namespace 相關功能
- ❌ 某些 Creator 特定函數
- ❌ 複雜的物件操作

## 🔧 故障排除指南

### 常見錯誤代碼
| 錯誤類型 | 症狀 | 解決方案 |
|---------|------|---------|
| 語法錯誤 | `Syntax error. Found 'Map'` | 移除函數簽名，直接寫邏輯 |
| 變數錯誤 | `Variable 'xxx' is not defined` | 使用安全初始化或固定值 |
| 類型錯誤 | `Invalid value in response` | 確保輸出都是字符串 |
| API 錯誤 | 調用失敗 | 檢查 Public Key 和端點 |

### 調試步驟
1. **檢查插件語法**：確保沒有函數簽名
2. **驗證參數名稱**：確保全小寫，無特殊字符
3. **測試 API 連接**：使用固定值測試
4. **檢查輸出格式**：確保都是字符串類型
5. **查看執行日誌**：使用 info 語句調試

---

**更新日期**：2025-01-21  
**版本**：2.0  
**維護者**：AI Assistant

> 💡 **重要提醒**：SalesIQ 插件開發與 Creator Functions 有根本性差異，請務必遵循本指南的語法規範，避免常見陷阱。
