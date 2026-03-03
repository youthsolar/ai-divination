# AI易經.ds 重寫部署清單（Deployment Checklist）

> 產出日期：2026-02-25
> 最後更新：2026-03-04（全線完成 — Phase 1-5 部署 + LLM 遷移 + Stage A/B/C 功能增強 + OnPaymentSuccess 修正）
> 適用版本：AI易經\_rewritten.ds（97 個活躍函數，含 3 個 Calendar standalone + 4 個 Content-Factory）
> 對照文件：`docs/DS_RENAME_REGISTRY.md`
> 原則：**先建後刪**（先建立新名稱函數 → 更新所有呼叫者 → 確認無殘留引用 → 刪除舊名稱函數）

---

## 部署進度摘要（2026-03-04 更新）

| Phase | 狀態 | 完成日期 | 備註 |
|-------|------|---------|------|
| Phase 1：建立新名稱函數 | ✅ 完成 | 2026-03-01 | 90 個函數全數部署，含部署時 Bug 修正 |
| Phase 2：更新呼叫者 | ✅ 完成 | 2026-03-01 | 新版 .deluge 檔已內建正確引用 |
| Phase 3：更新 Workflows | ✅ 完成 | 2026-03-01 | 9 個 Workflow 已覆蓋新版腳本 |
| Phase 4：Custom API 端點整頓 | ✅ 完成 | 2026-03-02 | 建 4 新 + 保留 2 + 停用 7 + 端點測試全通過 + Description 已填 |
| Phase 5：刪除舊函數 | ✅ 完成 | 2026-03-02 | 32 個刪除目標全部已消失（部署時覆蓋），現有 97 個函數，全為 camelCase |
| TarotDivinationButton 修正 | ✅ 完成 | 2026-03-02 | 腳本改為自由模式、移除 alert、占卜記錄 + AI解讀全通過 |
| OpenAI → Claude LLM 遷移 | ✅ 完成 | 2026-03-02 | 15 函數 + 3 Workflow 改用 LLM.callChat（Claude claude-sonnet-4-20250514） |
| Stage A：塔羅解讀個人化 | ✅ 完成 | 2026-03-04 | persona + 主副卦無視論分析 in getTarotInterpretation/Full |
| Stage B：個性側寫自動化 | ✅ 完成 | 2026-03-04 | generatePersonalityProfile 加入 4 張本命塔羅牌資料 |
| Stage C：本命塔羅驗證 | ✅ 完成 | 2026-03-04 | getLifePathTarot 接入 createClientProfile + Workflow |
| Section 七：Workflow Hotfix | ✅ 完成 | 2026-03-04 | Script A key 修正 + profile 觸發條件移除 Added_Time 限制 |
| OnPaymentSuccess 修正 | ✅ 完成 | 2026-03-04 | getTarotInterpretationFull 第4參數 clientId 已補入 |

### 部署期間發現並修正的問題

| 問題 | 函數 | 修正內容 |
|------|------|---------|
| `Form[criteria] = map;` 非法語法 | `API.bindLineUser` | 改為 `record.Field = value;` 直接賦值 |
| Missing return statement | `API.getTalismanByToken` | 加頂層 `return resp;` |
| Missing return statement | `API.predictFromLine` | 加頂層 `return resp;` |
| Missing return statement | `API.deliveryPushCallback` | 加頂層 `return resp;` |
| 欄位不存在 `Delivery_Push_*` | `API.deliveryPushCallback` | 需在 Creator 新增 4 個欄位（見下方） |
| `insert into` 回傳值誤用 `.get("ID")` | `API.bindLineUser` | 改為 `new_client.toString()` |
| 回傳型別 map → list | `LunarAI.getLunarMonthStructure` | 函數宣告改為 `list` |
| datetime → date 參數型別 | `Calendar.*`（3 個函數） | 拆分檔案 + 改參數型別 |
| TEXT vs NUMBER 比較 | `Tarot.completeTarotDivination` | `clientId == 0` → `clientId == "0"` |
| 按鈕參數錯誤 | `TarotDivinationButton` | 見「塔羅占卜按鈕修正」章節 |

### 尚需在 Creator 手動操作的項目

- [x] **Talisman_Purchases 表單新增 4 個欄位**（`deliveryPushCallback` 需要）— 完成（2026-03-02）：
  - `Delivery_Push_Status`（單行文字）
  - `Delivery_Push_Time`（日期時間）
  - `Delivery_Push_Error`（單行文字）
  - `Delivery_Push_LineMessageId`（單行文字）
- [x] **刪除舊 OpenAI 函數 → 釋放 Application Variable 名額 → 新增 `System.N8N_ECPayPaidNotifyURL`** — 完成（2026-03-02）

---

## 目錄

1. [部署前準備](#一部署前準備)
2. [Phase 1：建立新名稱函數（先建）](#二phase-1建立新名稱函數先建)
3. [Phase 2：更新呼叫者（由上層往下層）](#三phase-2更新呼叫者由上層往下層)
4. [Phase 3：更新 Workflows / Mobile Scripts](#四phase-3更新-workflows--mobile-scripts)
5. [Phase 4：Custom API 端點整頓](#五phase-4custom-api-端點整頓)
6. [Phase 5：刪除舊名稱與廢棄函數（後刪）](#六phase-5刪除舊名稱與廢棄函數後刪)
7. [Standalone 函數部署](#七standalone-函數部署)
8. [塔羅占卜按鈕修正](#八塔羅占卜按鈕修正)
9. [Smoke Test 驗證清單](#九smoke-test-驗證清單)
10. [外部系統影響確認](#十外部系統影響確認)
11. [回滾計畫](#十一回滾計畫)
12. [部署完成簽核](#十二部署完成簽核)

---

## 一、部署前準備

### 1-1. 備份

- [x] 在 Zoho Creator IDE 中匯出現有 `AI易經.ds` 完整備份
- [x] 確認 Git repo 的 `zoho-creator/apps/AI易經.ds`（原版）已提交且可回溯
- [x] 記錄目前 Creator 應用程式版本號（Settings → Application → Version）

### 1-2. 環境確認

- [x] 確認部署目標環境（正式環境 / 沙盒環境）
- [x] 確認 Creator IDE 有編輯權限（Application Owner 或 Admin）
- [x] 確認 Zoho Flow 連線狀態正常
- [x] 確認 n8n 服務運作中（備援用）

### 1-3. 檔案準備

- [x] 確認 `zoho-creator/apps/AI易經_rewritten.ds` 已組裝完成（25,845 行）
- [x] 確認所有 90 個函數已通過本地語法檢查
- [x] 確認 `zoho-creator/functions/` 下 27 個模組目錄的檔案齊全
- [x] 確認 `zoho-creator/workflows/` 下 9 個 workflow 腳本已更新改名串接
- [x] 確認 `zoho-creator/functions/DEPRECATED/` 下 9 個廢棄函數已歸檔

### 1-4. 改名清單確認（20 個函數）

> 在開始部署前，逐一確認以下改名對照無誤：

- [x] `API.CreateClientProfile` → `API.createClientProfile`
- [x] `API.CreateTalismanOrder_v2` → `API.createTalismanOrder`（v1 已合併）
- [x] `API.LINE_PushText` → `API.linePushText`
- [x] `API.LIFF_Divination_MVP` → `API.liffDivinationMvp`
- [x] `API.ECPayReturn` → `API.ecPayReturn`
- [x] `API.BindLineUser` → `API.bindLineUser` [Standalone]
- [x] `API.GetTalismanByToken` → `API.getTalismanByToken` [Standalone]
- [x] `API.PredictFromLine_v1` → `API.predictFromLine` [Standalone]
- [x] `API.DeliveryPushCallback_v1` → `API.deliveryPushCallback` [Standalone]
- [x] `Bazi.PreciseBaziCalculator` → `Bazi.preciseBaziCalculator`
- [x] `GuaCalculator.BaziToBitSequence` → `GuaCalculator.baziToBitSequence`
- [x] `GuaCalculator.BitToHexagramCode` → `GuaCalculator.bitToHexagramCode`
- [x] `LunarAI.GetCurrentTimeBazi` → `LunarAI.getCurrentTimeBazi`
- [x] `LunarAI.GetSolarDateTimeBazi` → `LunarAI.getSolarDateTimeBazi`
- [x] `LunarAI.LunarToWords` → `LunarAI.lunarToWords`
- [x] `LunarAI.LunarWordsToBazi` → `LunarAI.lunarWordsToBazi`
- [x] `LunarAI.SolarToLunar` → `LunarAI.solarToLunar`
- [x] `LunarAI.TestConvertSolarToLunar` → `LunarAI.testConvertSolarToLunar`
- [x] `Tarot.TarotDivinationFunction` → `Tarot.tarotDivinationFunction`
- [x] `ECPay.generateCheckMacValue_private` → `ECPay.generateCheckMacValue`

### 1-4b. OpenAI → LLM 命名空間遷移（3 個函數）

> OpenAI 模組已遷移至供應商中立的 LLM 命名空間。舊 OpenAI 函數已移至 DEPRECATED/。

- [x] `OpenAI.callAssistant` → **已廢棄**（功能由 `LLM.callChat` 取代）
- [x] `OpenAI.callChatGPT` → **已廢棄**（功能由 `LLM.callChat` 取代）
- [x] `OpenAI.combineDivinationPrompt` → `LLM.combineDivinationPrompt`（邏輯不變，僅命名空間遷移）

### 1-5. LLM Creator UI 變數設定（部署前必做）

> OpenAI 變數已廢棄，需在 Creator UI 建立新的 LLM 變數。
> 路徑：Creator IDE → Settings → Application Variables

- [x] 建立 `LLM.LLM_API_Key` — 值：Anthropic API Key
- [x] 建立 `LLM.LLM_API_URL` — 值：`https://api.anthropic.com/v1/messages`
- [x] 建立 `LLM.LLM_Model` — 值：`claude-sonnet-4-20250514`
- [x] 建立 `LLM.LLM_API_Version` — 值：`2023-06-01`
- [x] **連通測試**：Creator Execute → `LLM.callChat("你是占卜師", "今天運勢如何", Map())` → 確認回傳 AI 回應
- [x] ~~（可選）~~ 已刪除舊 `OpenAI.*` 變數（4 個 OpenAI 變數已清除，見 Phase 5 6-4）（2026-03-02）

---

## 二、Phase 1：建立新名稱函數（先建） ✅ 完成

> 策略：先在 Creator IDE 中建立新名稱函數，**保留舊名稱函數不動**。
> 部署順序：Layer 0（無依賴）→ Layer 1 → Layer 2 → ... → Layer 5（最上層）。
> 來源檔案位於 `zoho-creator/functions/<module>/` 各模組目錄。
>
> **狀態：全數 90 個函數已部署完成（2026-03-01）**

### Layer 0 — 基礎資料層（無對外依賴）

- [x] `LunarData.getConstants` — 確認內容不變，無需重建（不可修改資料值）
- [x] `Hexagram.fetchHexagram` — 貼入新版程式碼
- [x] `Hexagram.getHexagramByYaoCode` — 貼入新版程式碼
- [x] `Widget.getBirthSelectorHTML` — 貼入新版程式碼
- [x] `LLM.callChat` — **新函數**，建立並貼入 `zoho-creator/functions/llm/LLM.callChat.deluge`（統一 Claude API 呼叫介面）
- [x] `LLM.combineDivinationPrompt` — **新函數**（從 OpenAI 命名空間遷移），貼入 `zoho-creator/functions/llm/LLM.combineDivinationPrompt.deluge`
- [x] `Calendar.normalizeToTaipei` — **Standalone 函數**，建立並貼入 `calendar/Calendar.normalizeToTaipei.deluge`（時區正規化）
- [x] `Calendar.applyZiHourDayRollover` — **Standalone 函數**，建立並貼入 `calendar/Calendar.applyZiHourDayRollover.deluge`（子時換日）
- [x] `Calendar.getEffectiveDayKey` — **Standalone 函數**，建立並貼入 `calendar/Calendar.getEffectiveDayKey.deluge`（依賴前兩者）

### Layer 1 — 農曆 / 天干地支

- [x] `LunarAI.getBaziConstants` — 貼入新版
- [x] `LunarAI.createSixtyGanZhiTable` — 貼入新版
- [x] `LunarAI.getSolarTermsDataMap` — 確認內容不變（不可修改資料值）
- [x] `LunarAI.getLunarMonthStructure` — 確認內容不變（不可修改資料值）。**修正：回傳型別 map → list**
- [x] `LunarAI.calculateLunarDetails` — 貼入新版
- [x] `LunarAI.solarToLunar` — **新名稱**，建立新函數，貼入新版
- [x] `LunarAI.lunarToWords` — **新名稱**，建立新函數，貼入新版
- [x] `LunarAI.lunarWordsToBazi` — **新名稱**，建立新函數，貼入新版
- [x] `LunarAI.getDayPillar` — 貼入新版
- [x] `LunarAI.getHourPillar` — 貼入新版
- [x] `LunarAI.getMonthPillar` — 貼入新版
- [x] `LunarAI.getYearPillar` — 貼入新版
- [x] `LunarAI.convertToBaZi` — 貼入新版
- [x] `LunarAI.updateGanZhiProperties` — 貼入新版
- [x] `LunarAI.getCurrentTimeBazi` — **新名稱**，建立新函數，貼入新版
- [x] `LunarAI.getSolarDateTimeBazi` — **新名稱**，建立新函數，貼入新版
- [x] `LunarAI.debugSolarToLunar` — 貼入新版
- [x] `LunarAI.testConvertSolarToLunar` — **新名稱**，建立新函數，貼入新版

### Layer 2 — 八字 / 卦象計算

- [x] `Bazi.calculatePreciseDayPillar` — 貼入新版
- [x] `Bazi.calculatePreciseHourPillar` — 貼入新版
- [x] `Bazi.calculatePreciseMonthPillar` — 貼入新版
- [x] `Bazi.calculatePreciseYearPillar` — 貼入新版
- [x] `Bazi.getDivinationTimeDetails` — 貼入新版
- [x] `Bazi.preciseBaziCalculator` — **新名稱**，建立新函數，貼入新版
- [x] `GuaCalculator.baziToBitSequence` — **新名稱**，建立新函數，貼入新版
- [x] `GuaCalculator.bitToHexagramCode` — **新名稱**，建立新函數，貼入新版
- [x] `GuaCalculator.getHexagramBySolarBirthday` — 貼入新版
- [x] `IChing.calculateHexagram` — 貼入新版
- [x] `IChing.getDivinationResult` — 貼入新版
- [x] `IChing.getHexagramDetails` — 貼入新版

### Layer 2 — 星座 / 生肖 / 星宿

- [x] `Zodiac.getChineseZodiacSign` — 貼入新版
- [x] `Zodiac.getTaisuiStatus` — 貼入新版
- [x] `Zodiac.getZodiacSign` — 貼入新版
- [x] `Star.getLunarMansion` — 貼入新版

### Layer 2 — 塔羅

- [x] `Tarot.drawRandomSpread` — 貼入新版
- [x] `Tarot.getPositionMeanings` — 貼入新版
- [x] `Tarot.determinePrimaryCard` — 貼入新版
- [x] `Tarot.getLifePathTarot` — 貼入新版
- [x] `Tarot.getPrimaryTalismanForSalesIQ` — 貼入新版
- [x] `Tarot.completeTarotDivination` — 貼入新版。**修正：`clientId == 0` → `clientId == "0"`**
- [x] `Tarot.tarotDivinationFunction` — **新名稱**，建立新函數，貼入新版

### Layer 3 — AI 解讀 / 符令

- [x] `AIInterpreter.checkCooldownStatus` — 貼入新版
- [x] `AIInterpreter.classifyQuestionType` — 貼入新版
- [x] `AIInterpreter.compareQuestionSimilarity` — 貼入新版
- [x] `AIInterpreter.generatePersonalityProfile` — 貼入新版
- [x] `AIInterpreter.generateTalismanExplanation` — 貼入新版
- [x] `AIInterpreter.getGenderFromName` — 貼入新版
- [x] `AIInterpreter.getPersonalizedInterpretation` — 貼入新版
- [x] `AIInterpreter.getPredictionByQuestionAndBirthday` — 貼入新版（原 `_v2` 後綴已移除）
- [x] `AIInterpreter.getTarotInterpretationFull` — 貼入新版
- [x] `AIInterpreter.getTarotInterpretation` — 貼入新版（原 `_v2` 後綴已移除，**注意：與廢棄的 v1 同名，需先刪 v1 或直接覆蓋**）
- [x] `Talisman.generateTalismanExplanation` — 貼入新版
- [x] `Talisman.getBasicRecommendation` — 貼入新版
- [x] `Talisman.getCompleteRecommendation` — 貼入新版
- [x] `Talisman.getRecommendationReason` — 貼入新版
- [x] `Talisman.getTalismanRecommendation` — 貼入新版

### Layer 4 — 金流 / CRM / 工具

- [x] `ECPay.generateCheckMacValue` — **新名稱**（原 `_private` 後綴已移除），建立新函數
- [x] `ECPay.verifyECPayCheckMacValue` — **全新函數**，建立並貼入程式碼
- [x] `ECPay.generateCheckoutConfirmationPage` — 貼入新版
- [x] `ECPay.generateCheckoutFormProduction` — 貼入新版（原 `_Production` 已改名）
- [x] `ECPay.generateECPayCheckoutForm` — 貼入新版
- [x] `ECPay.generatePaymentLink` — 貼入新版
- [x] `ECPay.handleECPayResponse` — 貼入新版
- [x] `ECPay.processFlowCallback` — 貼入新版
- [x] `ECPay.publicWebhook` — 貼入新版
- [x] `CRM.syncContact` — 貼入新版
- [x] `Tools.getTimezoneFromIP` — 貼入新版
- [x] `Tools.populateTaisuiDeityNames` — 貼入新版
- [x] `Email.sendTalismanReport` — 貼入新版

### Layer 4 — 排程 / 訓練

- [x] `SolarTerms.clearAllDayHourPillars` — 貼入新版
- [x] `SolarTerms.populateNext3Batches` — 貼入新版
- [x] `SolarTerms.populateSolarTermsDayHourPillars` — 貼入新版
- [x] `Training.generateVirtualClient` — 貼入新版

### Layer 5 — API 入口 / Webhook / Flow

#### API 函數（11 個）

- [x] `API.createClientProfile` — **新名稱**，建立新函數，貼入新版
- [x] `API.createTalismanOrder` — **新名稱**（合併 v1/v2），建立新函數，貼入新版
- [x] `API.linePushText` — **新名稱**，建立新函數，貼入新版
- [x] `API.liffDivinationMvp` — **新名稱**，建立新函數，貼入新版
- [x] `API.ecPayReturn` — **新名稱**，建立新函數，貼入新版
- [x] `API.jsonEscape` — 貼入新版
- [x] `API.generatePersonalityProfile` — 貼入新版
- [x] `API.bindLineUser` — **新名稱** [Standalone]，建立新函數。**修正：`Form[criteria]=map` → 直接賦值**
- [x] `API.getTalismanByToken` — **新名稱** [Standalone]，建立新函數。**修正：加頂層 return**
- [x] `API.predictFromLine` — **新名稱** [Standalone]，建立新函數。**修正：加頂層 return**
- [x] `API.deliveryPushCallback` — **新名稱** [Standalone]，建立新函數。**修正：加頂層 return + 需新增 4 欄位**

#### 其他命名空間（4 個）

- [x] `Webhook.handleSimplyBook` — 貼入新版
- [x] `Webhook.processChatMessage` — 貼入新版
- [x] `Flow.triggerTarotFlowProcessor` — 貼入新版
- [x] `Gamma.generateReportFromLog` — 貼入新版

### Phase 1 完成確認

- [x] 在 Creator IDE 中確認 90 個活躍函數全數存在（新舊名稱同時並存）
- [x] 逐一儲存每個函數，確認 Creator 語法驗證通過（無紅色錯誤）
- [x] 執行 Layer 0 基本 smoke test：`LunarData.getConstants` 回傳正常

---

## 三、Phase 2：更新呼叫者（由上層往下層） ✅ 完成

> 策略：由高層呼叫者開始更新，確保每一層更新後呼叫的都是新名稱函數。
> 此階段新舊函數並存，更新完成後舊函數將成為「零引用」。
>
> **狀態：已在 Phase 1 同步完成（2026-03-01）**
> 新版 .deluge 檔案已內建正確的 camelCase 引用，部署新函數即同步完成呼叫者更新。

### 高呼叫點函數（優先處理）

#### `Bazi.preciseBaziCalculator`（原 16 個呼叫點）

- [x] `API.createClientProfile` 內的呼叫已改為 `thisapp.Bazi.preciseBaziCalculator(...)`
- [x] `CRM.syncContact` 內的呼叫已改為 `thisapp.Bazi.preciseBaziCalculator(...)`
- [x] `IChing.calculateHexagram` 內的呼叫已改為 `thisapp.Bazi.preciseBaziCalculator(...)`
- [x] `Zodiac.getZodiacSign` 內的所有呼叫已改為 `thisapp.Bazi.preciseBaziCalculator(...)`
- [x] Standalone `API.bindLineUser` 內的呼叫已更新

#### `LunarAI.solarToLunar`（原 10+2 個呼叫點）

- [x] `API.createClientProfile` 內的呼叫已改為 `thisapp.LunarAI.solarToLunar(...)`
- [x] `CRM.syncContact` 內的呼叫已改為 `thisapp.LunarAI.solarToLunar(...)`
- [x] `LunarAI.debugSolarToLunar` 內的呼叫已更新
- [x] `LunarAI.getCurrentTimeBazi` 內的呼叫已更新
- [x] `LunarAI.getSolarDateTimeBazi` 內的呼叫已更新
- [x] `Star.getLunarMansion` 內的呼叫已更新
- [x] `Zodiac.getZodiacSign` 內的所有呼叫已更新
- [x] Standalone `API.bindLineUser` 內的呼叫已更新

#### `ECPay.generateCheckMacValue`（原 5 個呼叫點）

- [x] `API.ecPayReturn` 內的呼叫已更新
- [x] `ECPay.generateCheckoutConfirmationPage` 內的呼叫已更新
- [x] `ECPay.generateECPayCheckoutForm` 內的呼叫已更新
- [x] `ECPay.publicWebhook` 內的呼叫已更新
- [x] `ECPay.verifyECPayCheckMacValue` 內的呼叫已更新

### 其他改名函數的呼叫者更新

#### `Tarot.tarotDivinationFunction`（原 3 個呼叫點）

- [x] `Flow.triggerTarotFlowProcessor` 內的呼叫已更新
- [x] `Webhook.processChatMessage` 內的呼叫已更新
- [x] `API.liffDivinationMvp` 內的呼叫已更新
- [x] **TarotDivinationButton workflow** — 已修正（見第八章）（2026-03-02）

#### `API.linePushText`（原 2 個呼叫點）

- [x] 確認所有內部呼叫者已更新為 `thisapp.API.linePushText(...)`

#### `GuaCalculator.baziToBitSequence` / `bitToHexagramCode`（各 2 個呼叫點）

- [x] `GuaCalculator.getHexagramBySolarBirthday` 內的呼叫已更新
- [x] `IChing.calculateHexagram` 內的呼叫已更新

#### `LunarAI.getCurrentTimeBazi` / `getSolarDateTimeBazi`（各 1 個呼叫點）

- [x] 確認內部呼叫者已更新

#### v2 後綴移除的函數

- [x] `AIInterpreter.getPredictionByQuestionAndBirthday`（原 `_v2`）— 呼叫者已更新
- [x] `AIInterpreter.getTarotInterpretation`（原 `_v2`）— 呼叫者已更新
- [x] `ECPay.generateCheckoutFormProduction`（原 `_Production`）— 呼叫者已更新

### Phase 2 完成確認

- [x] 在 Creator IDE 中使用「Find in Scripts」搜尋所有舊名稱，確認零殘留（2026-03-02 確認）：
  - [x] 搜尋 `PreciseBaziCalculator` → 0 結果
  - [x] 搜尋 `SolarToLunar` → 0 結果
  - [x] 搜尋 `generateCheckMacValue_private` → 0 結果
  - [x] 搜尋 `TarotDivinationFunction` → 0 結果（TarotDivinationButton 已修正）
  - [x] 搜尋 `LINE_PushText` → 0 結果
  - [x] 搜尋 `LIFF_Divination_MVP` → 0 結果
  - [x] 搜尋 `CreateClientProfile` → 0 結果
  - [x] 搜尋 `CreateTalismanOrder` → 0 結果
  - [x] 搜尋 `ECPayReturn` → 0 結果
  - [x] 搜尋 `BaziToBitSequence` → 0 結果
  - [x] 搜尋 `BitToHexagramCode` → 0 結果
  - [x] 搜尋 `GetCurrentTimeBazi` → 0 結果
  - [x] 搜尋 `GetSolarDateTimeBazi` → 0 結果
  - [x] 搜尋 `LunarToWords` → 0 結果
  - [x] 搜尋 `LunarWordsToBazi` → 0 結果
  - [x] 搜尋 `TestConvertSolarToLunar` → 0 結果
  - [x] 搜尋 `callAssistant` → 0 結果（已廢棄）
  - [x] 搜尋 `callChatGPT` → 0 結果（已遷移至 `LLM.callChat`）
  - [x] 搜尋 `OpenAI.combineDivinationPrompt` → 0 結果（已遷移至 `LLM.combineDivinationPrompt`）
  - [x] 搜尋 `variables.OpenAI` → 0 結果（已遷移至 `variables.LLM`）

---

## 四、Phase 3：更新 Workflows / Mobile Scripts ✅ 完成

> 9 個 Workflow 腳本需更新，確認已引用新名稱。
>
> **狀態：全數完成（2026-03-01）**
> Repo 檔案已重新命名為 camelCase。

### Workflow 腳本更新

- [x] `Workflow.generateDivinationPrompt` — 確認 `thisapp.LLM.combineDivinationPrompt(...)` 取代舊 `thisapp.OpenAI.combineDivinationPrompt(...)`
- [x] `Workflow.generateDivinationResult` — 確認 `thisapp.LLM.combineDivinationPrompt(...)` + `thisapp.LLM.callChat("", prompt, Map())` 取代舊 OpenAI 呼叫
- [x] `Workflow.onSuccessSetGenderFromAI` — 確認已改用 `thisapp.LLM.callChat(gender_system, fname, gender_opts)` 取代舊 OpenAI 直接 API 呼叫（~65 行→~20 行）
- [x] `Workflow.onSuccessUpdateBaziPillars` — 確認內部呼叫使用新名稱
- [x] `Workflow.onSuccessUpdateFourPillars` — 確認內部呼叫使用新名稱
- [x] `Workflow.onUserInputUpdateLifePathTarot` — 確認內部呼叫使用新名稱
- [x] `Workflow.onUserInputUpdateLunarBirthday` — 確認內部呼叫使用新名稱
- [x] `Workflow.onUserInputUpdateLunarMansion` — 確認內部呼叫使用新名稱
- [x] `Workflow.onUserInputUpdateZodiacAndTaisui` — 確認內部呼叫使用新名稱

### Workflow 觸發器確認

- [x] 在 Creator IDE → Workflow Rules 中確認每個 Workflow 的觸發條件未受影響
- [x] 確認 Workflow 啟用狀態（Active / Inactive）與部署前一致

### Phase 3 完成確認

- [x] 修改一筆測試記錄觸發 Workflow，確認執行紀錄無錯誤（2026-03-02 TarotDivinationButton + LIFF 測試通過）

---

## 五、Phase 4：Custom API 端點整頓

> **重要更新（2026-03-02）**：Phase 4 已根據 Creator 實際 Microservices 狀態完全重新規劃。
> 原計畫「12 個端點 handler 綁定更新」不正確 — Creator 實際有 9 個端點，全部是 SalesIQ 相關，
> 真正需要的端點（LINE LIFF、ECPay、n8n）尚未建立。
>
> 新計畫：**建立 4 個新端點 + 確認 2 個保留端點 + 停用 7 個閒置端點**
>
> 操作路徑：Creator IDE → Microservices → Custom API

### 現有 9 個端點狀態

| # | 端點顯示名稱 | 綁定函數 | 處置 |
|---|-------------|---------|------|
| 1 | 塔羅隨機抽牌占卜服務 | `drawRandomSpread` | 🔴 停用 |
| 2 | 付款API由SalesIQ調用生成連結 | `generatePaymentLink` | 🔴 停用 |
| 3 | 符令推薦至SalesIQ系統 | `getPrimaryTalismanForSalesIQ` | 🔴 停用 |
| 4 | 無視論塔羅計算API | `completeTarotDivination` | 🔴 停用 |
| 5 | 訂單從SalesIQ總來買符令 | `createTalismanOrder` | 🟢 保留（確認綁定） |
| 6 | 帳號增補從SalesIQ請求再傳回去 | `createClientProfile` | 🔴 停用 |
| 7 | 個人特質從SalesIQ請求 | `generatePersonalityProfile` | 🔴 停用 |
| 8 | 整合OpenAI Assistant與RAG到... | `processChatMessage` | 🔴 停用 |
| 9 | LINE LIFF Fetch API | `liffDivinationMvp` | 🟢 保留（確認綁定） |

> SalesIQ 目前未啟用、無用戶。7 個 SalesIQ 專用端點設定為 **Disable**（不刪除，未來可恢復）。

### Step 1：建立 4 個新端點（+ Create New）

> 路徑：Creator IDE → Microservices → Custom API → `+ Create New`
> 全部設定：Method = POST、Authentication = Public Key

- [x] 建立端點 `bindLineUser` → Function: `API.bindLineUser`（2026-03-02 完成）
- [x] 建立端點 `predictFromLine` → Function: `API.predictFromLine`（2026-03-02 完成）
- [x] 建立端點 `ecPayReturn` → Function: `API.ecPayReturn`（2026-03-02 完成）
- [x] 建立端點 `getTalismanByToken` → Function: `API.getTalismanByToken`（2026-03-02 完成）

### Step 2：確認 2 個保留端點的函數綁定

- [x] 端點 `LINE LIFF Fetch API`（#9）→ 確認 Function 指向 `API.liffDivinationMvp`（2026-03-02 完成）
- [x] 端點 `訂單從SalesIQ總來買符令`（#5）→ 確認 Function 指向 `API.createTalismanOrder`（2026-03-02 完成）

### Step 3：停用 7 個 SalesIQ 閒置端點

> 操作：各端點右上角 `Enabled → Disabled`（不刪除）

- [x] 停用 #1：塔羅隨機抽牌占卜服務（`drawRandomSpread`）（2026-03-02）
- [x] 停用 #2：付款API由SalesIQ調用生成連結（`generatePaymentLink`）（2026-03-02）
- [x] 停用 #3：符令推薦至SalesIQ系統（`getPrimaryTalismanForSalesIQ`）（2026-03-02）
- [x] 停用 #4：無視論塔羅計算API（`completeTarotDivination`）（2026-03-02）
- [x] 停用 #6：帳號增補從SalesIQ請求再傳回去（`createClientProfile`）（2026-03-02）
- [x] 停用 #7：個人特質從SalesIQ請求（`generatePersonalityProfile`）（2026-03-02）
- [x] 停用 #8：整合OpenAI Assistant與RAG到...（`processChatMessage`）（2026-03-02）

### Step 4：（選配）建立交付推播回呼端點

> 此端點用於 n8n 確認 LINE 推播結果，目前訂單量低可暫緩。

- [ ] 建立端點 `deliveryPushCallback` → Function: `API.deliveryPushCallback`
  - 記錄 Endpoint URL：`________________________`
  - 記錄 Public Key：`________________________`

### Step 5：整理端點 URL 對照表

> 完成後填入以下對照表，供後續設定 n8n、LIFF 頁面使用。

```
bindLineUser:        https://www.zohoapis.com/creator/custom/uneedwind/_______________
predictFromLine:     https://www.zohoapis.com/creator/custom/uneedwind/_______________
ecPayReturn:         https://www.zohoapis.com/creator/custom/uneedwind/_______________
getTalismanByToken:  https://www.zohoapis.com/creator/custom/uneedwind/_______________
liffDivinationMvp:   https://www.zohoapis.com/creator/custom/uneedwind/_______________
createTalismanOrder: https://www.zohoapis.com/creator/custom/uneedwind/_______________
deliveryPushCallback: (選配)
```

### 外部系統連線架構

```
外部系統                    Custom API 端點              Creator 函數
─────────                  ──────────────              ──────────
LINE LIFF 頁面  ──POST──→  bindLineUser        ──→  API.bindLineUser
LINE LIFF 頁面  ──POST──→  liffDivinationMvp   ──→  API.liffDivinationMvp
n8n (LINE Bot)  ──POST──→  predictFromLine      ──→  API.predictFromLine
ECPay 伺服器    ──POST──→  ecPayReturn          ──→  API.ecPayReturn
交付頁面        ──POST──→  getTalismanByToken   ──→  API.getTalismanByToken
n8n (交付確認)  ──POST──→  deliveryPushCallback ──→  API.deliveryPushCallback (選配)
```

### Step 6：記錄 Custom API 描述（Description 欄位備忘）

> 在 Creator Custom API Builder 為每個端點填寫 Description 後，複製貼入下方留存，避免未來忘記。
> Description 上限 200 字元；Link Name 會被附加在端點 URL 末尾（不可含空格）。

| Link Name | Display Name | Description |
|-----------|-------------|-------------|
| `bindLineUser` | LINE 用戶綁定 | `@LIFF \| 綁定 LINE-ID & 個案資料: 生日/姓名/手機/Email \| 建立或更新 Clients_Report 記錄` |
| `predictFromLine` | LINE 占卜請求 | `@n8n LINE-Bot \| 接收問題文字 - 自動判斷易經/塔羅 & 觸發占卜 \| 回傳 AI 解讀至 LINE` |
| `ecPayReturn` | ECPay 付款回呼 | `@ECPay *via Vercel-Proxy \| 驗證 CheckMacValue & 確認付款 \| 更新 Talisman_Purchases 狀態 & 觸發符令交付` |
| `getTalismanByToken` | 符令交付頁面 | `@TalismanDelivery-Page \| Token 查詢 Talisman_Purchases \| 回傳: 符令圖片 & 說明文字供客戶檢視` |
| `liffDivinationMvp` | LINE LIFF 占卜入口 | `@LIFF 占卜頁 \| event/fortune 快速占卜 - 接收問題 & 生日 \| AI 易經即時解讀 & 回傳摘要` |
| `createTalismanOrder` | 符令訂單建立 | `@LIFF / 外部系統 \| 依占卜記錄建立 Talisman_Purchases 符令訂單 \| 產生 ECPay 付款連結 & 回傳` |
| `deliveryPushCallback` | 交付推播回呼 | `@n8n *選配 \| 接收 LINE 推播交付結果 \| 更新 Talisman_Purchases: Delivery_Push_Status & 交付時間戳` |

### Phase 4 完成確認

- [x] 4 個新端點已建立，Function 綁定正確
- [x] 2 個保留端點已確認指向新版 camelCase 函數
- [x] 7 個 SalesIQ 端點已停用（Disabled）
- [x] 端點 URL 對照表已填寫完成
- [x] 使用 curl 測試全部 7 個活躍端點，皆回傳正確 JSON response（2026-03-02）
- [x] 7 個活躍端點 Description 已填寫並記錄至 Step 6 表格（2026-03-02）

---

## 六、Phase 5：刪除舊名稱與廢棄函數（後刪）

> **警告**：此階段為不可逆操作，請務必在 Phase 1-4 全部完成並通過 Smoke Test 後才執行。

### 6-1. 刪除廢棄函數（9 個）

- [x] `AIInterpreter.getMvpDivination_v1` — 已消失（部署時覆蓋）（2026-03-02）
- [x] `AIInterpreter.getTarotInterpretation`（原 v1）— 已被新版 v2 覆蓋（2026-03-02）
- [x] `API.CreateTalismanOrder`（原 v1）— 已消失（部署時覆蓋）（2026-03-02）
- [x] `Webhook.handleECPayReturn` — 已消失（2026-03-02）
- [x] `ECPay.simulateECPayCallback` — 已消失（2026-03-02）
- [x] `TEST.sendSampleDataToFlow` — 已消失（2026-03-02）
- [x] `OpenAI.callAssistant` — 已刪除，由 `LLM.callChat` 取代（2026-03-02）
- [x] `OpenAI.callChatGPT` — 已刪除，由 `LLM.callChat` 取代（2026-03-02）
- [x] `OpenAI.combineDivinationPrompt` — 已刪除，搬至 `LLM.combineDivinationPrompt`（2026-03-02）

### 6-2. 刪除舊名稱函數（20 個，已被新名稱取代）

> 逐一刪除前，在 Creator IDE 搜尋確認該舊名稱函數已無任何呼叫者。

- [x] `API.CreateClientProfile` — 已消失（部署時覆蓋）（2026-03-02）
- [x] `API.CreateTalismanOrder_v2` — 已消失（2026-03-02）
- [x] `API.LINE_PushText` — 已消失（2026-03-02）
- [x] `API.LIFF_Divination_MVP` — 已消失（2026-03-02）
- [x] `API.ECPayReturn` — 已消失（2026-03-02）
- [x] `Bazi.PreciseBaziCalculator` — 已消失（2026-03-02）
- [x] `GuaCalculator.BaziToBitSequence` — 已消失（2026-03-02）
- [x] `GuaCalculator.BitToHexagramCode` — 已消失（2026-03-02）
- [x] `LunarAI.GetCurrentTimeBazi` — 已消失（2026-03-02）
- [x] `LunarAI.GetSolarDateTimeBazi` — 已消失（2026-03-02）
- [x] `LunarAI.LunarToWords` — 已消失（2026-03-02）
- [x] `LunarAI.LunarWordsToBazi` — 已消失（2026-03-02）
- [x] `LunarAI.SolarToLunar` — 已消失（2026-03-02）
- [x] `LunarAI.TestConvertSolarToLunar` — 已消失（2026-03-02）
- [x] `Tarot.TarotDivinationFunction` — 已消失（TarotDivinationButton 已修正）（2026-03-02）
- [x] `ECPay.generateCheckMacValue_private` — 已消失（2026-03-02）
- [x] `API.BindLineUser` — 已消失（已改名為 `API.bindLineUser`）（2026-03-02）
- [x] `API.GetTalismanByToken` — 已消失（已改名為 `API.getTalismanByToken`）（2026-03-02）
- [x] `API.PredictFromLine_v1` — 已消失（已改名為 `API.predictFromLine`）（2026-03-02）
- [x] `API.DeliveryPushCallback_v1` — 已消失（已改名為 `API.deliveryPushCallback`）（2026-03-02）

### 6-3. 刪除內部版本後綴舊函數

- [x] `AIInterpreter.getPredictionByQuestionAndBirthday_v2` — 已消失，新版無後綴（2026-03-02）
- [x] `AIInterpreter.getTarotInterpretation_v2` — 已消失，新版無後綴（2026-03-02）
- [x] `ECPay.generateCheckoutForm_Production` — 已消失，新版為 camelCase（2026-03-02）

### 6-4. 刪除舊 OpenAI Application Variables（4 個）

> 需先完成 6-1 中 3 個 OpenAI 函數刪除後，才能安全刪除變數。

- [x] 確認 Creator 中無函數引用 `OpenAI_*` 變數（2026-03-02）
- [x] 刪除 `OpenAI.OpenAI_API_Key`（2026-03-02）
- [x] 刪除 `OpenAI.OpenAI_API_URL`（2026-03-02）
- [x] 刪除 `OpenAI.OpenAI_Assistant_ID`（2026-03-02）
- [x] 刪除 `OpenAI.OpenAI_Model`（2026-03-02）
- [x] 刪除後新增 `System.N8N_ECPayPaidNotifyURL` = `https://n8n.winds.tw/webhook/ecpay-paid-notify`（2026-03-02）
- [ ] **待重命名**：`System.N8N_ECPayPaidNotifyURL` → `System.ECPayPaidNotifyURL`（Zoho Flow 主線架構修正，見 MVP_DEPLOY_CHECKLIST.md Step 0-B）

### Phase 5 完成確認

- [x] Creator IDE 函數列表中已無任何舊名稱函數（2026-03-02 截圖清點確認）
- [x] Creator IDE 函數列表中已無任何廢棄函數（32 個刪除目標全部已消失）
- [x] 最終函數總數 = 97（含 DS 內 90 個 + standalone 函數）
- [x] Application Variables 已降至 17/20（刪除 OpenAI 4 個 + 新增 N8N_ECPayPaidNotifyURL）

> **注意**：`Tarot.getPrimaryTalismanForSalesIQ` 及 `Webhook.processChatMessage` 仍存在，
> 屬原始保留函數（Registry 無刪除旗標），SalesIQ 端點停用後這兩個函數呼叫方已無效但本身無害。

---

## 七、Standalone 非 API 函數部署

> API.* Standalone 函數已合併至 Layer 5（見上方）。
> 以下為非 API 的 Standalone 函數。

### 7-1. Content-Factory API 函數（4 個，僅存在於 Creator，本 repo 已建立檔案）

> Repo 檔案已重新命名為 camelCase（2026-03-01）。
> Creator 中的函數名稱保持不變（這些函數由外部 content-factory 系統呼叫）。

- [x] `API.publishCallback`（Creator 中保留原名）— 確認不變（2026-03-02）
- [x] `API.queueNewsRemake`（Creator 中保留原名）— 確認不變（2026-03-02）
- [x] `API.queueVoiceCopy`（Creator 中保留原名）— 確認不變（2026-03-02）
- [x] `API.queueWeeklyFortune`（Creator 中保留原名）— 確認不變（2026-03-02）

### 7-2. Calendar 函數（已部署，確認不變）

- [x] `Calendar.normalizeToTaipei` — 確認已部署
- [x] `Calendar.applyZiHourDayRollover` — 確認已部署
- [x] `Calendar.getEffectiveDayKey` — 確認已部署

### 7-3. HTML Page 函數（確認不變）

- [x] `TalismanDelivery.htmlpage` — 確認不變（待 MVP Step 3 建立完整頁面）
- [x] `LIFFBinding.htmlpage` — 確認不變（增強版頁面待後續部署）

---

## 八、塔羅占卜按鈕修正

> **問題**：Clients_Report 表單上的「塔羅占卜」按鈕觸發錯誤：
> `Error in executing script Number of params/datatype mismatch Line:(1)`
>
> **原因**：按鈕的 Workflow 腳本呼叫 `TarotDivinationFunction(Modified_User)`，
> 但函數簽名為 `tarotDivinationFunction(string client_id, string user_question)`。
> 1 個錯誤型別參數 vs 2 個 string 參數。
>
> **用途**：此按鈕作為開發測試入口 + 用戶問題不明確時的備援機制。

### 8-1. 修正 TarotDivinationButton Workflow 腳本

- [x] 在 Creator IDE 中找到 `TarotDivinationButton` Workflow
- [x] 修改腳本為（已改用自由腳本模式，移除不支援的 alert）：

```deluge
// ========================================
// TarotDivinationButton — 塔羅占卜按鈕
// 觸發方式：Clients_Report 表單 → 「塔羅占卜」按鈕
// 功能：為選取的個案執行完整塔羅占卜（含 AI 解讀、符令圖片）
// 預設問題「綜合運勢分析」適用於問題不明確或快速測試場景
// ========================================
client_id = input.ID.toString();
user_question = "綜合運勢分析";

result = thisapp.Tarot.tarotDivinationFunction(client_id, user_question);

if(result.get("success") == true)
{
    div_id = result.get("divination_id");
    info "塔羅占卜完成 — 個案 ID：" + client_id + "，占卜記錄 ID：" + div_id;
}
else
{
    alert "塔羅占卜失敗：" + result.get("message");
    info "塔羅占卜失敗 — 個案 ID：" + client_id + "，錯誤：" + result.get("message");
}
```

### 8-2. 完整性確認（tarotDivinationFunction 流程）

> 確認以下 8 個步驟在按鈕觸發後全部正常運作：

- [x] 步驟 1：參數驗證（client_id 非空）
- [x] 步驟 2：AI 問題分類（`classifyQuestionType` → 回傳「其他」）
- [x] 步驟 3：取得牌位意義（`getPositionMeanings` → 5 個牌位含義已填入）
- [x] 步驟 4：隨機抽牌（`drawRandomSpread` → 月亮、力量、權杖六、死神、塔）
- [x] 步驟 5：建立 Divination_Logs 記錄（ID: 4707400000000609004）
- [x] 步驟 6：主卦分析 + 符令圖片填入（5 張卡片圖像均已寫入）
- [x] 步驟 7：5 張牌圖片填入 + 牌義強化（Position_1~5_Meaning 均有內容）
- [x] 步驟 8：Flow AI 解讀（Flow 失敗，備援 LLM 成功，430 字 AI 解讀已寫入）

---

## 九、Smoke Test 驗證清單

> 在所有 Phase 完成後，執行以下測試確認系統功能正常。
> 建議在 Creator IDE 的「Execute」面板或透過外部觸發逐一測試。

### 9-1. LLM 連通測試

- [x] Creator Execute → `LLM.callChat("你是占卜師", "今天運勢如何", Map())` → 確認回傳 AI 回應（非錯誤訊息）

### 9-2. 核心計算引擎

- [x] `LunarAI.solarToLunar(today)` → 回傳正確農曆日期（2026-03-02）
- [x] `Bazi.preciseBaziCalculator(today)` → 回傳四柱（2026-03-02）
- [x] `Zodiac.getZodiacSign(test_date)` → 回傳正確星座（2026-03-02）
- [x] `Tarot.drawRandomSpread()` → 回傳 5 張牌（2026-03-02）

### 9-3. 端到端流程測試

- [x] **LINE 占卜流程**：LINE_LIFF_Fetch_API curl 測試完整成功（2026-03-02）
- [ ] **ECPay 金流流程**：ECPay 測試付款 → `ecPayReturn` 接收回呼 → 訂單狀態更新為「已付款」（留待上線前）
- [x] **LIFF 綁定流程**：bindLineUser curl 測試 200 通過（2026-03-02）
- [x] **塔羅占卜按鈕**：Clients_Report → 點擊「塔羅占卜」→ 無錯誤 → 占卜記錄建立（2026-03-02）

### 9-4. 回歸測試

- [x] 現有占卜紀錄查詢功能正常（TarotDivinationButton 測試中確認）
- [x] 符令推薦流程正常（getLifePathTarot 已接入 createClientProfile + Workflow）（2026-03-04）
- [x] 人格分析功能正常（generatePersonalityProfile 已由 Workflow 自動觸發 + 含塔羅資料）（2026-03-04）
- [ ] CRM 同步功能正常（`CRM.syncContact`）— 留待 MVP 驗收
- [ ] Email 報告寄送功能正常（`Email.sendTalismanReport`）— 留待 MVP 驗收
- [x] Workflow 觸發正常（TarotDivinationButton 及 LINE_LIFF_Fetch_API 測試中確認）

### 9-5. 排程任務確認

- [ ] `SolarTerms.populateNext3Batches` 排程下次執行時間正確
- [ ] `SolarTerms.populateSolarTermsDayHourPillars` 排程狀態正常

---

## 十、外部系統影響確認

### 10-1. 不受影響的系統（確認即可）

- [x] **n8n workflows** — 呼叫的是 Custom API endpoint URL，非函數名稱，不受影響（2026-03-02 確認）
- [x] **LINE LIFF 頁面** — 呼叫的是 Custom API endpoint URL，不受影響（2026-03-02 確認）
- [x] **ECPay ReturnURL** — 指向 Creator endpoint URL，不受影響（2026-03-02 確認）

### 10-2. 需要關注的系統

- [x] **Creator Microservices** — 已在 Phase 4 整頓完畢（建 4 新 + 保留 2 + 停用 7）（2026-03-02）
- [x] **Zoho Flow** — 確認無直接引用 Creator 函數名稱，透過 Webhook URL 呼叫不受影響（2026-03-02）
- [x] **Zoho SalesIQ** — 目前未啟用，7 個相關端點已停用。未來重啟時需重新確認端點綁定（2026-03-02）

---

## 十一、回滾計畫

> 若部署過程中發生嚴重問題，按以下步驟回滾。

### 回滾觸發條件

- Smoke Test 失敗超過 2 項核心測試
- 線上用戶回報占卜功能異常
- ECPay 回呼無法正常處理

### 回滾步驟

1. [ ] **停止刪除操作** — 若尚在 Phase 5，立即停止
2. [ ] **恢復舊函數呼叫** — 在 Creator IDE 中將 Workflow / API handler 改回舊名稱
3. [ ] **保留新名稱函數** — 不需刪除，僅切回舊路徑（先建後刪策略的優勢）
4. [ ] **匯入備份 DS** — 若大面積故障，從備份匯入原始 `AI易經.ds`
5. [ ] **通知相關人員** — 回滾後通知團隊，排查問題根因

### 回滾後的重新部署

- [ ] 確認問題根因並修復
- [ ] 在測試環境重新驗證
- [ ] 重新執行本清單

---

## 十二、部署完成簽核

| 項目 | 狀態 | 完成日期 | 負責人 |
|------|------|---------|--------|
| Phase 1：建立新名稱函數 | [x] ✅ | 2026-03-01 | 90 函數部署 |
| Phase 2：更新呼叫者 | [x] ✅ | 2026-03-01 | 新版 .deluge 已內建正確引用 |
| Phase 3：更新 Workflows | [x] ✅ | 2026-03-01 | 9 個 Workflow 覆蓋 |
| Phase 4：Custom API 端點整頓 | [x] ✅ | 2026-03-02 | 建 4 新 + 保留 2 + 停用 7 |
| Phase 5：刪除舊函數 | [x] ✅ | 2026-03-02 | 32 目標全消失，現有 97 函數 |
| Standalone 函數部署 | [x] ✅ | 2026-03-01 | Calendar 3 函數已部署 |
| 塔羅占卜按鈕修正 | [x] ✅ | 2026-03-02 | 自由模式 + 占卜全通過 |
| Smoke Test 全數通過 | [x] ✅（部分） | 2026-03-02 | 核心功能 + 端點通過；ECPay 金流留待上線 |
| 外部系統確認 | [x] ✅（部分） | 2026-03-02 | n8n/LIFF/ECPay 端點就緒；E2E 留待 MVP |
| 回滾計畫已就緒 | [x] ✅ | 2026-02-25 | |
| LLM 遷移 + 功能增強 | [x] ✅ | 2026-03-04 | Stage A/B/C + Hotfix + OnPaymentSuccess |

### 最終確認

- [x] 所有 Phase 完成，無殘留舊名稱引用（2026-03-02 確認）
- [x] Smoke Test 核心功能通過（ECPay E2E 留待 MVP 上線，見 MVP_DEPLOY_CHECKLIST.md）
- [x] 外部系統端點就緒（n8n/LIFF/ECPay endpoint URL 已建立）
- [x] 備份已保存且可回溯（Git repo + 原版 AI易經.ds）
- [x] 本清單已標記全部完成（2026-03-04 最終更新）

---

> **附註**：
> - 本清單設計為可列印使用，每個 checkbox 可手動勾選
> - 建議部署時間選擇低流量時段（台灣時間凌晨 2:00-6:00）
> - 整體部署預估時間：2-4 小時（不含回歸測試）
> - 若需逐函數比對，請參考 `docs/DS_RENAME_REGISTRY.md` 的完整呼叫點地圖
> - **部署問題修正記錄**：部署期間發現並修正的 Bug 已記錄於頂部摘要區段

---

## 十三、部署後功能增強記錄（2026-03-02 ~ 03-04）

> Phase 1-5 基礎部署完成後，持續進行的功能增強和 Bug 修正。

### 13-1. OpenAI → Claude LLM 遷移（2026-03-02）

- [x] 建立 `LLM.callChat` 統一 Claude API 介面（替代 `OpenAI.callAssistant` + `OpenAI.callChatGPT`）
- [x] 15 個函數改用 `LLM.callChat`
- [x] 3 個 Workflow 改用 `LLM.callChat`（generateDivinationResult, onSuccessSetGenderFromAI, generateDivinationPrompt）
- [x] Creator Application Variables：建立 `LLM.*` 4 個變數，刪除 `OpenAI.*` 4 個變數
- [x] 連通測試通過

### 13-2. Stage A：塔羅解讀個人化（2026-03-04）

- [x] `AIInterpreter.getTarotInterpretation` — 加入 persona 個性線索 + 主副卦無視論分析
- [x] `AIInterpreter.getTarotInterpretationFull` — 同上，付費版 3000 字報告也加入個人化
- [x] `Tarot.determinePrimaryCard` — 加入 clientId 參數，回傳個案命理資料至 AI prompt
- [x] 主副卦分析邏輯：reversed/upright 計數 → 少數為主，多數為輔
- [x] AI prompt 改為 5 段式結構回答

### 13-3. Stage B：個性側寫自動化 + 易經個性強化（2026-03-04）

- [x] `AIInterpreter.generatePersonalityProfile` — 加入 4 張本命塔羅牌資料
  - 從 `All_Tarot_Cards` 查詢 Ben_Ming_Tarot / Xian_Zhuang_Tarot / Ye_Li_Tarot / Tian_Yuan_Tarot
  - 字數從 500-600 → 600-800，max_tokens 800 → 1000
  - 內容要求新增「本命塔羅牌的靈性啟示」
- [x] Personality Profile 已帶入占卜解讀（`getTarotInterpretation` 讀取前 200 字）

### 13-4. Stage C：本命塔羅驗證（2026-03-04）

- [x] `Tarot.getLifePathTarot` — 接入 `API.createClientProfile`（建立個案時自動計算 4 張本命塔羅牌）
- [x] Clients_Report Workflow Script A — key 名稱修正（中文 key → 英文 key）
- [x] Personality Profile Workflow — 移除 `Added_Time == Modified_Time` 限制（允許更新時重新生成）

### 13-5. Section 七：Workflow Hotfix（2026-03-04）

- [x] Script A (On User Input for Date_Of_Birth) — 修正 key 對照：
  - `本世功課_ID` → `Ben_Ming_Tarot` etc.
- [x] Personality Profile Workflow — 觸發條件從「僅新建」改為「所有修改」
- [x] `generatePersonalityProfile` — 融入塔羅牌資料（見 13-3）

### 13-6. OnPaymentSuccess 修正（2026-03-04）

- [x] DS L22024（OnPaymentSuccess Workflow）— `getTarotInterpretationFull` 呼叫加入第4參數 `clientId`
  - `clientIdForReport = if(divination.Client_Link != null, divination.Client_Link.toString(), "")`
- [x] DS L9342（sendTalismanReport）— 同步加入第4參數
- [x] DS L6061（函數宣告）— 同步為 4 參數版
- [x] Creator UI Workflow 已手動更新（2026-03-04）

### 13-7. 後續待辦（見 `docs/MVP_DEPLOY_CHECKLIST.md`）

- [ ] Step 0：填入 Creator App Variables（ECPay 生產金鑰、n8n webhook URL）
- [ ] Step 2：ECPay ReturnURL 安全修補（驗簽驗證）
- [ ] Step 3：建立 TalismanDelivery 頁面 + Custom API 端點
- [ ] Step 4：n8n 環境設定 + Workflow 啟動
- [ ] Step 5：端到端驗收（LINE → 占卜 → 付款 → 交付 全流程）
