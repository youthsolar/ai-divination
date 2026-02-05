# Creator 函數開發技術指南

## 📖 概述

本文件專門記錄 Zoho Creator 函數的開發規範，包括命名規則、註解格式、複製貼上操作指南等，確保函數開發的一致性和維護性。

## 🎯 核心規則

### ⚠️ 最重要的限制
- **第一行必須是函數宣告**：絕對不能有任何註解或空白行
- **註解必須在大括號內部**：函數體開始後才能加註解
- **採用駝峰命名**：函數名稱必須使用 camelCase 格式

## 📝 函數命名規範

### 1. 命名規則

#### ✅ 正確命名
```deluge
// API 函數
map API.queryExistingClient(...)
map API.createClientProfile(...)
map API.calculateLifePathTarot(...)

// 業務邏輯函數
map Tarot.getLifePathTarot(...)
map Bazi.calculatePreciseDayPillar(...)
map LunarAI.convertToBaZi(...)
```

#### ❌ 錯誤命名
```deluge
// 底線命名（不推薦）
map API.query_existing_client(...)
map create_client_profile(...)

// 全小寫（不推薦）
map queryexistingclient(...)

// 全大寫（不推薦）
map QUERYEXISTINGCLIENT(...)
```

### 2. 命名空間使用

#### 推薦的命名空間
- **API**：對外提供的 Custom API 函數
- **Tarot**：塔羅相關業務邏輯
- **Bazi**：八字命理相關函數
- **LunarAI**：農曆和AI相關函數
- **Zodiac**：星座和太歲相關函數

## 💬 註解格式規範

### 1. 標準註解模板

```deluge
map API.functionName(string param1, string param2)
{
    // =============================================================================
    // 函數名稱：functionName
    // 函數用途：簡潔的功能描述 - 用於建立函數時填寫
    // 平台：Zoho Creator Custom API
    // 命名空間：API
    // 
    // 功能描述：
    // - 詳細功能說明第一點
    // - 詳細功能說明第二點
    // - 詳細功能說明第三點
    // 
    // 參數說明：
    // @param param1 (string) - 參數一的說明
    // @param param2 (string) - 參數二的說明
    // 
    // 回傳格式：
    // @return (map) - 回傳值的結構說明
    // 
    // 相依性：
    // - 需要的其他函數或表單
    // - 外部 API 或服務
    // =============================================================================
    
    // 函數邏輯開始
    result = Map();
    // ...
    return result;
}
```

### 2. 註解內容要求

#### 必要資訊
- **函數名稱**：完整函數名稱（不含命名空間）
- **函數用途**：一句話描述，用於 Creator 建立函數時填寫
- **平台**：Zoho Creator Custom API / Zoho Creator Function
- **命名空間**：函數所屬的命名空間

#### 推薦資訊
- **功能描述**：詳細的功能說明（條列式）
- **參數說明**：每個參數的類型和用途
- **回傳格式**：回傳值的結構和內容
- **相依性**：需要的其他資源

#### 可選資訊
- **版本資訊**：函數版本和更新日期
- **作者資訊**：開發者標識
- **使用範例**：如何調用此函數
- **注意事項**：特殊限制或警告

## 🏗️ 表單與報告開發實踐

### 1. AppIDE 表單腳本修改規則 (Zia -> IDE -> Cursor -> IDE 流程)

#### ⚠️ 禁止在腳本中變更或刪除欄位 API Name

當一個表單已經透過 Zia 或圖形化介面建立後，其欄位的 API Name (Field Link Name) 就已經被鎖定。在 AppIDE 中，試圖透過修改 `.deluge` 腳本來變更一個已存在欄位的 API Name，會被系統解讀為「刪除舊欄位」並「建立新欄位」，這將會觸發以下錯誤：

> **`Error: Field deletion is not permitted in the AppIDE.`**

這是為了保護現有資料不被意外刪除的系統級限制。

#### ✅ 正確的欄位 API Name 修改流程

1.  **建立表單**：使用 Zia 或圖形化介面建立表單。
2.  **手動修改 API Name**：在建立表單**之後**，立即進入表單編輯器的圖形化介面，逐一修改每個欄位的「屬性 (Properties)」中的「欄位連結名稱 (Field Link Name)」，使其符合 `camelCase` 命名規範。**這是唯一推薦的修改時機**。
3.  **使用腳本更新**：完成 API Name 的手動修改後，才可以使用 AppIDE 腳本來安全地修改其他屬性，例如 `displayname` (顯示名稱)、`values` (選項列表) 等。

#### 💡 總結工作流程

`Zia 建立表單` -> `手動進入 UI 修改 API Name` -> `使用 IDE/Cursor 修改顯示名稱等其他屬性` -> `貼回 IDE`

### 2. 函數結構

#### 標準結構
```deluge
map Namespace.functionName(parameter_type parameter_name)
{
    // 標準註解區塊
    // ...
    
    // 採用單一出口模式
    result = Map();
    
    try
    {
        // 步驟 1：參數驗證
        if(parameter_name == null || parameter_name == "")
        {
            result.put("success", false);
            result.put("error", "參數不能為空");
            return result;
        }
        
        // 步驟 2：主要邏輯
        // ...
        
        // 步驟 3：成功回傳
        result.put("success", true);
        result.put("data", processed_data);
    }
    catch (error)
    {
        // 錯誤處理
        result.put("success", false);
        result.put("error", "執行錯誤：" + error.toString());
        info "函數執行錯誤：" + error.toString();
    }
    
    return result;
}
```

### 2. 參數類型規範

#### 支援的參數類型
```deluge
// 字串類型
string firstName, string email

// 數字類型  
int count, decimal amount

// 日期類型
date birthDate, datetime preciseTime

// 布林類型（注意：Creator中是boolean）
boolean isActive
```

### 3. 錯誤處理模式

#### 統一錯誤格式
```deluge
// 成功回傳
result.put("success", true);
result.put("message", "操作成功");
result.put("data", actual_data);

// 錯誤回傳
result.put("success", false);
result.put("error", "具體錯誤描述");
result.put("error_code", "ERROR_CODE");
```

## 📋 複製貼上操作指南

### 1. Creator Custom API 建立步驟

#### 步驟 1：準備資訊
從函數註解中提取以下資訊：
- **函數名稱**：`queryExistingClient`
- **函數用途**：`查詢現有客戶資料 - 支援SalesIQ動態塔羅歡迎功能`
- **命名空間**：`API`

#### 步驟 2：建立 Custom API
1. 進入 **Creator 後台** → **設定** → **開發者空間** → **API**
2. 點擊 **建立 Custom API**
3. **API 名稱**：填入「函數名稱」（如：`queryExistingClient`）
4. **API 描述**：填入「函數用途」
5. **方法**：選擇 `GET` 或 `POST`
6. **認證**：選擇 `Public Key`

#### 步驟 3：貼上程式碼
1. 在程式碼編輯器中，完整貼上整個函數
2. 檢查語法無誤
3. 儲存並測試

### 2. Creator Function 建立步驟

#### 步驟 1：建立函數
1. 進入 **Creator 後台** → **設定** → **函數**
2. 點擊 **建立函數**
3. **函數名稱**：填入「命名空間.函數名稱」（如：`API.queryExistingClient`）
4. **函數描述**：填入「函數用途」

#### 步驟 2：設定參數
根據函數簽名設定參數：
```deluge
map API.queryExistingClient(string salesiqVisitorId, string email, string phone)
```
- 參數 1：`salesiqVisitorId` (Text)
- 參數 2：`email` (Text)  
- 參數 3：`phone` (Text)

#### 步驟 3：貼上程式碼
貼上完整的函數內容，確保第一行是函數宣告。

## ⚠️ 常見錯誤與解決方案

### 1. 語法錯誤

#### 錯誤：第一行有註解
```deluge
❌ 錯誤寫法：
// 函數說明
map API.functionName(...)
{
    // ...
}
```

```deluge
✅ 正確寫法：
map API.functionName(...)
{
    // 函數說明
    // ...
}
```

#### 錯誤：命名不一致
```deluge
❌ 錯誤：函數名稱與檔案名稱不一致
檔案名稱：queryExistingClient.deluge
函數宣告：map API.queryClient(...)
```

```deluge
✅ 正確：函數名稱與檔案名稱一致
檔案名稱：queryExistingClient.deluge
函數宣告：map API.queryExistingClient(...)
```

### 2. 部署錯誤

#### Public Key 設定
- Custom API 需要在 Creator 後台生成 Public Key
- 在 SalesIQ 插件中正確引用 Public Key
- 確保 API 權限設定正確

#### 函數調用錯誤
```deluge
❌ 錯誤的 URL 格式：
https://creator.zoho.com/api/queryExistingClient

✅ 正確的 URL 格式：
https://www.zohoapis.com/creator/custom/account_name/queryExistingClient?publickey=xxx
```

## 🔍 除錯技巧

### 1. 使用 info 語句
```deluge
// 在關鍵位置加入除錯資訊
info "=== 函數開始執行 ===";
info "接收參數：" + param1;
info "處理結果：" + result.toString();
info "=== 函數執行完成 ===";
```

### 2. 分段測試
```deluge
// 分段驗證邏輯
result.put("debug_step1", "參數驗證完成");
result.put("debug_step2", "資料查詢完成");  
result.put("debug_step3", "結果處理完成");
```

### 3. 錯誤回報
```deluge
catch (error)
{
    // 詳細的錯誤資訊
    result.put("error_detail", error.toString());
    result.put("error_location", "函數名稱 - 步驟描述");
    result.put("input_params", Map()); // 輸入參數快照
}
```

---

## 📚 參考範例

### 完整函數範例

```deluge
map API.calculateLifePathTarot(string targetDate)
{
    // =============================================================================
    // 函數名稱：calculateLifePathTarot
    // 函數用途：計算指定日期的本命塔羅 - 支援SalesIQ動態塔羅歡迎功能
    // 平台：Zoho Creator Custom API
    // 命名空間：API
    // 
    // 功能描述：
    // - 根據指定的日期時間計算對應的本命塔羅牌
    // - 回頭客：使用其生日計算個人本命塔羅
    // - 新訪客：使用當前時間計算即時塔羅
    // - 回傳完整的塔羅牌資訊和圖片URL
    // 
    // 參數說明：
    // @param targetDate (string) - 目標日期時間字串 (yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss)
    // 
    // 回傳格式：
    // @return (map) - 包含塔羅牌詳細資訊的Map物件
    // =============================================================================
    
    api_result = Map();
    
    try
    {
        // 主要邏輯...
        api_result.put("success", true);
    }
    catch (error)
    {
        api_result.put("success", false);
        api_result.put("error", error.toString());
    }
    
    return api_result;
}
```

---

**更新日期**：2025-01-21  
**版本**：1.0  
**適用範圍**：Zoho Creator 函數開發

> 💡 **重要提醒**：Creator 函數的第一行絕對不能有註解，這是平台的硬性限制。所有註解必須放在函數體內部的大括號之後。
