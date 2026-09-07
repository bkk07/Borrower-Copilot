# Borrower Copilot — Rules & Assumptions

> **Purpose:** This document is the contract between product and code. Every threshold, band, and assumption is listed as *what · value · why · source*. Code lives in `src/rules/` as pure functions — same inputs always produce same outputs, independently testable from UI.
>
> **Reading the UI:** Headlines are borrower-friendly ("Bank estimate", "Safer range"). Technical terms below (FOIR, LTV, FCF) appear here and in code comments for precision, not in the main result headings.

---

## 1. Product Philosophy

Borrower Copilot is borrower-first. A bank optimises for *what it can collect* (FOIR-style sanction). This app optimises for *what remains comfortable* for you (cash-flow affordability).

- **Ranges, not false precision** — headlines like `₹12–16L`, details expand to exact `₹12,42,501–₹16,81,031` if needed.
- **Unknown stays unknown** — `"I don't know"` widens the range and lowers confidence, never becomes a silent `0`.
- **Income matters by type** — salary, ITR + discounted cash, and gig income are treated differently because they are.

---

## 2. Definitions

| Term | Plain Meaning |
|---|---|
| **Documented Income (DI)** | Verifiable on paper — salary, or `ITR per year ÷ 12` |
| **Blended Income (BI)** | `DI + Undocumented cash × 0.5` — used for *your* safe math (and the secured lane, see §4), otherwise DI only |
| **Free Cash Flow (FCF)** | `BI − Existing EMI − Expenses − Safety Buffer − UpcomingExpense/6` (if any) |
| **Safety Buffer** | `10%` of BI normally; `15%` if sole earner, recent bounce, or a large upcoming expense within 6 months |
| **FOIR** | Fixed Obligations to Income Ratio — share of verifiable income a lender allocates to EMIs |
| **LTV** | Loan-to-Value — `Loan ÷ Collateral value`; our cap is `50%` (LAP norm) |
| **APR (approx.)** | `Nominal + fee% × 12 / tenureYears` — simplified, shown as *"Approx. all-in annual cost"* with disclaimer |

---

## 3. Affordability & Verdict (O1)

| Rule | Value / Condition | Source |
|---|---|---|
| **Don't Borrow** | `FCF ≤ 0` — nothing left after EMIs, expenses, buffer | Internal assumption |
| **Bounce signal** | `recentBounce = yes` → warning + `confidence −1`. `Don't Borrow` only if `FCF ≤ 0`; otherwise `Borrow / Borrow Less` by normal affordability, with warning | Internal assumption — affordability decides, not stigma |
| **Debt-payoff check** | `loanPurpose = debt_payoff` + `existing EMI > 0` → show `needs − old EMI` swap analysis | Internal assumption |
| **Borrow Less** | `0 < FCF` but `Safe EMI < EMI needed` for requested amount | Internal assumption |
| **Borrow** | `Safe EMI ≥ EMI needed` with margin | Internal assumption |
| **Safe EMI** | `FCF × 0.8` — keep 20% breathing room | Internal assumption |
| **No income** | `Requested ≤ 0` or `BI ≤ 0` → `Don't Borrow` (skip further math) | Internal assumption |
| **EMI > Income or Expenses ≥ Income** | `FCF` deeply negative → `Don't Borrow` | Internal assumption |
| **Purpose tone** | `essential` and `education` = neutral (not penalised); other purposes = normal tone | Internal assumption |
| **Productive purpose** | `income_growth`, `productive_asset` — noted qualitatively, never inflates numbers | Internal assumption |
| **Taxonomy** | 9 real-world categories — `Essential`, `Planned personal/family`, `Home improvement`, `Major purchase`, `Start/grow income`, `Pay off debt`, `Education/career`, `Income-generating asset`, `Other` | Internal assumption — challenge personas are test cases, not the taxonomy |

### 3a. Purpose Classes (for tone only — never auto-approves/rejects)

| Value | Class | Usage |
|---|---|---|
| `essential` | essential | Neutral tone |
| `planned_personal` | discretionary_personal | Normal tone — cash flow decides |
| `home_improvement` | home | Normal tone |
| `major_purchase` | discretionary_purchase | Normal tone |
| `income_growth` | productive | Qualitative note only |
| `productive_asset` | productive_asset | Qualitative note only |
| `debt_payoff` | debt_repayment | Triggers swap analysis |
| `education` | education | Neutral tone |
| `other` | other | Neutral fallback |

---

## 4. Lender Sanction (O2 — Bank Side)

| Rule | Value | Source |
|---|---|---|
| **Possible lender sanction (EMI)** | `FOIR cap × Verifiable Income − Existing EMI` | General Indian lending practice |
| **Safer borrowing range** | `FCF → Safe EMI → Amount` (borrower comfort) | Internal assumption |
| **FOIR cap — Personal** | `45%` | General practice — unsecured salaried norm |
| **FOIR cap — Secured / Business** | `55%` | General practice — collateral lowers risk |
| **FOIR cap — Informal / Small-ticket** | `40%` | General practice — thin-file tighter cap |
| **Base income — Salaried** | Documented salary | Internal assumption |
| **Base income — Secured** | Blended Income (`DI + 50% cash`) — LAP lenders underwrite cash flow against collateral | Internal assumption |
| **Base income — Informal** | Discounted blended income (steady ×0.95 / variable ×0.85 / unknown ×0.90) | Internal assumption |
| **LTV cap — Secured** | `Sanction ≤ 50%` of free collateral value | General practice — typical LAP LTV |
| **Encumbered asset** | Contributes nothing | General practice |
| **Conversion** | EMI formula `EMI = P·r·(1+r)^n / ((1+r)^n −1)` at lane `typicalRate + sanctionTenure` | Standard maths |

*Lane defaults (judgement — code: `src/data/rateBands.js:25`):* `Personal 13% / 60m · Secured 12% / 84m · Informal 16.5% / 36m` · Age-capped to 60 on both sides.

---

## 5. Safe Amount (O2 — Borrower Side)

| Rule | Value | Source |
|---|---|---|
| **Safe amount** | Inverted EMI: `Safe EMI` at `fair-rate midpoint` + sensible tenure | Standard maths |
| **Sensible tenure** | Personal `48m` · Secured `84m` · Informal `36m` (age-capped to 60) | Internal assumption |
| **Variable pay (salaried)** | Fixed counted fully, variable ×0.5 | Internal assumption |
| **Self-employed cash** | ×0.5 | Internal assumption — unverifiable |
| **Gig discount** | Steady ×0.95 / Variable ×0.85 / Unknown ×0.90 | Internal assumption |

---

## 6. Fair Rate (O3)

| Lane | Unknown | Good (≥750) | Mid (650–749) | Weak (<650) |
|---|---|---|---|---|
| **Personal** | 12–16% | 10.5–12.5% | 11.5–14% | 15–18% |
| **Secured / Business** | 11–13.5% | 10–11.5% | 10.5–12.5% | 12–14% |
| **Informal / Small-ticket** | 15–18% | 13–15% | 14–17% | 17–20% |

- Bands are **assumptions, not live data**. Unknown credit = widest band, never a penalty score.
- Confidence narrows shown range: `High → middle 50%`, `Medium → 75%`, `Low → full width` (`src/rules/rate.js:13`).

---

## 7. APR — Approx. All-in Annual Cost (O3)

| Rule | Value |
|---|---|
| **Approx. all-in annual cost** | `Nominal + fee% × 12 / tenureYears` — shown as *"Approx. all-in annual cost ~14.6%"* with disclaimer *"Estimate — actual fees vary by lender."* |
| **Assumed fee** | Personal/Secured `1%` · Informal `2%` |

Calculation kept, wording borrower-friendly. `aprBreakdown()` `src/rules/rate.js:37` exposes `nominal + feeDrag = apr`.

---

## 8. EMI Presentation (O4)

| Item | Presentation |
|---|---|
| **Your requested loan** | `₹6L` (rounded headline) |
| **Estimated EMI** | `~₹15,650/mo` at fair-mid rate + safe tenure — for the amount you asked for |
| **Your maximum safe EMI** | `~₹42,300/mo` — ceiling, not recommendation; sticky header in results |
| **Tenure table** | At *safer amount centre* (if you borrowed only the safer amount), lane-aware grid `Personal 24/36/48/60 · Secured 36/60/84/120 · Informal 12/24/36/48` — footnote: *"At your requested amount EMIs would be ~₹X higher"* |
| **Lane caps** | Personal 5y · Informal 5y · Secured 10y |

`Max Safe EMI` is stored once `src/rules/cashFlow.js:110` — never two conflicting ceilings.

---

## 9. Stress Tests

| Scenario | Logic | Source |
|---|---|---|
| **Income −20%** | Recompute `FCF −20% BI + 10% buffer relief` → compare stressed FCF to *actual loan EMI* | Internal assumption |
| **Rate +2pp** | Recompute EMI at `fairMid+2%` on safe amount → `Pass ≤ safe EMI ceiling`, `Tight ≤ FCF but > safe ceiling`, `Fail` otherwise | Internal assumption |
| **Labels** | Income: `Pass / Tight (≥70% covered) / Fail`. Rate: `Pass (≤safe) / Tight (≤FCF) / Fail` | Internal assumption — "Tight" is honest for borderline (e.g. Ravi) |

---

## 10. Confidence & Ranges

| Level | Penalty | Meaning |
|---|---|---|
| **High** | `≤1` | Near-complete + documented |
| **Medium** | `≤3.5` | Some gaps or partly undocumented |
| **Low** | `>3.5` | Many unknowns or mostly-cash income |

**Penalties:** `Expenses unknown +1 · EMI unknown +2 · Credit unknown +1 · Savings unknown +1 · Branch extra missing +0.5 · ITR missing +1 · Informal cash +1 · Cash-dominated self-employment +1 · Income as range +0.5 · Bounce +1`. Upcoming large expense is conservative via buffer/lump, not a direct penalty.

Confidence drives all ranges: Amounts `±8% / 15% / 25%` `confidence.js:52` + Rate narrowing above — so confidence and width never contradict.

---

## 11. Unknown Handling

| Field | Behaviour |
|---|---|
| **Credit score** | `Unknown` — widest band, never `weak`/`poor` |
| **Expenses** | Estimated `35%` salaried / `40%` self-employed / `60%` informal (+15pp if sole earner); labelled `Estimated — not provided`; `-1 confidence` |
| **Income stability** | Unknown → `10%` discount + penalty |
| **Savings buffer** | `Unknown` → tolerance widened, `-1`, never `0` |
| **EMI (has loan, amount unknown)** | `15%` of income placeholder, `Estimated`, `-2` |
| **Implementation** | Stored as literal `"unknown"`, never `0/null`; code branches explicitly |

---

## 12. Product Lanes (Only 3)

| Lane | Who | FOIR | Rate | Tenure | Note |
|---|---|---|---|---|---|
| **Unsecured Personal** | Salaried, no collateral | 45% | 11–16% | 1–5y | Simplest |
| **Secured / Business (LAP)** | Has property, thin paperwork | 55% | 10–13.5% | Up to 10y | 50% LTV cap |
| **Small-ticket / Informal** | Gig, no docs | 40% | 14–18% | Up to 5y | Conservative, often says Don't Borrow |

*Not supported:* Home loans (multi-decade), separate gold lane (folded into informal).

---

## 13. Key Assumptions (All Internal, Listed Plainly)

`Safe EMI 0.8` · `Buffer 10%/15%` · `Cash ×0.5` · `Gig 85/90/95%` · `Expenses 35/40/60+15%` · `EMI unknown 15%` · `FOIR 40/45/55%` · `LTV 50%` · All rate bands · APR simplification · Typical rates/tenures/fees · `Income −20% / Rate +2pp / 70% Tight` · Widening `±8/15/25%` + `Bounce +1`.

---

## 14. Limitations & Persistence

No bureau data · Self-reported inputs · Static rate bands (not live) · No co-applicant splitting, multiple properties, foreign income · Not a substitute for underwriting · Draft persists in browser `localStorage` for demo continuity (clear with *Start over*); no backend storage.

---

## 15. Sources

**FOIR caps & 50% LAP LTV:** Standard, widely-used Indian lending norms (not one specific bank). **All else:** Internal assumption as marked above. No live data fetched.
