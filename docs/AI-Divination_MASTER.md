# AI Divination — MASTER SPEC (Draft)

## Product core
- When users want divination: **心碎脆弱時**.
- Entry is minimal: **Gregorian birthday + question**.
- System derives: lunar birthday, BaZi, zodiac, constellation, lunar mansion, Tai Sui, solar terms.
- System chooses method (v1): **Tarot + I Ching**.
- System must include a **cooldown / calming mechanism** to prevent emotional repeated questions and preserve credibility.

## Monetization: Talisman sequence
- Talisman library: 300+ cards (not random); selection follows five-elements + solar terms.
- Price: NT$360 per talisman.
- For the same question/result, user may repurchase **1 talisman every 7–14 days** due to changing solar terms.
- Max sequence length: **5 talismans** (progress 1→5).

## Data model anchors (Zoho Creator)
- `Clients_Report` — client profile.
- `Divination_Logs` — main divination record:
  - question, question type, method, timestamp
  - tarot spread (1–5 cards + reversed flags + position meanings)
  - hexagram link, interpretation (short/full), pdf link
  - talisman progress index (0–5), status
  - `Thread_ID` for continuous conversation
- `Talisman_Purchases` — purchase + payment + expiry + sequence.
- Dictionaries:
  - `All_Tarot_Cards`, `I_Ching_Form`, `SolarTerms`, `LunarData`, stems/branches/60 ganzhi, lunar mansions, zodiac, elements.

## Decision logic (high level)
1) Input: birthday + question.
2) Derive metaphysics context (zodiac/solar terms/etc) + question type.
3) Apply cooldown rules.
4) Choose method: Tarot or I Ching.
5) Produce reading and map to talisman candidate(s).
6) Offer talisman sequence purchase with 7–14 day gating, max 5.

## Cooldown rules (from code)
- 3 days: block same/high-similarity question (>=0.8).
- 6 hours: block same question type.
- 24 hours: max 2 distinct types.

## Calendar policy (important)
- **Zi-hour day rollover (子時換日) = ON**: 23:00–23:59 is treated as the next day for day-based pillars and boundary checks.
- Known TODO (legacy note): solar-term vs lunar-new-year boundary around pre/post CNY needs consistent handling with Zi-hour rollover.

## Open questions to finalize
- How to generate hexagram / tarot draw deterministically (random seed, time-based, user interaction)?
- Talisman selection: mapping table vs AI ranking vs hybrid.
- Exact gating: 7 vs 14 days rule per type/level? (product policy)
