# Borrower Copilot — Final Product Spec (v1.0)

This is the frozen design. No more options — this is what we build.

---

## 1. Final Product Decision

- **What we are building:** A simple web app that asks an Indian borrower a few smart questions, then tells them 4 things: should they borrow, how much, at what rate, and what EMI — plus a one-page card to use when talking to a lender.
- **Core idea:** A bank tells you what *it* is willing to give you. Nobody tells you what is actually *safe* for you. This app is that missing voice — it's on the borrower's side, not the bank's side.
- **Simple way to explain it to a user:** "Answer a few questions about your money. We'll tell you if you should take this loan, how much is safe, what interest rate is fair, and what EMI won't hurt you — then give you a card to use at the bank."
- **What makes it different from a normal EMI calculator:** A normal calculator just does math on numbers you already give it (amount, rate, tenure → EMI). This app *judges* the loan itself. It gives ranges, not fake-exact numbers. It says "I'm not sure" when it isn't sure. And it treats a shopkeeper's cash income differently from a software engineer's salary, because they really are different.
- **What the user can do after using it:** Walk into the bank knowing their safe budget, know if the bank's rate is fair, and push back with real numbers instead of just accepting whatever is offered.

---

## 2. Final MVP Scope

**MUST BUILD**
- Loan type + income type questions, with branching
- 10 "must" questions + a small set of extra questions depending on income type
- One combined calculation engine: cash-flow check + bank-style (FOIR) check
- Routing logic so self-employed/collateral cases go to a different loan lane
- All 4 outputs (O1–O4), shown as ranges with confidence
- One stress test
- Negotiation Card
- RULES.md
- Mobile-friendly UI, works in under 5 minutes from README

**SHOULD BUILD (only if time is left)**
- Comparing the app's fair rate to a rate the user says a lender already offered them
- A short note suggesting debt consolidation, if someone already has expensive debt
- The tenure trade-off table (EMI vs total interest at 2/3/4/5 years)
- Ability to go back and edit an earlier answer

**CUT — do not build these**
- Login / accounts
- Backend or database
- Any machine learning or "credit score model"
- Rules for all 6 loan products in equal depth (only build the 3 we actually need)
- A chatbot that role-plays a negotiation with you
- Any tool that tries to calculate "how much extra income this loan will create"
- Multi-language support
- Downloadable PDF (unless it's a 10-minute add-on at the very end)

---

## 3. Final Loan Products — only 3 lanes

| Lane | Who uses it | Why | What changes |
|---|---|---|---|
| **Unsecured Personal Loan** | Priya (salaried, no collateral) | Most common case, simplest rules | FOIR-based, rate 11–16%, tenure 1–5 yrs |
| **Secured / Business Loan (LAP-style)** | Ravi (has property, no salary slip) | His real ability to repay depends on his asset and cash flow, not paperwork | Rate uses lower band (10–13%), sanction also capped by loan-to-value on the property, longer tenure allowed |
| **Small-ticket / Informal Loan (incl. two-wheeler)** | Anita (gig income, no formal docs) | Small amount, high existing debt cost, income is uncertain | Rate band is higher (14–18%) because of risk, but system leans conservative and often says "don't borrow" |

**Not supporting:** Home loans (nobody in our 3 test cases needs one, and home loans need very different multi-decade math) and a separate Gold Loan lane (folded into the informal lane's logic since it behaves similarly for a small ticket size).

---

## 4. Final Questionnaire

### MUST questions (asked to everyone)

| ID | Question | Type | Required? | Why we ask | Output it changes | If "I don't know" |
|---|---|---|---|---|---|---|
| Q1 | What do you want the loan for? | Choice (wedding, medical, education, business stock, vehicle, debt payoff, other) | Yes | Tells us if this is a "want" or a productive need | O1 (verdict tone), explanation text | Not applicable — always answerable |
| Q2 | How much do you want to borrow? | ₹ number | Yes | The baseline for every output | All | Not applicable |
| Q3 | What type of loan is this? | Choice (personal, business, secured/property, vehicle, gold) | Yes | Decides which lane/rules apply | O2, O3 | If unsure, we guess a lane from Q1 and flag it as a guess |
| Q4 | How do you earn? | Choice (salaried, self-employed, gig/informal) | Yes | Decides which extra questions to ask next | Which questions appear next | Not applicable |
| Q5 | What is your monthly income? | ₹ number (or a range, for gig work) | Yes | Core input for every money calculation | All | We don't allow skipping this — but we do accept a range instead of one number |
| Q6 | Do you already pay any EMI each month? If yes, how much? | ₹ number, or "None" | Yes | Existing EMI eats into what's left for a new loan | O1, O2, O3(sanction math), O4 | "None" is a real answer (=0). But if unsure of the *amount*, we keep it as "unknown amount" — not zero — and widen the range |
| Q7 | What are your monthly essential expenses (rent, food, bills, school)? | ₹ number or bracket | Yes | Needed to see how much money is really left over | O1, O2(safe amount), O4 | If unknown, we estimate using a standard % of income for their income type, and mark this as "an assumption, not your real number" — confidence drops |
| Q8 | What is your age? | Number | Yes | Limits maximum loan tenure | O4 (tenure options) | Not applicable |
| Q9 | Do you know your credit score? | Yes/No, then number if yes | Yes (the yes/no part) | Better score → narrower, better rate | O3, confidence | "Don't know" is treated as Unknown, not as a bad score — rate range stays wide |
| Q10 | How many months of expenses do you have saved as a backup? | Choice (0, less than 1, 1–3, 3–6, 6+, not sure) | Yes | Shows resilience if income drops | O1, stress test, confidence | "Not sure" widens the range and lowers confidence |

### Additional questions — only shown to the relevant group

**If salaried (Q4 = salaried):**
- How many years have you worked, including this job? → *affects confidence/stability*
- Roughly what % of your income is bonus/variable, not fixed salary? → *we count only the fixed part fully; variable part gets a discount when calculating safe income*

**If self-employed (Q4 = self-employed):**
- How many years has your business been running? → *affects confidence and which lane fits best*
- What is your yearly income as per your ITR (tax filing)? → *this is the only income a bank will officially trust — used for the "likely bank sanction" number*
- What is your rough monthly cash income, outside of the ITR? → *counted for the "safe for you" number, but only at a discount, since it can't be verified*
- Do you own any property or asset you could offer as security? If yes, roughly what is it worth? → *unlocks the secured/business lane, raises the sanction ceiling*
- Is that asset already used as security for another loan? → *if yes, it can't be used again — this directly reduces the sanction ceiling*

**If gig/informal (Q4 = informal):**
- Is your income steady month to month, or does it vary a lot? → *variable income gets a bigger safety discount*
- How many small loans/app loans do you currently have running? → *more loans = higher real debt burden even if each one is small*
- Has any EMI or repayment bounced in the last 6 months? → *a real warning sign, pushes toward "don't borrow" or "borrow less"*
- Are you the only earner supporting your household right now? → *raises the required safety buffer, lowers the safe EMI*

**Shown to anyone who selected a secured loan type or has an asset:**
- Value of the asset, and whether it's already pledged elsewhere (already covered above for self-employed, but also asked directly if Q3 = secured/property loan even for a salaried person)

**Shown to anyone (optional, not required):**
- Has a lender already offered you a rate/fee/tenure? If yes, what were the numbers? → *used only for the "compare your lender's offer to a fair rate" feature — doesn't change the core calculation*

Every one of these questions changes at least one number or decision — nothing here is just "nice to know."

---

## 5. Final Adaptive Flow

```
START
 → Q1 Loan purpose
 → Q2 Amount requested
 → Q3 Loan type (or "not sure")
 → Q4 Income type
     ├── Salaried    → ask: years worked, variable income %
     ├── Self-employed → ask: business years, ITR income, cash income,
     │                    asset/collateral available?, encumbered?
     └── Informal/gig  → ask: income steady/variable, # of app loans,
                          recent bounce?, sole earner?
 → Q5 Income
 → Q6 Existing EMI
 → Q7 Household expenses
 → Q8 Age
 → Q9 Credit score known?
 → Q10 Savings buffer
 → (optional) Existing lender offer?
 → Review answers screen (user can edit anything)
 → RESULTS
     → O1 Borrow / Borrow Less / Don't Borrow
     → O2 Likely bank sanction vs. Safe amount
     → O3 Fair rate + real cost (APR)
     → O4 EMI ceiling + tenure table
     → Stress test result
     → Confidence level
 → Negotiation Card (one tap away from Results)
```

Roughly **10 must questions + 2–5 extra questions**, so most people answer 12–15 total. Nobody sees all the branches — each person only sees their own path.

---

## 6. Final Data Model

```js
borrowerProfile = {
  loanPurpose: "wedding" | "business_stock" | "vehicle" | "medical" | "education" | "debt_payoff" | "other",
  requestedAmount: number,          // ₹
  loanType: "personal" | "business_secured" | "informal_small_ticket" | "unsure",

  incomeType: "salaried" | "self_employed" | "informal",
  income: { amount: number | [min, max], documented: boolean },
  employmentYears: number | null,          // salaried
  variableIncomePct: number | null,        // salaried
  businessYears: number | null,            // self-employed
  itrAnnualIncome: number | null,          // self-employed
  cashIncomeRange: [number, number] | null,// self-employed
  incomeStability: "steady" | "variable" | null, // informal

  existingEmi: number | "none" | "unknown",
  existingLoanCount: number | null,        // informal
  recentBounce: boolean | null,            // informal
  soleEarner: boolean | null,              // informal

  householdExpenses: number | "unknown",
  age: number,

  creditScoreKnown: boolean,
  creditScore: number | null,

  savingsBufferMonths: "0" | "<1" | "1-3" | "3-6" | "6+" | "unknown",

  collateral: { available: boolean, value: number | null, encumbered: boolean | null } | null,

  existingLenderOffer: { rate: number, fee: number, tenureMonths: number } | null
}
```
No field is stored unless it's actually used by a rule. No login, no server — this object just lives in the browser's memory for the session.

---

## 7. Final Rules Engine

**A few shared definitions first:**

| Term | Meaning |
|---|---|
| Documented Income (DI) | Salary, or ITR income ÷ 12 — the part a bank can verify on paper |
| Blended Income (BI) | DI + (undocumented cash income × 0.5 discount) — used only for the borrower's *own* safe-amount math, never for the bank-sanction math |
| Free Cash Flow (FCF) | Blended Income − Existing EMI − Expenses − Safety Buffer |
| Safety Buffer | 10% of income normally; 15% if the person is the sole earner or has a recent bounce |

### A. Borrow / Borrow Less / Don't Borrow

| Rule | Formula | Reason | Source |
|---|---|---|---|
| Don't Borrow | FCF ≤ 0 | No real room left each month | My judgement |
| Don't Borrow (warning override) | Recent bounce = yes AND existing debt rate > 24% | Already in a debt spiral — new debt makes it worse | My judgement |
| Borrow Less | 0 < FCF, but FCF-based safe EMI < EMI needed for requested amount | Can afford something, just not the full ask | My judgement |
| Borrow | FCF-based safe EMI ≥ EMI needed for the requested amount, with margin | Genuinely affordable | My judgement |

### B. Likely Lender Sanction
- Max EMI a lender allows = FOIR cap × Documented Income − Existing EMI
- FOIR cap = 40% (informal/no collateral), 45% (salaried), 50–55% (secured/business, since collateral lowers the bank's risk)
- **Secured lane also has a ceiling:** Sanction ≤ 50% of collateral value (typical LAP loan-to-value)
- Turn that Max EMI into a loan amount using a normal EMI formula at the *product's typical rate and tenure*
- **Source:** FOIR ranges and LTV % are standard, widely-used Indian lending norms — not invented, but we're not quoting one specific bank

### C. Safe Borrowing Amount
- Max Safe EMI = FCF × 0.8 (keep 20% of the leftover money as extra breathing room)
- Turn that into a loan amount using the *fair rate* (from rule D) and a sensible tenure
- **Source:** My judgement (0.8 is a deliberate safety margin, documented as such)

### D. Fair Interest Rate Range

| Lane | Credit unknown | Credit good (≥750) | Credit weak (<650) |
|---|---|---|---|
| Personal | 12–16% | 10.5–12.5% | 15–18% |
| Secured/Business | 11–13.5% | 10–11.5% | — (rare in this lane) |
| Informal/small-ticket | 15–18% | 13–15% | 17–20% |

These are **judgement-based, realistic Indian market bands** — clearly labeled as assumptions in RULES.md, not fetched from any live source.

### E. APR / All-in Cost
`APR ≈ nominal rate + (processing fee % × 12 ÷ tenure in years)`
This is a simplified way to "spread" a one-time fee over the loan life so people can compare a 12% loan with a 1% fee against a 13% loan with no fee. We say clearly this is an approximation, not the bank's exact legal APR formula.

### F. EMI Ceiling
Same number as the Max Safe EMI from Rule C — we don't calculate it twice.

### G. Tenure Trade-off
At the *safe loan amount*, show EMI and total interest at 2, 3, 4, and 5 years, using the fair-rate midpoint. Simple EMI formula, four rows, no extra rules needed.

### H. Stress Test
Two fixed scenarios (not a general simulator):
1. Income drops 20% → recompute FCF → does Safe EMI still work?
2. Rate rises 2% → recompute EMI at the same safe loan amount → does it still fit inside FCF?
Show a plain Pass/Fail plus the new numbers.

### I. Confidence
Confidence = combination of:
1. **Completeness** — how many of the relevant extra questions were answered
2. **Verifiability** — is income mostly documented (salary/ITR) or mostly self-reported cash?

| Confidence | When |
|---|---|
| High | Most extra questions answered + income is mostly documented |
| Medium | Some questions skipped, or income partly undocumented |
| Low | Many "not sure" answers, or income is mostly unverifiable cash |

Confidence directly controls **how wide the shown range is** — Low confidence = show the full band; High confidence = show the narrower half of the band.

---

## 8. Avoiding False Precision

We never show a single decimal number as an output (like "11.73%"). Every rate, amount, and EMI is shown as a range. The range width is tied directly to the Confidence level from Rule I — this isn't decoration, it's the same number driving both the range and the confidence label, so they can never contradict each other.

---

## 9. Unknown Handling — exact behaviour

| Field | If unknown |
|---|---|
| Credit score | Treated as "Unknown" — NOT zero or a bad score. Rate range stays at its full width. |
| Expenses | Estimated using a standard % of income for that income type. Clearly labeled "estimated, you didn't confirm this" and confidence drops one level. |
| Income stability | Treated as "Unknown" — we apply a mid-level cash-flow discount (in between "steady" and "known variable"), and confidence drops. |
| Existing lender's rate | Simply not shown in the comparison feature — no penalty elsewhere. |
| Savings buffer | Treated as "Unknown" — we widen the stress-test tolerance and lower confidence, but do NOT assume zero savings. |
| Existing EMI amount (but they said they have one) | We use a cautious placeholder (a percentage of their income) purely so the math doesn't break, clearly marked "estimated," and confidence drops sharply. |

**Implementation rule:** every "unknown" value is stored as the literal value `"unknown"`, never `0` or `null` silently. The calculation code checks for `"unknown"` explicitly and either (a) uses a documented fallback estimate with a flag, or (b) widens a range — it never quietly substitutes zero.

---

## 10. Final Output Design

Each output block on the results screen shows: **Main number/range → Confidence badge → One-line reason → "See details" for the full explanation.**

- **O1:** "✅ Borrow" / "⚠️ Borrow Less" / "🛑 Don't Borrow" + one-line reason
- **O2:** Two numbers side by side: "Bank might offer: ₹X–Y" and "What's actually safe for you: ₹A–B", with a short line explaining why they differ
- **O3:** "Fair rate: X–Y%" and "Real cost with fees: ~Z%"
- **O4:** "Don't agree to an EMI above ₹X/month" + the 4-row tenure table
- **Stress test:** "If your income dropped 20% next year, you would/would not still manage this EMI."

---

## 11. Explainability Templates

- "Your safe EMI is ₹22,000 because after your expenses (₹40,000) and existing loan (₹14,000), you have about ₹45,000 left each month — and we keep 20% of that as a safety cushion."
- "Your safe borrowing amount is ₹7.5L because that's what a ₹22,000 EMI can cover at a fair rate over a reasonable number of years."
- "Your fair rate is 11–12.5% because your credit score (780) is strong and this is an unsecured personal loan."
- "Your confidence is Medium because we don't know your savings buffer, so we widened the range a bit."
- "A bank might sanction more than we call 'safe' because banks look mainly at whether you can pay each month — not at how comfortable that leaves you."

---

## 12. Negotiation Card — final field order

```
BORROWER NEGOTIATION CARD
────────────────────────
Profile: [income type] · ₹[income]/month · Credit: [known/unknown]
Loan requested: ₹[amount] for [purpose]
Likely bank offer: ₹[range]
Safe amount for you: ₹[range]
Fair interest rate: [range]%
Real cost with fees: ~[X]%
Max EMI you should agree to: ₹[amount]/month
Why: [one plain sentence]
Confidence: [High/Medium/Low]
(If applicable) Your lender offered [rate]% — that's [above/within] the fair range.
```
The last line only appears if the user answered the optional "existing lender offer" question. The card looks the same across all 3 lanes — only the numbers and the "Why" line change.

---

## 13. Three Final Simulations

### PRIYA
**Numbers used:** Income ₹1,10,000 (fully documented) · Existing EMI ₹14,000 · Expenses (rent + other) ≈ ₹40,000 · Credit score 780 (known, strong) · Savings buffer: not stated (Unknown) · Requested ₹8,00,000 for a wedding.

- Free Cash Flow ≈ ₹1,10,000 − 14,000 − 40,000 − 11,000 (buffer) = **₹45,000/month left over**
- Safe max EMI ≈ ₹45,000 × 0.8 = **₹36,000** → converts to a safe loan amount well above ₹8L
- Bank-style sanction (FOIR 45%) also comes out well above ₹8L
- **O1: Borrow.** Her requested amount fits comfortably even after her existing car EMI.
- **O2:** Bank might offer ₹12–14L · Safe for her: ₹12–14L too (both numbers agree here, since she's a strong, fully-documented borrower)
- **O3:** 11–12.5% (personal loan, strong credit)
- **O4:** Recommended EMI ceiling ≈ ₹21,000/month for the ₹8L she actually wants (well under her ₹36,000 capacity)
- **Stress test:** Even with a 20% income drop, she still comfortably covers the ₹21,000 EMI. Pass.
- **Confidence: Medium** (only her savings buffer is unknown; everything else is solid)
- **Negotiation Card:** shows all the above — she can confidently push back if a lender quotes above 12.5%.

### RAVI
**Numbers used:** ITR income ₹35,000/month (documented) · Cash income ₹40,000–80,000/month (undocumented, midpoint ₹60,000) · No existing EMI · Property worth ₹45,00,000, unencumbered · Credit score unknown · Requested ₹15,00,000 for stock + vehicle (productive purpose).

- **First, the trap the app must avoid:** if we only looked at his ITR income, a bank-style calc gives Max EMI = 40% × 35,000 = ₹14,000 → sanction only around **₹5–6L**. That's far below what he actually needs and far below what he can genuinely repay.
- **Routing decision:** because he has an unencumbered, valuable asset and a productive business purpose, the app routes him to the **Secured/Business lane**, not the plain personal-loan lane.
- Blended income for his own safe-amount math = ₹35,000 + (₹60,000 × 0.5 discount) = **₹65,000**
- Free Cash Flow ≈ 65,000 − 0 (no EMI) − 26,000 (estimated expenses) − 6,500 (buffer) = **₹32,500/month**
- **O1: Borrow Less.** He shouldn't take the full ₹15L blind, but he genuinely has room for a meaningful secured loan — more than a plain income-only view would ever suggest.
- **O2:** Bank might offer (secured lane, using his property) ≈ ₹18–22L (capped mainly by 50% loan-to-value on his property) · Safe for him ≈ ₹11–13L (based on his real monthly cash-flow capacity, since his cash income is unverifiable and deserves a discount)
- **O3:** 11–13.5% (secured/business lane, credit history unknown so the band stays wide)
- **O4:** Recommended EMI ceiling ≈ ₹26,000/month
- **Stress test:** A 20% income drop pulls his safe capacity close to zero — flagged as "tight, proceed carefully," not an outright fail, but worth showing.
- **Confidence: Low–Medium** — his credit score, exact cash income, and real expenses are all estimates.
- **Negotiation Card:** clearly states he should be considered for a *secured/business loan against his property*, not a plain personal loan — and that the safe amount for him is ₹11–13L even though the property could technically support more.

### ANITA
**Numbers used:** Income ₹26,000–30,000/month, variable (midpoint ₹28,000) · 3 existing app loans, ₹35,000 outstanding at 30%+ interest · One bounce last month · Sole earner (husband unemployed 8 months) · 2 children · Requested ₹1,50,000 for an e-scooter (potentially productive).

- Safe income after variability discount ≈ ₹28,000 × 0.85 = **₹23,800**
- Estimated existing-debt monthly cost (from her ₹35,000 at high interest) ≈ **₹3,500** (flagged as an assumption)
- Estimated essential expenses for a family of 4 on one income ≈ **₹17,850** (flagged as an assumption — she wasn't asked for an exact figure)
- Buffer (raised because she's the sole earner): ≈ **₹3,570**
- Free Cash Flow ≈ 23,800 − 3,500 − 17,850 − 3,570 = **about −₹1,100/month** — essentially nothing left, possibly negative
- **The bounce + high-cost existing debt override:** even before doing the cash-flow math, the "recent bounce + >24% existing debt rate" rule alone pushes strongly toward "Don't Borrow."
- **O1: Don't Borrow (right now).** There isn't real monthly room, and she's already showing signs of debt stress.
- **O2:** We still show what a lender in this space might offer (₹1–1.5L, since small-ticket informal lenders don't check much) — but we clearly say the *safe* amount today is close to ₹0, and that a new loan would very likely lead to another bounce.
- **O3/O4:** Shown for reference (14–18%, EMI ceiling ≈ ₹0–1,000) but the headline message is about not borrowing yet, not the rate.
- **Extra guidance (SHOULD-build feature):** a note suggesting she look at consolidating or paying down her existing ₹35,000 in app loans before taking on anything new — that ₹3,500/month she's paying on old debt is the single biggest thing crushing her cash flow.
- **We do not** try to calculate exactly how much extra the scooter would earn her — we say plainly that this is a real possible benefit but not something we can verify or put a number on, so it doesn't change today's "don't borrow" verdict.
- **Confidence: Low** — income is a range, expenses and debt cost are both estimates, no formal documentation exists.
- **Negotiation Card:** in her case, this becomes less about negotiating a rate and more about a clear "wait and fix this first" message — still useful as a one-page summary she could show to any lender who approaches her.

---

## 14. Edge Cases

| Case | What the app should do |
|---|---|
| Income = ₹0 | O1 = Don't Borrow immediately; skip further money math, show a short explanation instead of a broken calculation |
| Existing EMI > income | Treat FCF as deeply negative; O1 = Don't Borrow, flag existing debt as the core problem |
| Very high expenses (expenses ≈ or > income) | Same as above — FCF ≤ 0 triggers Don't Borrow regardless of other factors |
| Unknown credit score | Handled by Rule I/Section 9 — wide rate band, not a penalty |
| No existing credit history at all | Treated the same as "unknown," not as "bad" |
| Self-employed income given as a range | Use the midpoint for math, but keep the full range visible to the user and apply the cash-income discount |
| Recent EMI bounce | Triggers the override in Rule A regardless of how the raw numbers look |
| Requested amount > safe amount | Show both numbers clearly and explicitly say "consider ₹X instead" — this is the most common and most important case to get right |
| Requested amount > likely bank sanction too | Say plainly this amount is unlikely to be approved at all, regardless of what's "safe" |
| Loan purpose = emergency/medical | Don't apply the "discretionary purpose" tone from Rule A — treat it neutrally, since criticizing an emergency loan would be tone-deaf |
| Productive business purpose | Mentioned in the explanation text as a positive qualitative factor, but never turned into a hard number (see Section 4) |
| Long requested tenure (>7 years) for a personal/small-ticket loan | Cap tenure options for that lane (e.g., personal loan max 5 years) and explain why |
| High processing fee reported by user | Feed into the APR/all-in-cost line (Rule E) so the comparison to the lender's offer stays honest |

We are **not** building rare-case handling beyond this list (e.g., joint co-applicant income splitting, multiple properties, foreign income) — not worth the time in a 12–16 hour build.

---

## 15. Final Tech Architecture

```
/borrower-copilot
 ├── /data
 │    ├── questions.js         // all question definitions + branching rules
 │    └── rateBands.js         // Section 7's rate tables, as plain data
 ├── /rules
 │    ├── cashFlow.js          // FCF, safe EMI, safe amount
 │    ├── sanction.js          // FOIR + LTV-based bank sanction estimate
 │    ├── rate.js              // rate band lookup
 │    ├── apr.js               // all-in cost formula
 │    ├── stressTest.js        // the two fixed scenarios
 │    ├── confidence.js        // completeness + verifiability scoring
 │    └── verdict.js           // combines everything into O1–O4
 ├── /components
 │    ├── Questionnaire.jsx    // renders current question from questions.js
 │    ├── ReviewAnswers.jsx
 │    ├── ResultsScreen.jsx
 │    ├── OutputCard.jsx       // reusable O1/O2/O3/O4 card
 │    ├── StressTestCard.jsx
 │    └── NegotiationCard.jsx
 ├── App.jsx                   // holds borrowerProfile in React state, drives the flow
 ├── RULES.md
 └── README.md
```

- **State management:** just React `useState`/`useReducer` in `App.jsx` — no Redux, no external store, no persistence. Everything resets on refresh (fine, since there's no login and no saving).
- **Rules stay pure functions** in `/rules` — each takes the `borrowerProfile` object and returns numbers/strings. No rule file ever imports a UI component. This makes it trivial to unit-test the rules alone, and to change a threshold later without touching the UI.

---

## 16. RULES.md Structure

1. Philosophy — why this exists, borrower-first framing
2. Definitions — DI, BI, FCF, Buffer, FOIR, LTV, APR (in plain language)
3. Affordability rules (Section 7-A/7-C above)
4. Lender sanction rules (7-B)
5. Safe amount rules (7-C)
6. Rate rules (7-D) — with the full table
7. APR rules (7-E)
8. EMI rules (7-F)
9. Stress rules (7-H)
10. Confidence rules (7-I)
11. Product-specific rules (Section 3's 3 lanes)
12. Unknown-data handling (Section 9's table)
13. Assumptions — every number that's "my judgement," listed plainly
14. Limitations — no bureau data, self-reported answers, not a substitute for real underwriting
15. Sources — FOIR and LTV norms (general market practice), everything else labeled "judgement"

---

## 17. Test Plan

**Unit tests (rules only, no UI):**
- FCF calculation with normal inputs
- FCF calculation when expenses ≥ income (should trigger Don't Borrow)
- Sanction calculation with and without collateral
- Rate band lookup for known-good, known-weak, and unknown credit score
- Confidence scoring at 100%, 50%, and 20% completeness
- Unknown-value handling never produces a silent zero

**Scenario tests:**
- Priya end-to-end → expect "Borrow," rate 11–12.5%, EMI ceiling near ₹21,000
- Ravi end-to-end → expect routing to secured lane, "Borrow Less," safe amount well below sanction
- Anita end-to-end → expect "Don't Borrow," low confidence, override triggered by the bounce

**Edge case tests:** income = 0, EMI > income, requested > sanction

**UI flow test (manual, not automated):** complete the whole flow once per income type (salaried / self-employed / informal) and confirm the right question set appears each time, and that the Review screen lets you edit an answer and see results update.

We are **not** writing tests for visual styling, animations, or every possible answer combination — not worth it in this time box.

---

## 18. Final Build Plan (12–16 hours)

| Time | Focus |
|---|---|
| Hour 1–2 | Set up project, write `questions.js` + branching, write `RULES.md` skeleton with all the numbers from Section 7 |
| Hour 3–5 | Build the rules engine (`/rules` folder) as pure functions, write the unit tests as you go |
| Hour 6–7 | Run Priya/Ravi/Anita through the rules by hand/console to confirm the numbers match Section 13, fix any rule bugs |
| Hour 8–10 | Build the Questionnaire + Review + Results UI, wire it to the rules engine |
| Hour 11–12 | Build the Negotiation Card component |
| Hour 13 | Stress test UI + tenure trade-off table (SHOULD-have items) |
| Hour 14 | Mobile styling pass, fix any layout issues |
| Hour 15 | Finish RULES.md fully, write README, do the 3 official run-throughs as write-ups |
| Hour 16 | Final pass: check every acceptance criterion in Section 19, record the 5-minute walkthrough |

If running behind: cut the tenure table and lender-offer comparison first (Section 2's SHOULD list), never cut the 3 lanes, the Don't-Borrow logic, or the Negotiation Card.

---

## 19. Final Acceptance Checklist

- [ ] "Don't Borrow" is a real, reachable outcome (Anita proves it)
- [ ] Bank sanction and safe amount are always shown separately, never merged into one number
- [ ] Unknown credit score never becomes a bad score — rate range just stays wide
- [ ] Every number on the results screen has a plain-English "because..." explanation
- [ ] Confidence gets lower and ranges get wider as more answers are "unknown"
- [ ] Ravi is routed to the secured/business lane, not a generic personal loan
- [ ] Anita receives a conservative, "don't borrow more" style recommendation
- [ ] The shown rate includes an all-in cost (APR-style) number, not just the nominal rate
- [ ] At least one stress test scenario runs and shows a clear pass/fail
- [ ] The Negotiation Card renders correctly for all 3 test borrowers
- [ ] All rules live in `/rules` as pure functions, separate from UI components
- [ ] RULES.md documents every threshold and clearly marks "my judgement" vs. general market practice
- [ ] The app is usable on a phone screen
- [ ] A new person can clone the repo and get it running in under 5 minutes using only the README

---

## Final Statement

> **This is exactly what I recommend we build.**

**Summary (15–20 lines):** Borrower Copilot is a browser-only app that asks an Indian borrower about 10–15 questions — adapting the extra questions to whether they're salaried, self-employed, or working informally — and produces four honest outputs: whether to borrow at all, how much a bank might sanction versus how much is actually safe, a fair interest rate range including real fees, and a monthly EMI ceiling with a tenure trade-off table. The engine works by first estimating each person's free cash flow (income minus expenses minus existing debt minus a safety cushion), then separately estimating what a bank would likely approve using standard FOIR and loan-to-value norms — showing both numbers side by side is the core insight, since they're often very different. Before any calculation, the app routes each borrower into one of three lanes (personal, secured/business, or small-ticket/informal) so that a shopkeeper with a valuable property isn't judged the same way as a salaried employee, and a gig worker's uncertain income is treated with proper caution rather than false precision. Every unknown answer widens the shown range and lowers a plainly-stated confidence level — it never quietly becomes a zero or a penalty. All thresholds (FOIR caps, rate bands, safety margins) are documented in RULES.md as clearly labeled judgement calls, not hidden inside vague code. The three test borrowers show the product working as intended: Priya gets a confident "Borrow," Ravi gets routed to a better-suited loan type that a naive income-only calculator would have missed, and Anita gets a conservative "Don't Borrow" with a suggestion to deal with her existing high-cost debt first. Everything runs in the browser with no login, backend, or database, and the whole thing is buildable inside the 12–16 hour window by keeping the loan-product catalog to three lanes and cutting anything decorative, like a negotiation chatbot or a full loan-purpose ROI calculator.
