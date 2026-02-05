# Zoho Creator：HTML Snippet 一直被當成 Deluge 的問題（調查紀錄＋臨時解法）

## 0) 目標

在 Zoho Creator → Page Builder → Snippets → HTML snippet 中，加入一個「生日＋時間」的前端選擇器（手機=原生滾輪、桌機=好填寫），之後再接 SalesIQ/Creator/CRM。

---

## 1) 現況（症狀）

- 進到 HTML snippet 編輯器後，畫面上方只有 Deluge（沒有切到「HTML」的 tab/下拉）。
- 只要把 `<div>…</div>` 這類純 HTML 貼進去，儲存時就報錯：

```
Error at line number: 1
Improper Statement
Error might be due to missing ';' at end of the line or incomplete expression
```

- 這明顯是 Deluge 編譯器 在解析 `<div>`，把它當成程式語法，導致「缺分號」錯誤。

**螢幕截圖要點**：左側出現 fetch records / update record / call function … 等 Deluge 積木；上方標示為「Deluge」。

---

## 2) 我們已嘗試過的作法

1. 在 Snippets 選「HTML snippet」，貼純 HTML → 一樣報 Deluge 錯。
2. 查官方文件（Understand HTML snippets）確認流程：Snippets → HTML snippet → Add HTML code → Save。理論上可直接貼 HTML，但實際介面只有 Deluge 分頁。
3. 嘗試把 `<script>` 拆走、只留 HTML → 仍報 Deluge 錯。
4. 檢查是否有切換 tab 的按鈕 → 當前環境看不到。

---

## 3) 合理推測（Root Cause）

- 這個 Creator 環境（或此 Page/此使用者角色）把 HTML snippet 視圖預設鎖在 Deluge 模式，導致前端標籤被 Deluge 解析。
- 也可能是 新版 UI/權限 導致「HTML/Deluge 切換鈕」沒有呈現。
- 不排除 瀏覽器快取/語言包差異 造成 UI element 未顯示。

---

## 4) 臨時可用的 3 種解法（我們現階段建議用 A 或 D）

### A) 用 Deluge 輸出 HTML（out.print(""" … """)）

在同一個「HTML snippet（Deluge 分頁）」中，把前端 HTML 當字串輸出（保證不被解析）

```deluge
out.print("""
<div style='max-width:320px;margin:20px auto;padding:12px;border:1px solid #ddd;border-radius:8px'>
  <h4 style='margin:0 0 10px;color:#BE6F80'>請選擇你的生日與時間</h4>

  <label style='display:block;margin:6px 0 4px'>生日（西曆）</label>
  <input id='birthDate' type='date' min='1900-01-01' max='2035-12-31'
         style='width:100%;padding:8px;border:1px solid #aaa;border-radius:6px'>

  <label style='display:block;margin:10px 0 4px'>出生時間（24小時制）</label>
  <input id='birthTime' type='time' step='300'
         style='width:100%;padding:8px;border:1px solid #aaa;border-radius:6px'>

  <button
    style='margin-top:12px;width:100%;padding:10px;background:#BE6F80;color:#fff;border:0;border-radius:6px'
    onclick=\"
      var d=document.getElementById('birthDate').value;
      var t=document.getElementById('birthTime').value;
      document.getElementById('msg').textContent = (d&&t)?('已選擇：'+d+' '+t):'請先選生日與時間';
    \">
    確認
  </button>

  <div id='msg' style='margin-top:8px;color:#474747'></div>
</div>
""");
```

**優點**：馬上可用；不需要切換 tab。  
**缺點**：HTML 需在字串裡維護（有跳脫字元）。

---

### B) 用 Widgets → HTML（如果你的版面有這個小工具）

- Page 左側選 Widgets → 拖 HTML → 貼純 HTML。
- 這條路一定是前端，不會被 Deluge 解析。
- 有些版型/方案不提供，若你找不到，就跳過。

---

### C) 用 Snippets → Embed + data: URL（次要）

- 把前端 HTML 轉成一段 `data:text/html;charset=utf-8,` 的 URL
- **缺點**：可維護性差、無法順利跑互動邏輯（不建議長期使用）

---

### D) 用 Client Script 渲染（推薦、乾淨）

1. 在 Page 放一個容器（HTML snippet 裡只寫一個占位 `<div id="birth-root"></div>`，一樣用 A 的 `out.print("""<div id='birth-root'></div>""");` 輸出就好）。
2. 在 Page → Client Script（前端 JS 專用的地方）寫程式，把 UI 動態插入：

```javascript
// Client Script（前端 JS）
(function(){
  var root = document.getElementById('birth-root');
  if(!root) return;
  root.innerHTML = `
    <div style="max-width:320px;margin:20px auto;padding:12px;border:1px solid #ddd;border-radius:8px">
      <h4 style="margin:0 0 10px;color:#BE6F80">請選擇你的生日與時間</h4>
      <label style="display:block;margin:6px 0 4px">生日（西曆）</label>
      <input id="birthDate" type="date" min="1900-01-01" max="2035-12-31" style="width:100%;padding:8px;border:1px solid #aaa;border-radius:6px">
      <label style="display:block;margin:10px 0 4px">出生時間（24小時制）</label>
      <input id="birthTime" type="time" step="300" style="width:100%;padding:8px;border:1px solid #aaa;border-radius:6px">
      <button id="birthSubmit" style="margin-top:12px;width:100%;padding:10px;background:#BE6F80;color:#fff;border:0;border-radius:6px">確認</button>
      <div id="msg" style="margin-top:8px;color:#474747"></div>
    </div>
  `;
  document.getElementById('birthSubmit').onclick = function(){
    var d = document.getElementById('birthDate').value;
    var t = document.getElementById('birthTime').value;
    document.getElementById('msg').textContent = (d && t) ? ('已選擇：'+d+' '+t) : '請先選生日與時間';
  };
})();
```

**優點**：HTML/JS 分離、可維護；不受 Deluge 編譯影響。  
**缺點**：需要切到 Page 的 Client Script 區（但 Creator 預設都有）。

---

## 5) 我們要做的 UI（之後要接 SalesIQ/CRM）

- **最小版**：`<input type="date">` + `<input type="time">`（行動端有原生滾輪）。
- **進階混合版**：
  - 手機 → 原生滾輪
  - 桌機 → 三下拉（年/月/日 + 時/分，含閏年與大小月）
- **送出後**：
  1. 呼叫 SalesIQ Web SDK，把 Birthday / BirthTime / Email / Phone 寫到訪客欄位
  2. 呼叫 Creator Function as API，以 Email/手機 Upsert 到 Zoho CRM

以上 UI 部分先用 A 或 D 把畫面跑起來；我們後續把 SalesIQ/CRM 邏輯補上。

---

## 6) 建議 Cursor 協助的兩條線

1. **短期**：採用 D. Client Script 渲染，把我們的混合版生日選擇器（含閏年/大小月）實作起來；同頁彈窗可一併完成。
2. **中長期**：
   - 釐清為何此環境的 HTML snippet 沒有「HTML/Deluge 切換」：
     - 版型/權限限制？
     - UI 語言包/瀏覽器相容性？
     - 舊版/新版差異？
   - 若能開啟 HTML 分頁，改回「純前端 snippet + Client Script」的標準維護方式。

---

## 7) 之後要接的 API（預告）

- **SalesIQ**：`$zoho.salesiq.visitor.set/info({ Birthday, BirthTime, Email, Phone })`
- **Creator Function**：`/api/v2/<owner>/<app>/functions/store_birthinfo/actions/execute`
- **CRM Upsert**：在 Function 裡 `zoho.crm.searchRecords` → `updateRecord/createRecord`（鍵＝Email/Phone）

---

## 8) 環境備註（供 Cursor 排查）

- **使用者角色**：App 擁有者（或高權限）
- **Page Builder**：Snippets → HTML snippet 可用，但編輯器只見 Deluge 分頁
- **左側可見 Deluge 積木**（fetch/update 等）
- **瀏覽器**：macOS（Safari/Chrome 皆見），語系：繁中

---

## ✅ **問題已解決！**

### **根本原因發現**
HTML Snippet 的 Deluge 分頁需要使用特殊的標籤語法：

```deluge
<%{%>
// 您的 Deluge 程式碼
out.print("HTML內容");
<%}%>
```

### **正確語法格式**
- **開始標籤**：`<%{%>`
- **結束標籤**：`<%}%>`
- **中間內容**：可以是標準 Deluge 程式碼 **或直接的 HTML**

### **重要發現：兩種寫法都可以**

**方法 1：使用 out.print() 包裝**
```deluge
<%{%>
out.print("""
<div>HTML內容</div>
""");
<%}%>
```

**方法 2：直接寫 HTML（更簡潔）**
```deluge
<%{%>
<div>HTML內容</div>
<%}%>
```

### **成功案例**
已成功建立 `Snippet/BirthDateTimeSelector.deluge`，實現完整的生日時間選擇器功能。

## 結論

- **問題核心**：缺少必要的 `<%{%>` 和 `<%}%>` 標籤包裝
- **解決方案**：使用正確的 Creator HTML Snippet 語法格式
- **技術突破**：現在可以在 Creator 中開發任何 HTML 介面組件

---

**狀態**：✅ **已解決**  
**解決日期**：2024-12-28  
**作者**：uneedwind & AI 助手  

> 💡 **重要發現**：Creator HTML Snippet 使用類似 JSP/ASP 的標籤語法，這是官方文件中未明確說明的關鍵技術細節。
