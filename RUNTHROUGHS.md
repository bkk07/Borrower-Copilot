# Borrower Copilot — Verified Run-Throughs

> **How to reproduce:** Home → *Try the three test borrowers* (Priya / Ravi / Anita) → Review → Results.
> Or programmatically: `draftToProfile(preset) → evaluate(profile)` in `src/rules/`.
> Headlines are rounded for readability (`₹12–16L`); expand `Show exact numbers` for precise `₹12,42,501–₹16,81,031`.

---

## 1. Priya, 29 — Bengaluru, Salaried → Borrow

**Profile:** Software engineer, 5 years at MNC. Wants **₹8,00,000** for *Planned personal / family expense*, unsecured personal loan. The "clean" borrower — tests the happy path still requires two numbers.

**Answers (12 asked, adaptive salaried path):**
Purpose *Planned personal / family expense* · Amount ₹8,00,000 · Type Personal · Income type Salaried → *Years 5, Variable pay not stated* → **Income ₹1,10,000 (documented)** · **Existing EMI ₹14,000** · **Expenses ₹40,000 (confirmed)** · Age 29 · Credit known **780 (Good)** · Savings buffer *Not sure* → EMI horizon not asked (single EMI >6m default)

**Engine trace:**
- Blended Income = ₹1,10,000 (fully documented)
- `FCF = 1,10,000 − 14,000 − 40,000 − 11,000 (10% buffer) = ₹45,000`
- `Safe EMI = 45,000 × 0.8 = ₹36,000`
- Requested EMI = ₹8L at **fair-mid 11.6% / 48 mo = ~₹20,891/mo** — inside safe ceiling with **₹15k headroom**

| Output | What the Borrower Sees | Exact Detail |
|---|---|---|
| **O1 Should you borrow?** | **Borrow** | *The requested ₹8L needs about ₹20,891/mo — inside your safe EMI of ₹36,000/mo with margin.* |
| **O2 Possible lender sanction** | **₹13–18 lakh** | FOIR 45% × ₹1,10,000 − ₹14,000 = ₹35,500/mo → 60 mo @ 13% (precise ₹13,26,195–₹17,94,263) |
| **O2 Safer borrowing range** | **₹12–16 lakh** | Cash-flow: ₹36,000/mo → 48 mo @ 11.6% (precise ₹11,71,811–₹15,85,391) — **use this** |
| **O3 What's a fair rate?** | **10.8–12.3%** | Approx. all-in **~14.6%** (`1% fee` over 4y) — band narrowed to 75% by `Medium` confidence |
| **O4 EMI** | **Requested ~₹20,891 vs Max safe ~₹36,000** + What-if slider → drag `₹4L→₹12L` fits; tenure table at safer amount (24/36/48/60) | Waterfall bar shows `₹36k ×0.8` breathing room |
| **Stress Lab** | **Pass / Pass** (drag to `−30% / +3pp` still shows when it would flip) | Income −20% → FCF ₹25,200 still covers ₹20,891 · Rate +2pp → still ≤ safe |
| **Confidence** | **Medium** | Only buffer unknown; waterfall shows documented income → narrow range earned |
| **12-mo strip** | No relief — single EMI horizon `>6m`, no dot strip | Horizon question skipped (single EMI) |

**Negotiation Card (copy / save as image):**
```
BORROWER NEGOTIATION CARD
────────────────────────
Requested: ₹8,00,000 for planned personal / family expense
Possible lender range: ₹13–18 lakh
Safer borrowing range: ₹12–16 lakh
Fair rate estimate: 10.8–12.3%
Approx. all-in annual cost: ~14.6% (estimate, actual depends on lender fees)
Requested-loan EMI: ~₹20,891/month
Maximum comfortable EMI: ~₹36,000/month
Why: The requested ₹8,00,000 needs about ₹20,891/month — inside your safe EMI of ₹36,000/month with margin.
Could you offer ≤12.3% at ~1% fee? My fair range is 10.8–12.3%.
If they say 14%, reply: "My fair range is 10.8–12.3%, and my max comfortable EMI is ₹36,000/mo. Can we structure to that?"
Confidence: Medium
```

---

## 2. Ravi, 42 — Mysuru, Self-Employed + Property → Borrow Less (Secured Lane)

**Profile:** Kirana store 14 years. **ITR ₹4,20,000/yr + cash ₹40,000–80,000/mo**, owns shop **₹45L unencumbered**. Wants **₹15,00,000** to *Start or grow my income*. Tests the LTV trap — ITR-only math would say `~₹5L`.

**Answers (14 asked + horizon):**
Purpose *Start or grow my income* · Amount ₹15,00,000 · Type **Business / Secured** · Income type Self-employed → *Business 14y, ITR ₹4,20,000, Cash ₹40k–₹80k, Asset Yes, Value ₹45L, Not pledged* → **Existing EMI 0** → *Horizon skipped (no EMI)* · **Expenses not provided → estimated 40%** · Age 42 · Credit **Unknown** · Buffer *Not sure*

**The routing trap avoided:**
Naive `FOIR 40% × ₹35,000 (ITR/12) = ₹14,000/mo → ~₹5–6L` would reject him. Because collateral is free, app routes to **Secured / Business lane**:
- Blended Income = `₹35,000 + ₹60,000 (mid-cash) × 0.5 = ₹65,000`
- Lender: `FOIR 55% → ₹35,750/mo → ~₹20.2L @ 12% / 84 mo`, but **LTV cap 50% × ₹45L = ₹22.5L** applies → capped
- Borrower: `FCF = 65,000 − 0 − 26,000 (40% est.) − 6,500 (10%) = ₹32,500 → Safe EMI = ₹26,000`

| Output | What the Borrower Sees | Detail |
|---|---|---|
| **O1** | **Borrow Less** | *You can afford something — just not the full ₹15L. Safe ₹26,000 < needs ₹26,680/mo.* |
| **O2 Possible lender sanction** | **₹17–23 lakh** | Secured lane, LTV-capped (precise ₹17,21,405–₹23,28,959) |
| **O2 Safer borrowing range** | **₹12–17 lakh** | **Use this, not sanction** (precise ₹12,42,501–₹16,81,031) |
| **O3 Fair rate** | **11.3–13.2%** | Approx. all-in ~14% — Unknown → widest band, narrowed to 75% by Medium |
| **O4 EMI** | **Requested ~₹26,680 vs Safe ~₹26,000** | What-if slider: drag to `₹13L → ~₹23k fits` · Tenure grid 36/60/84/120 mo (longer is normal for secured) |
| **Stress Lab** | **Tight / Pass** — drag Income −30% → Fail | Income −20% → FCF ₹20,800 vs ₹26,680 = **Tight** *(proceed carefully)*; Rate +2pp → still ≤ safe when dragged to 2pp, Tight at 3pp |
| **Confidence** | **Medium** | Expenses estimated, credit unknown, buffer unknown |

**Negotiation Card:** *Possible vs Safer* shown + *Could you offer ≤13.2% at ~1% fee? My fair range is 11.3–13.2%.* + rehearsal line.

---

## 3. Anita, 35 — Hubballi, Informal / Gig → Don't Borrow

**Profile:** Delivery rider + tailoring, **₹26,000–30,000 variable**, 2 children, husband unemployed 8 months, **sole earner**, **3 app loans ₹35,000 outstanding @30%+**, **bounce last month**. Wants **₹1,50,000** for *Income-generating asset* (e-scooter). Tests honesty — and the new EMI-tenure aware relief.

**Answers (15 asked + horizon):**
Purpose *Income-generating asset* · Amount ₹1,50,000 · Type Small-ticket / informal · Income type Gig → *Stability Variable, Existing loans 3, Bounce Yes, Sole earner Yes* → **Income ₹26–30k (range)** · **Existing debt ~₹3,500/mo** → *Horizon: Not sure* (3 loans, mixed) · **Expenses not provided → estimated ₹17,850 (60% +15pp sole-earner uplift)** · Age 35 · Credit Unknown · Buffer Not sure

**Engine trace:**
- Safe Income = `mid ₹28,000 × 0.85 (variable) = ₹23,800`
- `FCF = 23,800 − 3,500 − 17,850 − 3,570 (15% sole-earner buffer) = −₹1,120 → Safe EMI ₹0`
- Bounce adds `+1` penalty and amber warning, but `Don't Borrow` is driven by **negative FCF**, not bounce alone

| Output | What the Borrower Sees | Detail |
|---|---|---|
| **O1** | **Don't Borrow** | *Nothing left monthly; recent bounce increases repayment risk. Fix old repayments before adding a new EMI.* |
| **O2 Possible lender sanction** | **₹1.3–2.1 lakh** | Small-ticket lenders check little — shown for honesty with note: *A lender may still offer a loan, but that does not mean it is affordable* |
| **O2 Safer borrowing range** | **≈ ₹0 today** | No headroom |
| **O3** | **15–18%** | Approx. all-in ~24.5% — shown for reference, headline is Don't Borrow |
| **O4** | **Requested ~₹5,311/mo vs Max safe ₹0** | No headroom — Pause plan shown: *Clear high-rate loans first — frees ~₹3,500/mo* + *+₹3.5k relief* would not yet make it affordable |
| **Stress Lab** | **Fail / Fail** — drag confirms no headroom even at 0% | Income −20% → FCF −₹5,404 |
| **Confidence** | **Low** + Bounce + Horizon unknown | Range income + estimated expenses/debt cost, no docs, horizon Not sure |
| **Extra** | Consolidation note + bounce warning + 12-dot relief strip (3 short loans) | |

**Negotiation Card** is a *wait-and-fix* sheet — Possible lender range shown for transparency, Safer range emphasized as `≈ ₹0`.

> **Note on the e-scooter:** Doubling deliveries is a real possible benefit, but unverifiable in rules, so it never inflates the numbers. The app mentions it qualitatively, never as a hard calculation.

---

### The Multiple-EMI Example (New)

**Borrower: ₹90k income, ₹33k total EMI as `₹20k/>2y + ₹10k/6–12m + ₹3k/<6m`**

- **Old system (single total):** `FCF = 90k − 33k − est. − buffer = tight` → same result whether loans end tomorrow or in 3 years.
- **New system:** Asks horizon → breakdown `EMI 2: ₹10k — 6–12m, EMI 3: ₹3k — Within 6m`. Computes `expiringRelief = ₹13k`. **Today:** `Safe EMI` on `FCF` (still uses today's ₹33k). **Display:** *After relief: Once ₹10k ends 6–12 months (₹13k/mo) ends, headroom → ~₹X safe* + 12-dot strip `●●●●●●○○○○○○ ₹33k now → ₹20k after 6m`. Verdict stays on today; relief is honesty, not optimism. Skipping the breakdown → `unknown` horizon → `+0.5` confidence penalty, no relief assumed.

---

### How to Reproduce Any Case

1. **UI:** `npm run dev` → Home → *Try the three test borrowers* → pick one → *Review* (tap any row to edit horizon/breakdown) → *See my results*
2. **Console:** `import {draftToProfile} from './src/data/questions.js'; import {evaluate} from './src/rules/verdict.js'; evaluate(draftToProfile(PRESETS.priya))` — inspect `verdict`, `sanction`, `safe`, `rate`, `stress`, `confidence`, `cf.expiring`, `card`.
