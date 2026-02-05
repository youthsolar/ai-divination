# Zoho Creator CLI — Runbook (Jeffery 回到本機後用)

> 目的：把 `repos/ai-divination/` 這個真源的變更送進 Zoho Creator。
> 注意：Zoho 的 Creator CLI/工具鏈在不同年代有不同指令（zc / zoho / appide / creator-cli）。
> 這份 runbook 先用「辨識 → 安裝 → OAuth → 部署」的穩健流程，避免裝錯工具。

---

## 0) 先確認你要 deploy 的內容
- 真源 repo：`~/.openclaw/workspace/repos/ai-divination`
- 本次已完成的變更：
  - `zoho-creator/functions/calendar/Calendar.normalizeTime.deluge`
  - `zoho-creator/apps/AI易經.ds`（節氣/月柱/年柱/農曆新年/子時換日一致化）

---

## 1) 辨識你機器上「Creator CLI」到底是哪一支
在 Terminal 跑：

```bash
command -v zc && zc --version
command -v zoho && zoho --version
command -v creator && creator --version
command -v appide && appide --version
command -v catalyst && catalyst --version
```

**判讀：**
- 有任何一條成功，就先記下「指令名稱 + version」，再往下走。
- 如果只有 `catalyst` 有，先不要假設它就是 Creator CLI（它比較像 Zoho Catalyst 的工具）。

---

## 2) 如果沒有 CLI：先安裝（保守流程）
因為 Zoho Creator CLI 的安裝方式可能是 npm/brew/官方安裝器，不同版本不同。

### 2.1 先檢查 Node/npm
```bash
node -v
npm -v
```

### 2.2 搜尋是否曾經裝過（避免重裝）
```bash
npm -g ls --depth=0 | grep -i zoho || true
brew list | grep -i zoho || true
```

### 2.3 你要用的 CLI 安裝來源
如果你有「官方文件連結」或你以前的安裝指令，把那行貼給 Pinni；由 Pinni 代你執行。

（我們這邊先不硬猜套件名，避免裝錯。）

---

## 3) OAuth / 登入授權（你需要親自點）
通常流程會像這些（依 CLI 而定）：
- `... login`
- `... auth`
- `... configure`

**原則：**
- 一旦 CLI 跳出 browser/OAuth，你用你的 Zoho 帳號登入並按同意。
- 登入後回到 Terminal，確認狀態：`... whoami` / `... status` / `... org:list`（依 CLI）

---

## 4) 建立/綁定專案（把本機真源對上 Creator App）
你需要知道：
- Zoho Creator 的 account / appLinkName（或 appId）
- 你要 deploy 到哪個環境（dev/prod）

常見 CLI 會有類似：
- `init`（在專案資料夾產生設定檔）
- `pull`（從 Creator 拉下來）
- `push/deploy`（把本機送上去）

**建議策略：**
1) 先在 `repos/ai-divination/` 下初始化（避免污染其他資料夾）
2) 先 pull 一次，確認 CLI 指向正確 app
3) 再 push/deploy

---

## 5) 部署前的最小安全檢查（強烈建議）
1) 確認沒有把金鑰寫進檔案（OpenAI/Zoho token 等）
```bash
grep -RInE "sk-proj-|Bearer |client_secret|refresh_token" zoho-creator apps docs || true
```
2) 確認 git 乾淨、變更可追蹤
```bash
cd ~/.openclaw/workspace/repos/ai-divination

git log -5 --oneline
```

---

## 6) 部署後驗證（本次變更的重點）
請測兩類邊界案例：
- **立春前後** + 23:xx（子時換日 + 年柱）
- **農曆新年前後** + 23:xx（生肖切換）

---

## 7) 如果你想要「我一鍵操作」
你回到本機後：
1) 你只要告訴我：Creator CLI 的指令叫什麼（zc/zoho/appide/…）
2) 我就能把這份 runbook 具體化成「你貼上就能跑」的指令清單

