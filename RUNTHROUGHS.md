# Borrower Copilot — Verified Run-Throughs

> **How to reproduce:** Home → *Try the three test borrowers* (Priya / Ravi / Anita) → Review → Results. Or programmatically: `draftToProfile(preset) → evaluate(profile)` in `src/rules/`.

All numbers below are engine output, not mockups. Headlines are rounded for readability (`₹12–16L`); details expand to precise `₹12,42,501–₹16,81,031` on click.

---

## 1. Priya, 29 — Bengaluru, Salaried → Borrow

**Profile:** Salaried software engineer, 5 years at MNC. Wants ₹8,00,000 for *Planned personal / family expense* (wedding-type), unsecured personal loan.

**Answers (12 asked, adaptive salaried path):**
Purpose *Planned personal / family expense* · Amount ₹8,00,000 · Loan type Personal · Income type Salaried → *Years worked 5, Variable pay not stated* → Income ₹1,10,000 (documented) · Existing EMI ₹14,000 · Expenses ₹40,000 (confirmed) · Age 29 · Credit known 780 (Good) · Savings buffer Not sure

**Engine trace:**
- Blended Income = ₹1,10,000 (fully documented)
- `FCF = 1,10,000 − 14,000 − 40,000 − 11,000 (10% buffer) = ₹45,000`
- `Safe EMI = 45,000 × 0.8 = ₹36,000`
- Requested EMI = ₹8L at fair-mid 11.6% / 48 mo = **~₹20,891/mo** (inside safe ceiling with margin)

| Output | System Shows | Detail |
|---|---|---|
| **O1 Verdict** | **Borrow** | *The requested ₹8,00,000 needs about ₹20,891/mo — inside your safe EMI of ₹36,000/mo with margin.* |
| **O2 Possible lender sanction** | **₹13–18 lakh** | FOIR 45% × ₹1,10,000 − ₹14,000 = ₹35,500/mo → 60 mo @ 13% (precise ₹13,26,195–₹17,94,263) |
| **O2 Safer borrowing range** | **₹12–16 lakh** | From cash-flow: ₹36,000/mo → 48 mo @ 11.6% (precise ₹11,71,811–₹15,85,391) — **use this** |
| **O3 Fair rate** | **10.8–12.3%** | Approx. all-in `~14.6%` (Good credit + personal lane) |
| **O4 EMI** | **Requested ~₹20,891/mo** vs **Max safe ~₹36,000/mo** | Tenure table at safer amount (24/36/48/60 mo) + footnote: *At your requested amount EMIs would be lower* |
| **Stress** | **Pass / Pass** | Income −20% → FCF ₹25,200 still covers ₹20,891 · Rate +2pp → still ≤ safe ceiling |
| **Confidence** | **Medium** | Only savings buffer unknown; range widened to 75% |

**Negotiation Card (copy-ready):**
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
Confidence: Medium
```

---

## 2. Ravi, 42 — Mysuru, Self-Employed, Property Owner → Borrow Less

**Profile:** Kirana store 14 years. ITR ₹4,20,000/yr, cash ₹40,000–80,000/mo, owns shop premises ₹45L unencumbered. Wants ₹15,00,000 to *Start or grow my income* (stock + vehicle).

**Answers (14 asked, self-employed path):**
Purpose *Start or grow my income* · Amount ₹15,00,000 · Loan type Business / Secured · Income type Self-employed → *Business years 14, ITR ₹4,20,000, Cash ₹40k–₹80k, Asset Yes, Value ₹45L, Not pledged* → Existing EMI 0 · Expenses not provided → estimated · Age 42 · Credit Unknown · Buffer Not sure

**The routing trap avoided:**
Naive ITR-only math `FOIR 40% × ₹35,000 = ₹14,000/mo → ~₹5–6L` would reject him. Because of free collateral + productive purpose, the app routes to **Secured / Business lane**:
- Blended Income = `₹35,000 (ITR/12) + ₹60,000 (mid-cash) × 0.5 = ₹65,000`
- FOIR 55% → ₹35,750/mo → ~₹20.2L @ 12% / 84 mo, but **LTV cap 50% × ₹45L = ₹22.5L** applies
- Cash-flow side: `FCF = 65,000 − 0 − 26,000 (40% est.) − 6,500 (10%) = ₹32,500` → `Safe EMI = ₹26,000` → safe ₹14.6L centre

| Output | System Shows | Detail |
|---|---|---|
| **O1 Verdict** | **Borrow Less** | *You can afford something — just not the full ₹15L. Safe ₹26,000 < needs ₹26,680/mo.* |
| **O2 Possible lender sanction** | **₹17–23 lakh** | Secured lane, LTV-capped (precise ₹17,21,405–₹23,28,959) |
| **O2 Safer borrowing range** | **₹12–17 lakh** | **Use this, not sanction** (precise ₹12,42,501–₹16,81,031) |
| **O3 Fair rate** | **11.3–13.2%** | Approx. all-in `~14%` (Unknown credit → widest band, narrowed to 75% by Medium) |
| **O4 EMI** | **Requested ~₹26,680 vs Safe ~₹26,000** | Tenure grid 36/60/84/120 mo — longer tenures are normal for secured |
| **Stress** | **Tight / Pass** | Income −20% → FCF ₹20,800 vs ₹26,680 need = **Tight** *(proceed carefully)*; Rate +2pp → still ≤ safe |
| **Confidence** | **Medium** | Expenses estimated, credit unknown, buffer unknown |

**Negotiation Card:**
Possible lender range vs Safer range shown + polite suggestion: *Could you offer ≤13.2% at ~1% fee? My fair range is 11.3–13.2%.*

---

## 3. Anita, 35 — Hubballi, Informal / Gig → Don't Borrow

**Profile:** Delivery rider + tailoring, ₹26,000–30,000 variable, 2 children, husband unemployed 8 months, sole earner, 3 app loans ₹35,000 outstanding at 30%+, bounce last month. Wants ₹1,50,000 for *Income-generating asset* (e-scooter to double deliveries).

**Answers (15 asked, informal path):**
Purpose *Income-generating asset* · Amount ₹1,50,000 · Loan type Small-ticket / informal · Income type Gig → *Stability Variable, Existing loans 3, Bounce Yes, Sole earner Yes* → Income ₹26–30k (range) · Existing debt ~₹3,500/mo · Expenses not provided → estimated ₹17,850 (60% +15pp sole-earner uplift) · Age 35 · Credit Unknown · Buffer Not sure

**Engine trace:**
- Safe Income = `mid ₹28,000 × 0.85 (variable) = ₹23,800`
- `FCF = 23,800 − 3,500 − 17,850 − 3,570 (15% sole-earner buffer) = −₹1,120` → `Safe EMI = ₹0`
- Bounce adds `+1` confidence penalty and warning, but `Don't Borrow` is driven by negative FCF, not bounce alone

| Output | System Shows | Detail |
|---|---|---|
| **O1 Verdict** | **Don't Borrow** | *Nothing left monthly; recent bounce increases repayment risk. Fix old repayments before adding a new EMI.* |
| **O2 Possible lender sanction** | **₹1.3–2.1 lakh** | Small-ticket lenders check little — **shown for honesty, not recommended:** *A lender may still offer a loan, but that does not mean it is affordable* |
| **O2 Safer borrowing range** | **≈ ₹0 today** | No headroom |
| **O3 Fair rate** | **15–18%** | Approx. all-in `~24.5%` — shown for reference, headline is Don't Borrow |
| **O4 EMI** | **Requested ~₹5,311/mo vs Max safe ₹0** | No tenure headroom — avoid any EMI |
| **Stress** | **Fail** | Income −20% → FCF −₹5,404 |
| **Confidence** | **Low** + Bounce penalty | Range income + estimated expenses/debt cost, no docs |
| **Extra** | Consolidation note: *Clear the ₹35k high-rate loans first — that ₹3,500/mo is the biggest pressure* + Bounce warning | |

**Negotiation Card** in this case is a *wait-and-fix* sheet — Possible lender range shown for transparency, Safer range emphasized as `≈ ₹0`.

> **Note on the e-scooter:** Doubling deliveries is a real possible benefit, but unverifiable in rules, so it never inflates the numbers. The app mentions it qualitatively, never as a hard calculation.

---

### How to Reproduce Any Case

1. `npm run dev` → Home → *Try the three test borrowers* → pick one → *Review* (edit any answer) → *See my results*
2. Or in console: `import {draftToProfile} from './src/data/questions.js'; import {evaluate} from './src/rules/verdict.js'; evaluate(draftToProfile(PRESETS.priya))` — see `verdict`, `sanction`, `safe`, `rate`, `stress`, `confidence`, `card`.
