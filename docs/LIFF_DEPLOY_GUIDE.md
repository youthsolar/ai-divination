# LIFF 部署指南

> 根據對話紀錄 [42cd2eec](42cd2eec-03c5-43ff-b78f-2056c74c3734)、[2b003f52](2b003f52-201f-4ee3-9639-c190aa1afb9c) 整理。

---

## 背景

- **Creator Published HTML Page 會過濾 `<script>`**，按鈕無法運作
- 解決方案：**GitHub Pages 靜態託管**（或 Zoho LandingPage，需實測）
- 之前曾用 `youthsolar/winds-liff` repo，現改為 **ai-divination 的 `liff/` 資料夾**

---

## 部署步驟（GitHub Pages）

### 步驟 1：設定 Git Remote 並 Push

本機 repo 目前沒有 remote，需先設定：

```bash
# 若 GitHub 上已有 ai-divination repo（請替換 <你的帳號>）
git remote add origin https://github.com/<你的帳號>/ai-divination.git

# Push
git push -u origin main
```

**若 GitHub 上還沒有 ai-divination：**
1. 到 https://github.com/new 建立新 repo，名稱 `ai-divination`
2. 不要勾選「Add a README」（避免衝突）
3. 建立後，執行上面的 `git remote add` 和 `git push`

---

### 步驟 2：啟用 GitHub Pages

1. 到 GitHub → **ai-divination** repo → **Settings** → **Pages**
2. **Source**：選 **Deploy from a branch**
3. **Branch**：選 `main`，資料夾選 **/ (root)** 或 **/liff**
   - 若選 **root**：LIFF 網址為 `https://<帳號>.github.io/ai-divination/liff/`
   - 若選 **/liff**：需在 repo 根目錄有 `liff` 資料夾，網址同上
4. 儲存後，等 1–2 分鐘部署完成

---

### 步驟 3：取得 LIFF 網址

部署完成後，LIFF 頁面網址為：

```
https://<你的GitHub帳號>.github.io/ai-divination/liff/
```

例如：`https://youthsolar.github.io/ai-divination/liff/`

> **注意**：GitHub Pages 從 root 部署時，`liff/index.html` 會對應到 `/liff/` 或 `/liff/index.html`，兩者皆可。

---

### 步驟 4：設定 LINE LIFF Endpoint URL

1. 到 [LINE Developers Console](https://developers.line.biz/console/)
2. 選你的 Channel → **LIFF** 分頁
3. 編輯現有 LIFF 或新增
4. **LIFF Endpoint URL** 填：`https://<帳號>.github.io/ai-divination/liff/`
5. 儲存

---

### 步驟 5：測試

1. 從 LINE 開啟 LIFF（可從 OA 選單或聊天中點連結）
2. 填寫生日、問題，點「送出占卜」
3. 確認有收到摘要、Creator 有紀錄

---

## 若 GitHub Pages 資料夾結構有問題

若選 root 部署但 `/liff/` 打不開，可改為：

- 把 `liff/index.html` 移到 repo **根目錄**，改名為 `index.html`
- 然後在 Pages 設定選 **/ (root)**
- 網址會變成：`https://<帳號>.github.io/ai-divination/`

或使用 **GitHub Actions** 部署，自訂輸出結構。

---

## 替代方案：Zoho LandingPage

若不想用 GitHub，可試 **Zoho LandingPage**（支援 Custom HTML/JS）：

1. 建立 LandingPage 頁面
2. 在 Custom HTML 區塊貼上 `liff/index.html` 的內容
3. 發佈後取得 URL
4. 將該 URL 設為 LIFF Endpoint URL

需實測：LIFF SDK、CORS、Creator API 是否都能正常運作。
