# LINE OA + LIFF — MVP Runbook (符令占卜)

> Goal: 最快跑通「生日+問題 → 免費300字摘要 → 解鎖完整版/購買符令 → ECPay 成功 → 回推 LINE」。

## Decision lock (已定案)
- Entry: **LINE OA + LIFF**
- Form fields (v1): **生日(國曆) + 問題**（先不收姓名/性別/手機/Email）
- Paywall: **先免費摘要，再引導付費解鎖完整版/符令**
- Core compute: **Zoho Creator Deluge**

---

## 1) Components
1. **LIFF Frontend** (web app)
   - URL 必須是 https（LIFF URL）
   - UI: birthday + question + submit
2. **Backend API** (Zoho Creator)
   - New function: `API.LIFF_Divination_MVP`
   - Input: `lineUserId`, `birthday`, `question`
   - Output: `reading_id`, `summary_text(300字)`, `cooldown_until`, `next_action`
3. **LINE Messaging API**
   - Push message to user (summary + CTA buttons)
4. **ECPay**
   - Create order (已有：`API.CreateTalismanOrder_v2`)
   - Return/Callback (已有：`API.ECPayReturn`)

---

## 2) Minimal data contract (Creator → LIFF/LINE)
### Response JSON
```json
{
  "success": true,
  "reading_id": "1234567890",
  "summary_text": "...約300字...",
  "cooldown_until": "2026-02-24T00:00:00+08:00",
  "next_action": {
    "kind": "offer_unlock",
    "price": 360,
    "currency": "TWD",
    "cta_label": "解鎖完整版/購買符令"
  }
}
```

### Error JSON
```json
{ "success": false, "message": "冷卻中：請於 2026-02-24 之後再來" }
```

---

## 3) LINE message payload (example)
- Text 1: 300字摘要
- Text 2: CTA
  - Button: 「解鎖完整版 / 購買符令 NT$360」→ LIFF deep link or external pay URL
  - Button: 「查看上次結果」→ LIFF history page（v1 可先不做）

---

## 4) Open items (Jeffery will provide)
1. Creator app name + env
2. Form/API link names (`Divination_Logs` actual link name)
3. LIFF URL choice (pages.dev vs custom domain)
4. LINE Channel Access Token (Messaging API)

---

## 5) Implementation checklist
- [ ] Add `API.LIFF_Divination_MVP` to `zoho-creator/apps/AI易經.ds`
- [ ] Implement question hash + cooldown storage
- [ ] Create Divination_Logs record
- [ ] Generate 300字摘要
- [ ] Call `API.CreateTalismanOrder_v2` for order creation (when user clicks)
- [ ] Ensure `API.ECPayReturn` triggers LINE push success message
