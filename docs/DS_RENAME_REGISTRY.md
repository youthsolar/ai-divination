# AI易經.ds 函數改名對照表（Rename Registry）

> 產出日期：2026-02-25
> DS 檔案：25,652 行、79 個函數（DS 內）+ 11 個 standalone .deluge
> 重寫後目標：91 個函數（移除 6 個廢棄）+ 10 個 standalone .deluge

---

## 一、全函數清單（79 個 DS 內函數）

### 按模組分類

| # | 模組 | 現有函數名稱 | 新函數名稱 | 行號 | 需改名 | 呼叫點數 |
|---|------|------------|-----------|------|--------|---------|
| 1 | AIInterpreter | checkCooldownStatus | — | 4592 | — | |
| 2 | AIInterpreter | classifyQuestionType | — | 4822 | — | |
| 3 | AIInterpreter | compareQuestionSimilarity | — | 4933 | — | |
| 4 | AIInterpreter | generatePersonalityProfile | — | 5074 | — | |
| 5 | AIInterpreter | generateTalismanExplanation | — | 5328 | — | |
| 6 | AIInterpreter | getGenderFromName | — | 5556 | — | |
| 7 | AIInterpreter | getPersonalizedInterpretation | — | 5640 | — | |
| 8 | AIInterpreter | getPredictionByQuestionAndBirthday_v2 | — | 5790 | — | |
| 9 | AIInterpreter | ~~getMvpDivination_v1~~ | **移除** | 6055 | 🗑️ | 0 |
| 10 | AIInterpreter | ~~getTarotInterpretation~~ | **移除** | 6132 | 🗑️ | 0 |
| 11 | AIInterpreter | getTarotInterpretationFull | — | 6388 | — | |
| 12 | AIInterpreter | getTarotInterpretation_v2 | — | 6632 | — | |
| 13 | API | ~~CreateClientProfile~~ | **createClientProfile** | 6680 | ✅ | 0（入口） |
| 14 | API | ~~CreateTalismanOrder~~ | **移除**（合併入 v2） | 7159 | 🗑️ | 1 |
| 15 | API | ~~CreateTalismanOrder_v2~~ | **createTalismanOrder** | 7382 | ✅ | 0（入口） |
| 16 | API | jsonEscape | — | 7413 | — | |
| 17 | API | ~~LINE_PushText~~ | **linePushText** | 7429 | ✅ | 2 |
| 18 | API | ~~LIFF_Divination_MVP~~ | **liffDivinationMvp** | 7472 | ✅ | 0（入口） |
| 19 | API | ~~ECPayReturn~~ | **ecPayReturn** | 7653 | ✅ | 0（入口） |
| 20 | API | generatePersonalityProfile | — | 7872 | — | |
| 21 | Bazi | calculatePreciseDayPillar | — | 7966 | — | |
| 22 | Bazi | calculatePreciseHourPillar | — | 8031 | — | |
| 23 | Bazi | calculatePreciseMonthPillar | — | 8156 | — | |
| 24 | Bazi | calculatePreciseYearPillar | — | 8304 | — | |
| 25 | Bazi | getDivinationTimeDetails | — | 8440 | — | |
| 26 | Bazi | ~~PreciseBaziCalculator~~ | **preciseBaziCalculator** | 8506 | ✅ | **16** |
| 27 | CRM | syncContact | — | 8604 | — | |
| 28 | ECPay | ~~generateCheckMacValue_private~~ | **generateCheckMacValue** | 8744 | ✅ | 5 |
| 29 | ECPay | generateCheckoutConfirmationPage | — | 8796 | — | |
| 30 | ECPay | generateCheckoutForm_Production | — | 8855 | — | |
| 31 | ECPay | generateECPayCheckoutForm | — | 8985 | — | |
| 32 | ECPay | generatePaymentLink | — | 9048 | — | |
| 33 | ECPay | handleECPayResponse | — | 9150 | — | |
| 34 | ECPay | processFlowCallback | — | 9201 | — | |
| 35 | ECPay | publicWebhook | — | 9274 | — | |
| 36 | ECPay | ~~simulateECPayCallback~~ | **移除** | 9357 | 🗑️ | 0 |
| 37 | Email | sendTalismanReport | — | 9442 | — | |
| 38 | Flow | triggerTarotFlowProcessor | — | 9707 | — | |
| 39 | Gamma | generateReportFromLog | — | 9879 | — | |
| 40 | GuaCalculator | ~~BaziToBitSequence~~ | **baziToBitSequence** | 9972 | ✅ | 2 |
| 41 | GuaCalculator | ~~BitToHexagramCode~~ | **bitToHexagramCode** | 10020 | ✅ | 2 |
| 42 | GuaCalculator | getHexagramBySolarBirthday | — | 10106 | — | |
| 43 | Hexagram | fetchHexagram | — | 10114 | — | |
| 44 | Hexagram | getHexagramByYaoCode | — | 10131 | — | |
| 45 | IChing | calculateHexagram | — | 10169 | — | |
| 46 | IChing | getDivinationResult | — | 10325 | — | |
| 47 | IChing | getHexagramDetails | — | 10383 | — | |
| 48 | LunarAI | calculateLunarDetails | — | 10451 | — | |
| 49 | LunarAI | convertToBaZi | — | 10609 | — | |
| 50 | LunarAI | createSixtyGanZhiTable | — | 10669 | — | |
| 51 | LunarAI | debugSolarToLunar | — | 10905 | — | |
| 52 | LunarAI | getBaziConstants | — | 10973 | — | |
| 53 | LunarAI | ~~GetCurrentTimeBazi~~ | **getCurrentTimeBazi** | 11039 | ✅ | 1 |
| 54 | LunarAI | getDayPillar | — | 11050 | — | |
| 55 | LunarAI | getHourPillar | — | 11112 | — | |
| 56 | LunarAI | getLunarMonthStructure | — | 11253 | — | |
| 57 | LunarAI | getMonthPillar | — | 11422 | — | |
| 58 | LunarAI | ~~GetSolarDateTimeBazi~~ | **getSolarDateTimeBazi** | 11498 | ✅ | 1 |
| 59 | LunarAI | getSolarTermsDataMap | — | 11507 | — | |
| 60 | LunarAI | getYearPillar | — | 15589 | — | |
| 61 | LunarAI | ~~LunarToWords~~ | **lunarToWords** | 15683 | ✅ | 0（孤兒） |
| 62 | LunarAI | ~~LunarWordsToBazi~~ | **lunarWordsToBazi** | 15779 | ✅ | 0（孤兒） |
| 63 | LunarAI | ~~SolarToLunar~~ | **solarToLunar** | 15863 | ✅ | **10** |
| 64 | LunarAI | ~~TestConvertSolarToLunar~~ | **testConvertSolarToLunar** | 15889 | ✅ | 0（測試） |
| 65 | LunarAI | updateGanZhiProperties | — | 16438 | — | |
| 66 | LunarData | getConstants | — | 16502 | — | |
| 67 | ~~OpenAI~~ | ~~callAssistant~~ | **LLM.callChat**（合併取代） | 16878 | 🔄 | 1 |
| 68 | ~~OpenAI~~ | ~~callChatGPT~~ | **LLM.callChat**（合併取代） | 17096 | 🔄 | 5+ |
| 69 | ~~OpenAI~~ | ~~combineDivinationPrompt~~ | **LLM.combineDivinationPrompt** | 17169 | 🔄 | 1 |
| 70 | SolarTerms | clearAllDayHourPillars | — | 17191 | — | |
| 71 | SolarTerms | populateNext3Batches | — | 17255 | — | |
| 72 | SolarTerms | populateSolarTermsDayHourPillars | — | 17607 | — | |
| 73 | Star | getLunarMansion | — | 18041 | — | |
| 74 | Talisman | generateTalismanExplanation | — | 18099 | — | |
| 75 | Talisman | getBasicRecommendation | — | 18218 | — | |
| 76 | Talisman | getCompleteRecommendation | — | 18321 | — | |
| 77 | Talisman | getRecommendationReason | — | 18406 | — | |
| 78 | Talisman | getTalismanRecommendation | — | 18477 | — | |
| 79 | Tarot | completeTarotDivination | — | 18584 | — | |
| 80 | Tarot | determinePrimaryCard | — | 18739 | — | |
| 81 | Tarot | drawRandomSpread | — | 18901 | — | |
| 82 | Tarot | getLifePathTarot | — | 18975 | — | |
| 83 | Tarot | getPositionMeanings | — | 19058 | — | |
| 84 | Tarot | getPrimaryTalismanForSalesIQ | — | 19167 | — | |
| 85 | Tarot | ~~TarotDivinationFunction~~ | **tarotDivinationFunction** | 19313 | ✅ | 3 |
| 86 | TEST | ~~sendSampleDataToFlow~~ | **移除** | 19776 | 🗑️ | 0 |
| 87 | Tools | getTimezoneFromIP | — | 19814 | — | |
| 88 | Tools | populateTaisuiDeityNames | — | 19877 | — | |
| 89 | Training | generateVirtualClient | — | 20004 | — | |
| 90 | Webhook | ~~handleECPayReturn~~ | **移除** | 20162 | 🗑️ | 0* |
| 91 | Webhook | handleSimplyBook | — | 20250 | — | |
| 92 | Webhook | processChatMessage | — | 20306 | — | |
| 93 | Widget | getBirthSelectorHTML | — | 20490 | — | |
| 94 | Zodiac | getChineseZodiacSign | — | 20519 | — | |
| 95 | Zodiac | getTaisuiStatus | — | 20607 | — | |
| 96 | Zodiac | getZodiacSign | — | 20733 | — | |

> *handleECPayReturn 的唯一呼叫者 simulateECPayCallback 也要移除，故安全。

---

## 二、Standalone .deluge 函數（不在 DS 內）

| # | 檔案 | 現有名稱 | 新名稱 | 備註 |
|---|------|---------|--------|------|
| 1 | API.bindLineUser.deluge | API.BindLineUser | API.bindLineUser | ✅ 已改名 |
| 2 | API.getTalismanByToken.deluge | API.GetTalismanByToken | API.getTalismanByToken | ✅ 已改名 |
| 3 | API.predictFromLine.deluge | API.PredictFromLine_v1 | API.predictFromLine | ✅ 已改名（n8n 後續重新對接） |
| 4 | API.deliveryPushCallback.deluge | API.DeliveryPushCallback_v1 | API.deliveryPushCallback | ✅ 已改名（外部整合後續重新對接） |
| 5 | Calendar.normalizeTime.deluge | Calendar.normalizeTime.* | **已拆分** | 拆為 3 個獨立函數 |
| 6 | API.PublishCallback_v1.deluge | — | **保留原名** | content-factory |
| 7 | API.QueueNewsRemake_v1.deluge | — | **保留原名** | content-factory |
| 8 | API.QueueVoiceCopy_v1.deluge | — | **保留原名** | content-factory |
| 9 | API.QueueWeeklyFortune_v1.deluge | — | **保留原名** | content-factory |
| 10 | TalismanDelivery.htmlpage.deluge | — | **保留原名** | HTML page |
| 11 | LIFFBinding.htmlpage.deluge | — | **保留原名** | HTML page |

---

## 三、需改名的 16 個函數 — 詳細呼叫點地圖

### 3-1. `Bazi.PreciseBaziCalculator` → `Bazi.preciseBaziCalculator`（16 個呼叫點）

| 呼叫行號 | 所在函數 | 呼叫程式碼 |
|---------|---------|-----------|
| 6931 | API.CreateClientProfile | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 8690 | CRM.syncContact | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 10229 | IChing.calculateHexagram | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 10230 | IChing.calculateHexagram | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21299 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21311 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21408 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21419 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21481 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 21491 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22313 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22325 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22422 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22433 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22495 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| 22505 | Zodiac.getZodiacSign | `thisapp.Bazi.PreciseBaziCalculator(...)` |
| **+** | **standalone: API.BindLineUser.deluge** | 行 141, 175 |

### 3-2. `LunarAI.SolarToLunar` → `LunarAI.solarToLunar`（10+2 個呼叫點）

| 呼叫行號 | 所在函數 | 呼叫程式碼 |
|---------|---------|-----------|
| 7013 | API.CreateClientProfile | `thisapp.LunarAI.SolarToLunar(...)` |
| 8698 | CRM.syncContact | `thisapp.LunarAI.SolarToLunar(...)` |
| 10926 | LunarAI.debugSolarToLunar | `thisapp.LunarAI.SolarToLunar(...)` |
| 11044 | LunarAI.GetCurrentTimeBazi | `thisapp.LunarAI.SolarToLunar(...)` |
| 11501 | LunarAI.GetSolarDateTimeBazi | `thisapp.LunarAI.SolarToLunar(...)` |
| 18066 | Star.getLunarMansion | `thisapp.LunarAI.SolarToLunar(...)` |
| 21407 | Zodiac.getZodiacSign | `thisapp.LunarAI.SolarToLunar(...)` |
| 21417 | Zodiac.getZodiacSign | `thisapp.LunarAI.SolarToLunar(...)` |
| 22421 | Zodiac.getZodiacSign | `thisapp.LunarAI.SolarToLunar(...)` |
| 22431 | Zodiac.getZodiacSign | `thisapp.LunarAI.SolarToLunar(...)` |
| **+** | **standalone: API.BindLineUser.deluge** | 行 139, 173 |

### 3-3. `ECPay.generateCheckMacValue_private` → `ECPay.generateCheckMacValue`（5 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 7701 | API.ECPayReturn |
| 8846 | ECPay.generateCheckoutConfirmationPage |
| 8908 | ECPay.generateCheckoutForm_Production |
| 9033 | ECPay.generateECPayCheckoutForm |
| 9429 | ECPay.simulateECPayCallback（將移除） |

### 3-4. `Tarot.TarotDivinationFunction` → `Tarot.tarotDivinationFunction`（3 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 6093 | AIInterpreter.getMvpDivination_v1（將移除） |
| 18646 | Tarot.completeTarotDivination |
| 22616 | Zodiac.getZodiacSign |
| **+** | **standalone: API.PredictFromLine_v1.deluge** 行 205 |

### 3-5. `API.LINE_PushText` → `API.linePushText`（2 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 7630 | API.LIFF_Divination_MVP |
| 7844 | API.ECPayReturn |

### 3-6. `GuaCalculator.BaziToBitSequence` → `GuaCalculator.baziToBitSequence`（2 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 10023 | GuaCalculator.BitToHexagramCode |
| 10025 | GuaCalculator.BitToHexagramCode |

### 3-7. `GuaCalculator.BitToHexagramCode` → `GuaCalculator.bitToHexagramCode`（2 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 5828 | AIInterpreter.getPredictionByQuestionAndBirthday_v2 |
| 10110 | GuaCalculator.getHexagramBySolarBirthday |

### 3-8. `LunarAI.GetCurrentTimeBazi` → `LunarAI.getCurrentTimeBazi`（1 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 10024 | GuaCalculator.BitToHexagramCode |

### 3-9. `LunarAI.GetSolarDateTimeBazi` → `LunarAI.getSolarDateTimeBazi`（1 個呼叫點）

| 呼叫行號 | 所在函數 |
|---------|---------|
| 10022 | GuaCalculator.BitToHexagramCode |

### 3-10 ~ 3-16.（無呼叫者的函數，改名僅改宣告 + Microservices endpoint handler）

| 函數 | 類型 |
|------|------|
| API.CreateClientProfile → API.createClientProfile | 入口函數（Microservices endpoint handler 需更新） |
| API.CreateTalismanOrder_v2 → API.createTalismanOrder | 入口函數（合併 v1，endpoint handler 需更新） |
| API.LIFF_Divination_MVP → API.liffDivinationMvp | 入口函數（endpoint handler 需更新） |
| API.ECPayReturn → API.ecPayReturn | 入口函數（endpoint handler 需更新） |
| LunarAI.LunarToWords → LunarAI.lunarToWords | 孤兒函數（零呼叫者，保留備用） |
| LunarAI.LunarWordsToBazi → LunarAI.lunarWordsToBazi | 孤兒/原型函數（回傳硬編碼值） |
| LunarAI.TestConvertSolarToLunar → LunarAI.testConvertSolarToLunar | 測試函數 |

---

## 四、廢棄函數移除清單（6 個）

| # | 函數 | 行號 | 呼叫者 | 移除策略 |
|---|------|------|--------|---------|
| 1 | AIInterpreter.getMvpDivination_v1 | 6055 | 0 | 直接移除 |
| 2 | AIInterpreter.getTarotInterpretation | 6132 | 0 | 直接移除（v2 + Full 版已取代） |
| 3 | API.CreateTalismanOrder (v1) | 7159 | 1（v2 呼叫） | 合併 v1 邏輯進 v2 → 刪除 v1 |
| 4 | ECPay.simulateECPayCallback | 9357 | 0 | 直接移除 |
| 5 | Webhook.handleECPayReturn | 20162 | 1（simulateECPayCallback，也移除） | 與 #4 一起移除 |
| 6 | TEST.sendSampleDataToFlow | 19776 | 0 | 直接移除 |

---

## 五、改名的 Creator IDE 部署順序（先建後刪）

### Phase 1：建立新命名函數（由 Layer 0 往上）

```
順序 1：LunarAI.solarToLunar（新）
順序 2：LunarAI.getCurrentTimeBazi（新）
順序 3：LunarAI.getSolarDateTimeBazi（新）
順序 4：LunarAI.lunarToWords（新）
順序 5：LunarAI.lunarWordsToBazi（新）
順序 6：LunarAI.testConvertSolarToLunar（新）
順序 7：GuaCalculator.baziToBitSequence（新）
順序 8：GuaCalculator.bitToHexagramCode（新）
順序 9：Bazi.preciseBaziCalculator（新）
順序 10：ECPay.generateCheckMacValue（新）
順序 11：Tarot.tarotDivinationFunction（新）
順序 12：API.linePushText（新）
順序 13：API.createClientProfile（新）
順序 14：API.createTalismanOrder（新，含合併後 v1 邏輯）
順序 15：API.liffDivinationMvp（新）
順序 16：API.ecPayReturn（新）
```

### Phase 2：更新呼叫端（由 Layer 5 往下）

```
順序 1：Zodiac.getZodiacSign → 更新 16 個 PreciseBaziCalculator + 4 個 SolarToLunar + 1 個 TarotDivinationFunction
順序 2：Star.getLunarMansion → 更新 1 個 SolarToLunar
順序 3：IChing.calculateHexagram → 更新 2 個 PreciseBaziCalculator
順序 4：GuaCalculator.bitToHexagramCode → 更新 2 個 BaziToBitSequence + 1 個 GetCurrentTimeBazi + 1 個 GetSolarDateTimeBazi
順序 5：GuaCalculator.getHexagramBySolarBirthday → 更新 1 個 BitToHexagramCode
順序 6：AIInterpreter.getPredictionByQuestionAndBirthday_v2 → 更新 1 個 BitToHexagramCode
順序 7：Tarot.completeTarotDivination → 更新 1 個 TarotDivinationFunction
順序 8：API.ECPayReturn → 更新 1 個 generateCheckMacValue_private + 1 個 LINE_PushText
順序 9：API.LIFF_Divination_MVP → 更新 1 個 LINE_PushText
順序 10：ECPay 模組內部（3 函數）→ 更新 3 個 generateCheckMacValue_private
順序 11：CRM.syncContact → 更新 1 個 PreciseBaziCalculator + 1 個 SolarToLunar
順序 12：API.CreateClientProfile → 更新 1 個 PreciseBaziCalculator + 1 個 SolarToLunar
順序 13：LunarAI.debugSolarToLunar → 更新 1 個 SolarToLunar
順序 14：LunarAI.GetCurrentTimeBazi → 更新 1 個 SolarToLunar
順序 15：LunarAI.GetSolarDateTimeBazi → 更新 1 個 SolarToLunar
```

### Phase 3：更新 standalone .deluge 檔案

```
API.bindLineUser.deluge → 更新 2 個 SolarToLunar + 2 個 PreciseBaziCalculator
API.predictFromLine.deluge → 更新 1 個 TarotDivinationFunction
```

### Phase 4：更新 Microservices endpoint handlers（手動，約 12 個）

```
CreateClientProfile → createClientProfile
CreateTalismanOrder_v2 → createTalismanOrder
LINE_PushText → linePushText
LIFF_Divination_MVP → liffDivinationMvp
ECPayReturn → ecPayReturn
BindLineUser → bindLineUser
GetTalismanByToken → getTalismanByToken
PredictFromLine_v1 → predictFromLine
DeliveryPushCallback_v1 → deliveryPushCallback
```

### Phase 5：刪除舊命名函數（確認無任何引用後）

---

## 六、已知 Bug 修正清單

### 6-A. 原有 Bug

| # | Bug 描述 | 位置 | 修正方式 |
|---|---------|------|---------|
| 1 | `subString()` 無邊界檢查 | L10006（GuaCalculator）、L19042（Tarot） | 加 `pillar.length() >= 2` 前置檢查 |
| 2 | check-then-insert 競態條件 | L18613（Tarot）、L7509（API） | 加 insert 後二次查詢驗證 + info 日誌 |
| 3 | catch 吞錯無日誌 | L8240（Bazi） | 加 `info` 記錄 Calendar fallback |
| 4 | 空 clientId 繞過冷卻 | L5842（AIInterpreter） | 加 `clientId == ""` 前置擋回 |

### 6-B. 節氣影響八字計算 Bug（本次新增查修）

> 來源：DECISIONS.md、AI-Divination_MASTER.md、project-progress.md、Cursor/OpenClaw 工作歷程

| # | Bug 描述 | 位置 | 嚴重性 | 修正方式 |
|---|---------|------|--------|---------|
| 5 | **年柱：未套用子時換日再比較立春** — 23:00-23:59 生人可能歸錯年 | `Bazi.calculatePreciseYearPillar` | 高 | 確保呼叫 `Calendar.applyZiHourDayRollover` 後再比較立春；移除 silent fallback |
| 6 | **月柱：未套用子時換日再比較節氣** — 同上邏輯影響月柱 | `Bazi.calculatePreciseMonthPillar` | 高 | 同上 |
| 7 | **特定生日八字計算超時** — SolarTerms 全表掃描 | `calculatePreciseMonthPillar` | 高 | 確認 450 天窗口查詢已生效；若未生效則加入窗口限制 |
| 8 | **lunarWordsToBazi 硬寫 1988 + 範例回傳** | `LunarAI.lunarWordsToBazi` | 中 | 實作干支→年份對應；接通 convertToBaZi 實際計算 |
| 9 | **虛歲計算錯誤** | 待定位 | 中 | 需確認虛歲計算邏輯位置後修正 |

> **架構決策**（DECISIONS.md 2026-02-06）：
> 子時換日口徑採 A（23:00 起算隔日），作為節氣/年柱/月柱/農曆新年邊界一致口徑。

---

## 七、OpenAI → Claude LLM 遷移記錄（2026-02-26）

### 遷移原因
1. OpenAI 額度用完（部署 Layer 0 時發現）
2. GPT-4 已被 OpenAI 正式下架
3. 用戶偏好 Claude Sonnet 的繁體中文語言表達風格

### 命名空間變更
- `OpenAI` → `LLM`（供應商中立，未來換模型只需改內部實作）
- `openai/` 目錄 → `llm/` 目錄（舊檔案移至 `DEPRECATED/`）

### Creator 變數變更

| 舊變數 | 新變數 | 新值 |
|--------|--------|------|
| `OpenAI.OpenAI_API_Key` | `LLM.LLM_API_Key` | `<Anthropic API Key>` |
| `OpenAI.OpenAI_API_URL` | `LLM.LLM_API_URL` | `https://api.anthropic.com/v1/messages` |
| `OpenAI.OpenAI_Model` | `LLM.LLM_Model` | `claude-sonnet-4-20250514` |
| `OpenAI.OpenAI_Assistant_ID` | **移除** | Assistants API 不再使用 |
| — | `LLM.LLM_API_Version`（新增） | `2023-06-01` |

### 新建函數

| 檔案 | 說明 |
|------|------|
| `llm/LLM.callChat.deluge` | 統一 Claude API 呼叫介面（~145 行） |
| `llm/LLM.combineDivinationPrompt.deluge` | 從 OpenAI 命名空間搬移（邏輯不變） |

### 已遷移的呼叫端（15 個檔案）

| # | 檔案 | 變更摘要 |
|---|------|---------|
| 1 | AIInterpreter.getGenderFromName | few-shot → system prompt，改呼叫 LLM.callChat |
| 2 | AIInterpreter.classifyQuestionType | 移除 boilerplate，改呼叫 LLM.callChat |
| 3 | AIInterpreter.compareQuestionSimilarity | 保留 fallback 邏輯，改呼叫 LLM.callChat |
| 4 | AIInterpreter.getPersonalizedInterpretation | 保留 fallback 回應，改呼叫 LLM.callChat |
| 5 | AIInterpreter.generateTalismanExplanation | 保留五行邏輯，改呼叫 LLM.callChat |
| 6 | AIInterpreter.generatePersonalityProfile | 移除 frequency/presence_penalty，改呼叫 LLM.callChat |
| 7 | AIInterpreter.getTarotInterpretationFull | 分離 system prompt，max_tokens 4000→5000 |
| 8 | AIInterpreter.getTarotInterpretation | 分離 system prompt，改呼叫 LLM.callChat |
| 9 | AIInterpreter.getPredictionByQuestionAndBirthday | 移除 Thread_ID 邏輯，callAssistant→callChat |
| 10 | API.ecPayReturn | 移除 model-switching，改用 opts.model=haiku |
| 11 | API.liffDivinationMvp | 改呼叫 LLM.callChat |
| 12 | API.createClientProfile | 性別預測改用 LLM.callChat（移除 invokeurl） |
| 13 | Talisman.generateTalismanExplanation | 移除 postUrl 直呼，改用 LLM.callChat |
| 14 | Training.generateVirtualClient | 移除 postUrl 直呼，改用 LLM.callChat |
| 15 | AI易經_rewritten.ds（變數區塊） | OpenAI.* → LLM.* |

### 已棄用移至 DEPRECATED/

| 檔案 | 原因 |
|------|------|
| `OpenAI.callAssistant.deluge` | 被 LLM.callChat 取代 |
| `OpenAI.callChatGPT.deluge` | 被 LLM.callChat 取代 |
| `OpenAI.combineDivinationPrompt.deluge` | 搬至 LLM 命名空間 |

### DS 內聯程式碼注意事項
> `AI易經_rewritten.ds` 中仍有約 20 處 `thisapp.variables.OpenAI.*` 的內聯引用
> （分佈在 AIInterpreter、Talisman、Training 等模組的 DS 區塊中）。
> 這些需在下次 DS 整體重組時一併更新。部署時以 `.deluge` 檔案為準。

---

## 八、策略決定（2026-02-25 更新）

### 核心策略
- **Creator 是根本引擎** — 本次重構以 Creator 為唯一核心，做到完美再對接外部系統
- **所有函數名稱可自由重新命名** — 外部系統（LINE, n8n, Zoho Flow, ECPay）都將重新對接
- **優先順序**：Creator 重構 → Zoho Flow → n8n（備援）→ LINE → ECPay → Zoho LandingPage
- **Microservice API/CORS**：Creator 部署完備後逐步建立，注意 GitHub Pages CORS 問題

### 外部系統備註
- n8n 為本機部署備援系統（不作產品主力），Zoho Flow 為主要 orchestration
- API 函數全部已改名（PredictFromLine_v1 → predictFromLine, DeliveryPushCallback_v1 → deliveryPushCallback），n8n 稍後重新對接
- 若需 GitHub / Cloudflare 等外聯權限會主動提出

---

## 九、統計摘要

| 項目 | 數量 |
|------|------|
| DS 內函數總數 | 79→91（移除 6，保留 73）+ 2（新增 LLM 模組）|
| Standalone .deluge | 11 |
| 需改名函數 | 16 + 3（OpenAI→LLM 命名空間遷移）|
| 需更新呼叫點 | ~42（DS 內）+ 5（standalone）+ 15（LLM 遷移） |
| 需移除廢棄函數 | 6 + 3（舊 OpenAI 模組） |
| 需修正 Bug | 9（4 原有 + 5 節氣相關） |
| 需更新 Microservices endpoint | ~8（Creator 完成後逐步處理） |
| LLM 遷移已完成 | ✅ 15 個檔案（2026-02-26） |
