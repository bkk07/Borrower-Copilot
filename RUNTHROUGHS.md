# Three run-throughs — Priya, Ravi, Anita

Produced by the actual rules engine (`src/rules/`). Reproduce any of them in the app
with one tap: home screen → "Try the three test borrowers". Or run:
`node --input-type=module -e "import('./src/rules/verdict.js').then(...)"` — see WALKTHROUGH.md.

---

## 1. PRIYA, 29 — Bengaluru, salaried → ✅ Borrow

**Questions asked (adaptive path: salaried):** loan purpose (wedding) · amount ₹8,00,000 ·
loan type personal · income type salaried → *years worked (5), variable-pay %* → income ₹1,10,000 ·
existing EMI ₹14,000 · expenses ₹40,000 · age 29 · credit known 780 · savings buffer unknown.

**Engine trace:** Blended income ₹1,10,000 (fully documented) · FCF = 1,10,000 − 14,000 − 40,000 − 11,000 buffer = **₹45,000** ·
Safe EMI = 45,000 × 0.8 = **₹36,000** · Requested ₹8L needs **~₹20,891/mo** at fair-mid 11.6% / 48 mo → fits with margin.

| Output | Result |
|---|---|
| O1 verdict | ✅ Borrow — requested EMI inside safe EMI with margin |
| O2 bank sanction | ₹13,26,195–₹17,94,263 (FOIR 45% × 1,10,000 − 14,000 = ₹35,500/mo → 60 mo @ 13%) |
| O2 safe amount | ₹11,71,811–₹15,85,391 (₹36,000/mo → 48 mo @ 11.6%) — **use this** |
| O3 fair rate | 10.8–12.3% (personal + score 780) · real cost ~14.6% incl. 1% fee |
| O4 EMI ceiling | ₹36,000/mo (the ₹8L itself needs only ~₹20,891) + 2/3/4/5-yr table |
| Stress | Income −20% → **Pass** (FCF ₹25,200 still covers ₹20,891) · Rate +2pp → Pass |
| Confidence | **Medium** — only savings buffer unknown |

**Negotiation Card:**
```
BORROWER NEGOTIATION CARD
────────────────────────
Profile: salaried · ₹1,10,000/month · Credit: 780
Loan requested: ₹8,00,000 for wedding
Likely bank offer: ₹13,26,195–₹17,94,263
Safe amount for you: ₹11,71,811–₹15,85,391
Fair interest rate: 10.8–12.3%
Real cost with fees: ~14.6%
Max EMI you should agree to: ₹36,000/month
Why: The requested ₹8,00,000 needs about ₹20,891/month — inside your safe EMI of ₹36,000/month with margin.
Confidence: Medium
```

---

## 2. RAVI, 42 — Mysuru, self-employed → ⚠️ Borrow Less (secured lane)

**Questions asked (adaptive path: self-employed):** purpose business stock · ₹15,00,000 ·
type business/secured · income type self-employed → *business years (14), ITR ₹4,20,000/yr,
cash ₹40,000–80,000/mo, asset yes, value ₹45,00,000, unencumbered* → income (via ITR+cash) ·
no EMI · expenses unknown→estimated · age 42 · credit unknown · buffer unknown.

**The trap avoided:** ITR-only math (FOIR 40% × ₹35,000 = ₹14,000/mo → ~₹5–6L) would reject him.
Because he has an unencumbered ₹45L asset + productive purpose, the app routes him to the
**Secured/Business lane**: sanction base = blended ₹65,000 (35,000 + 60,000×0.5), FOIR 55% →
₹35,750/mo → ~₹20.2L @ 12% / 84 mo, under the 50% LTV cap (₹22.5L). Safe side: FCF ₹32,500 →
safe EMI ₹26,000 → ~₹14.6L safe.

| Output | Result |
|---|---|
| O1 verdict | ⚠️ Borrow Less — ₹26,000 safe < ₹26,680/mo the full ₹15L needs |
| O2 bank sanction | ₹17,21,405–₹23,28,959 (secured lane, LTV-capped) |
| O2 safe amount | ₹12,42,501–₹16,81,031 — **use this, not the sanction** |
| O3 fair rate | 11.3–13.2% (secured + unknown credit → wide) · real cost ~14% |
| O4 EMI ceiling | ₹26,000/mo + tenure table |
| Stress | Income −20% → **Tight, proceed carefully** (FCF ₹20,800 vs ₹26,680 need) · Rate +2pp → Pass |
| Confidence | **Medium** — expenses estimated, credit unknown, buffer unknown |

**Negotiation Card:**
```
BORROWER NEGOTIATION CARD
────────────────────────
Profile: self employed · ₹65,000/month · Credit: unknown
Loan requested: ₹15,00,000 for business stock / expansion
Likely bank offer: ₹17,21,405–₹23,28,959
Safe amount for you: ₹12,42,501–₹16,81,031
Fair interest rate: 11.3–13.2%
Real cost with fees: ~14%
Max EMI you should agree to: ₹26,000/month
Why: You can afford something — just not the full ₹15,00,000. Your safe EMI (₹26,000) is below the ₹26,680/month the full amount needs.
Confidence: Medium
```

---

## 3. ANITA, 35 — Hubballi, informal → 🛑 Don't Borrow

**Questions asked (adaptive path: informal):** purpose vehicle (e-scooter) · ₹1,50,000 ·
type small-ticket · income type informal → *stability variable, 3 app loans, bounce last month,
sole earner* → income ₹26,000–30,000 · existing debt ~₹3,500/mo · expenses unknown→estimated
₹17,850 (75% incl. sole-earner uplift) · age 35 · credit unknown · buffer unknown.

**Engine trace:** Safe income 28,000 × 0.85 = ₹23,800 · FCF = 23,800 − 3,500 − 17,850 − 3,570 = **−₹1,120** →
safe EMI ₹0. Bounce + costly existing debt independently force the override.

| Output | Result |
|---|---|
| O1 verdict | 🛑 Don't Borrow — nothing left monthly; new loan risks another bounce |
| O2 bank sanction | ₹1,27,526–₹2,12,544 (small-ticket lenders check little) — shown for honesty, **not** recommended |
| O2 safe amount | ≈ ₹0 today |
| O3 fair rate | 15–18% (shown for reference; headline is "don't borrow yet") · real cost ~24.5% |
| O4 EMI ceiling | ₹0–1,000/mo effectively — avoid any EMI |
| Stress | Income −20% → **Fail** (FCF −₹5,404) |
| Confidence | **Low** — range income, estimated expenses + debt cost, no documentation |
| Extra | Debt-consolidation note shown: clear the ₹35,000 high-rate app loans first |

**Negotiation Card** (here a "wait and fix this first" sheet, still one page):
```
BORROWER NEGOTIATION CARD
────────────────────────
Profile: informal · ₹26,000–₹30,000/month · Credit: unknown
Loan requested: ₹1,50,000 for vehicle
Likely bank offer: ₹1,27,526–₹2,12,544
Safe amount for you: ₹0–₹0
Fair interest rate: 15–18%
Real cost with fees: ~24.5%
Max EMI you should agree to: ₹0/month
Why: After expenses (₹17,850), existing loans (₹3,500) and a safety buffer, nothing is left each month.
Confidence: Low
```

*We do not quantify the scooter's extra earnings — a real possible benefit, but unverifiable, so it never overrides today's verdict.*
