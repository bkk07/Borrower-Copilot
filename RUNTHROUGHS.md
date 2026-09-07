# Three run-throughs — Priya, Ravi, Anita

Produced by the actual rules engine (`src/rules/`). Reproduce with home screen → "Try the three test borrowers".

---

## 1. PRIYA, 29 — Bengaluru, salaried → ✅ Borrow

**Questions asked (adaptive path: salaried):** purpose *Planned personal / family expense* · amount ₹8,00,000 · loan type personal · income type salaried → *years worked (5), variable-pay %* → income ₹1,10,000 · existing EMI ₹14,000 · expenses ₹40,000 · age 29 · credit known 780 · savings buffer unknown.

**Engine trace:** Blended income ₹1,10,000 (fully documented) · FCF = 1,10,000 − 14,000 − 40,000 − 11,000 buffer = **₹45,000** · Safe EMI = 45,000 × 0.8 = **₹36,000** · Requested ₹8L needs **~₹20,891/mo** at fair-mid 11.6% / 48 mo → fits with margin.

| Output | Result |
|---|---|
| O1 verdict | ✅ Borrow — requested EMI inside safe EMI with margin |
| O2 possible lender sanction | ₹13–18 lakh (FOIR 45% × 1,10,000 − 14,000 = ₹35,500/mo → 60 mo @ 13%) |
| O2 safer borrowing range | ₹12–16 lakh (₹36,000/mo → 48 mo @ 11.6%) — **use this** |
| O3 fair rate estimate | 10.8–12.3% · Approx. all-in annual cost ~14.6% |
| O4 requested-loan EMI | ~₹20,891/month — below maximum safe EMI ~₹36,000/month + tenure table |
| Stress | Income −20% → **Pass** (FCF ₹25,200 still covers ₹20,891) · Rate +2pp → Pass |
| Confidence | **Medium** — only savings buffer unknown |

**Negotiation Card:**
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
💬 Ask whether the lender can offer ≤12.3% with ~1% processing fee.
Confidence: Medium
```

---

## 2. RAVI, 42 — Mysuru, self-employed → ⚠️ Borrow Less (secured lane)

**Questions asked (adaptive path: self-employed):** purpose *Start or grow my income* · ₹15,00,000 · type business/secured · income type self-employed → *business years (14), ITR ₹4,20,000/yr, cash ₹40,000–80,000/mo, asset yes, value ₹45,00,000, unencumbered* → income (via ITR+cash) · no EMI · expenses unknown→estimated · age 42 · credit unknown · buffer unknown.

**The trap avoided:** ITR-only math (FOIR 40% × ₹35,000 = ₹14,000/mo → ~₹5–6L) would reject him.
Because he has an unencumbered ₹45L asset, the app routes him to the **Secured/Business lane**: sanction base = blended ₹65,000 (35,000 + 60,000×0.5), FOIR 55% → ₹35,750/mo → ~₹20.2L @ 12% / 84 mo, under the 50% LTV cap (₹22.5L). Safe side: FCF ₹32,500 → safe EMI ₹26,000 → ~₹14.6L safe.

| Output | Result |
|---|---|
| O1 verdict | ⚠️ Borrow Less — ₹26,000 safe < ₹26,680/mo the full ₹15L needs |
| O2 possible lender sanction | ₹17–23 lakh (secured lane, 50% LTV-capped) |
| O2 safer borrowing range | ₹12–17 lakh — **use this, not the sanction** |
| O3 fair rate estimate | 11.3–13.2% · Approx. all-in ~14% |
| O4 EMI + tenure table | Requested ₹15L ≈ ₹26,680/mo vs safe ceiling ₹26,000/mo |
| Stress | Income −20% → **Tight** (FCF ₹20,800 vs ₹26,680 need) · Rate +2pp → Pass/Tight per safe ceiling |
| Confidence | **Medium** — expenses estimated, credit unknown, buffer unknown |

**Negotiation Card** shows Possible lender range vs Safer range + `Ask ≤13.2% with ~1% fee` suggestion.

---

## 3. ANITA, 35 — Hubballi, informal → 🛑 Don't Borrow

**Questions asked (adaptive path: informal):** purpose *Income-generating asset* · ₹1,50,000 · type small-ticket · income type informal → *stability variable, 3 app loans, bounce last month, sole earner* → income ₹26,000–30,000 · existing debt ~₹3,500/mo · expenses unknown→estimated ₹17,850 (75% incl. sole-earner uplift) · age 35 · credit unknown · buffer unknown.

**Engine trace:** Safe income 28,000 × 0.85 = ₹23,800 · FCF = 23,800 − 3,500 − 17,850 − 3,570 = **−₹1,120** → safe EMI ₹0. Bounce is a warning here; the Don't Borrow is driven by negative cash flow.

| Output | Result |
|---|---|
| O1 verdict | 🛑 Don't Borrow — nothing left monthly; recent bounce increases repayment risk |
| O2 possible lender sanction | ₹1.3–2.1 lakh (small-ticket lenders check little) — a lender may still offer a loan, but that does not mean it is affordable |
| O2 safer borrowing range | ≈ ₹0 today |
| O3 fair rate estimate | 15–18% · Approx. all-in ~24.5% |
| O4 requested-loan EMI | ~₹5,311/month vs max safe ₹0 — no headroom |
| Stress | Income −20% → **Fail** (FCF −₹5,404) |
| Confidence | **Low** + bounce penalty — range income, estimated expenses + debt cost |
| Extra | Debt-consolidation note + bounce warning shown |

**Negotiation Card** is a "wait and fix this first" sheet — Possible lender range shown for honesty, Safer range ≈₹0 emphasized.
