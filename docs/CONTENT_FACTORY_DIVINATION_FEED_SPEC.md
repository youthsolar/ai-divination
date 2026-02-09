# 內容工廠 #4：占卜結果匿名化 → 改寫問題 → 社群貼文（Divination Feed）— Spec（v0）

> 目的：每天都有「免費占卜」與「付費數位符令」產出結果；挑選其中可公開的內容，做**匿名化**與**問題改寫**後，變成社群內容。
> 重要原則：
> - **隱私權保護優先**：隱藏本名/聯絡方式/可識別資訊，問題內容也要去敏。
> - **不改占卜規則**：只做包裝、匿名化、改寫與再敘事。
> - SSOT：內容素材與發布結果回寫 Zoho Creator（n8n CE log 只留 1 天）。

---

## A) Input
來源可能有兩種：
1) `Divination_Logs`（免費占卜記錄）
2) `Talisman_Purchases` + 對應占卜結果（付費符令）

建議 n8n → Creator Queue API payload：
```json
{
  "source": "divination_feed",
  "timezone": "Asia/Taipei",
  "recordType": "free_divination|paid_talisman",
  "recordId": "<Creator record id>",
  "divinationType": "iching|tarot",
  "raw": {
    "question": "<原始問題>",
    "answer": "<原始占卜結果/解讀>",
    "createdAt": "<ISO or local>"
  },
  "policy": {
    "removeNames": true,
    "removeContacts": true,
    "removeLocations": true,
    "rewriteQuestion": true
  },
  "channels": ["ig","threads","fb","linkedin"],
  "cta": "line_free_divination"
}
```

---

## B) Output
每筆來源記錄產出：
- `Content_Ideas` 一筆（Source_Type = `divination_feed`）
- `Content_Assets` 多筆（各平台文案）

平台輸出建議（可簡化先做 IG/Threads）：
- `ig`：hook + body + closing + hashtags
- `threads`：同 IG，但更像對話
- `fb/linkedin`：較長文版（Phase 2 再補）

---

## C) 匿名化 / 去敏規則（最小可行）
### C1) 必須移除
- 本名/暱稱（若會指向特定人）
- 電話/Email/地址/社群帳號/公司名（可識別資訊）
- 精準地點（例如某某公司/某間店名）
- 其他能指向特定個人的線索（例如車牌、身分證號）

### C2) 問題改寫（保留意圖，不保留細節）
- 把「人名」改成角色：對方/前任/主管/合作夥伴
- 把「事件細節」抽象化：關係發展、職涯選擇、金錢壓力、家庭界線
- 把「時間點」模糊化：最近/這段時間/接下來一兩週

---

## D) Pipeline（建議實作順序）
1) n8n：每日抓取可用素材（例如：昨天新增的 Divination_Logs / Paid 訂單）
2) n8n：挑選候選（例如：有代表性、無敏感、或先全入庫再人工挑）
3) Creator：Queue API 入庫（原文保留在 SSOT，但標記不可公開）
4) 產出匿名化版本 + 改寫問題 + 多平台文案（可先人工，Phase 2 再接 LLM）
5) 發布/排程 → PublishCallback 回寫

---

## E) Creator SSOT APIs（本 repo 會提供 stub）
- `API.QueueDivinationFeed_v1(map payload)`
  - Input：如上 payload
  - Output：`{ ok, idea_id, asset_ids, message }`

> 注意：此產生器涉及隱私風險，建議初期先「入庫 + 人工審核」再發布。
