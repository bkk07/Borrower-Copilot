# Borrower Copilot — Rules & Assumptions

> **How to read this document:** This is the contract between product and code. Every threshold, band and assumption is listed as *what · value · why · source*. The code lives in `src/rules/` as pure functions — same inputs always give same outputs, independently testable from the UI.
>
> **For borrowers:** Headlines in the app are plain language ("Bank estimate", "Safer range"). Technical terms below (FOIR, LTV, FCF) appear here for precision, not in the main result headings.

---

## Table of Contents
1. [Philosophy](#1-philosophy)
2. [Definitions](#2-definitions)
3. [Affordability & Verdict (O1)](#3-affordability--verdict-o1)
4. [Lender Sanction (O2 — Bank View)](#4-lender-sanction-o2--bank-view)
5. [Safe Amount (O2 — Your View)](#5-safe-amount-o2--your-view)
6. [Fair Rate (O3)](#6-fair-rate-o3)
7. [APR — Approx. All-in Cost (O3)](#7-apr--approx-all-in-cost-o3)
8. [EMI Presentation (O4)](#8-emi-presentation-o4)
9. [Stress Tests](#9-stress-tests)
10. [Confidence & Ranges](#10-confidence--ranges)
11. [Multiple Existing EMIs — Tenure Matters](#11-multiple-existing-emis--tenure-matters)
12. [Unknown Handling](#12-unknown-handling)
13. [Product Lanes](#13-product-lanes)
14. [All Assumptions (One Line)](#14-all-assumptions-one-line)
15. [Limitations & Persistence](#15-limitations--persistence)
16. [Sources](#16-sources)

---

## 1. Philosophy

A bank tells you the maximum it *can* lend. Nobody tells you what remains *comfortable* after EMIs, rent, school fees and a safety cushion for the unexpected.

**Borrower Copilot is borrower-first:**

- **Ranges, not false precision.** Headlines `₹12–16L`; details expand to `₹12,42,501–₹16,81,031` if you want them.
- **Unknown stays unknown.** `I don't know` widens the range and lowers confidence — it never becomes a silent `0`.
- **Income by type.** Salary, `ITR + discounted cash`, and gig income are treated differently — because they are.
- **Purpose is tone, not maths.** The 9 purposes below change the explanation, never the affordability decision. A wedding loan doesn't auto-fail; a business loan doesn't auto-pass.

---

## 2. Definitions

| Term | Meaning |
|---|---|
| **Documented Income (DI)** | Verifiable on paper — your salary, or `ITR per year ÷ 12` |
| **Blended Income (BI)** | `DI + Undocumented cash × 0.5` — used for *your* safe calculation (and the secured lane, see §4). Otherwise DI only |
| **Free Cash Flow (FCF)** | `BI − Existing EMI − Expenses − Safety Buffer − UpcomingExpense/6` (if any) |
| **Safety Buffer** | `10%` of BI normally; `15%` if sole earner, recent bounce, or a large upcoming expense within 6 months |
| **FOIR** | Fixed Obligations to Income Ratio — the share of verifiable income a lender allocates to EMIs |
| **LTV** | Loan-to-Value — `Loan ÷ Collateral value`; our cap is `50%` (LAP norm, see §4) |
| **APR (approx.)** | `Nominal + fee% × 12 / tenureYears` — simplified, shown as *Approx. all-in annual cost* with disclaimer |

---

## 3. Affordability & Verdict (O1)

| Rule | Condition | Source |
|---|---|---|
| **Don't Borrow** | `FCF ≤ 0` — nothing left after EMIs, expenses and buffer | Internal |
| **Bounce signal** | `recentBounce = yes` → amber warning + `confidence −1`. `Don't Borrow` *only* if `FCF ≤ 0`; otherwise `Borrow / Borrow Less` by normal affordability with warning | Internal — affordability decides, not stigma |
| **Debt-payoff check** | `loanPurpose = debt_payoff` + `existing EMI > 0` → show `needs − old EMI` swap analysis | Internal |
| **Borrow Less** | `0 < FCF` but `Safe EMI < EMI needed` for the amount you asked for | Internal |
| **Borrow** | `Safe EMI ≥ EMI needed` with margin | Internal |
| **Safe EMI** | `FCF × 0.8` — keep 20% breathing room. This single number is the ceiling everywhere | Internal |
| **No income** | `Requested ≤ 0` or `BI ≤ 0` → `Don't Borrow` immediately, skip further math | Internal |
| **Over-stretched** | `EMI > Income` or `Expenses ≥ Income` → `FCF` deeply negative → `Don't Borrow` | Internal |
| **Tone** | `essential` and `education` → neutral (not penalised as discretionary). Other purposes → normal tone. `income_growth / productive_asset` noted qualitatively, never inflated | Internal |

### 3a. Purpose Classes

Purposes change the *explanation*, never the *decision*. Cash flow is the decider.

| Purpose Value | Class | Usage |
|---|---|---|
| `essential` | essential | Neutral tone |
| `planned_personal` | discretionary_personal | Normal tone |
| `home_improvement` | home | Normal tone |
| `major_purchase` | discretionary_purchase | Normal tone |
| `income_growth` | productive | Qualitative note only |
| `productive_asset` | productive_asset | Qualitative note only |
| `debt_payoff` | debt_repayment | Triggers swap analysis |
| `education` | education | Neutral tone |
| `other` | other | Neutral fallback |

**Taxonomy (9 categories):** `Essential · Planned personal/family · Home improvement · Major purchase · Start/grow income · Pay off debt · Education/career · Income-generating asset · Other` — challenge personas are test cases, not the product taxonomy.

---

## 4. Lender Sanction (O2 — Bank View)

| Rule | Value | Source |
|---|---|---|
| **Possible lender sanction (EMI)** | `FOIR cap × Verifiable Income − Existing EMI` | General Indian lending practice |
| **Safer borrowing range** | `FCF → Safe EMI → Amount` (your comfort) | Internal |
| **FOIR — Personal** | `45%` | General practice — unsecured salaried norm |
| **FOIR — Secured / Business** | `55%` | General practice — collateral lowers risk |
| **FOIR — Informal / Small-ticket** | `40%` | General practice — thin-file, tighter cap |
| **Base income — Salaried** | Documented salary | Internal |
| **Base income — Secured** | Blended Income (`DI + 50% cash`) — LAP lenders assess cash flow against collateral | Internal |
| **Base income — Informal** | Discounted blended income (`steady ×0.95 / variable ×0.85 / unknown ×0.90`) | Internal |
| **LTV cap — Secured** | `Sanction ≤ 50%` of *free* collateral value | General practice — typical LAP LTV |
| **Encumbered asset** | Contributes nothing | General practice |
| **Conversion** | `EMI = P·r·(1+r)^n / ((1+r)^n −1)` at lane `typicalRate + sanctionTenure` | Standard maths |

*Lane defaults (judgement — `src/data/rateBands.js:25`):* `Personal 13% / 60m · Secured 12% / 84m · Informal 16.5% / 36m` · Age-capped to 60 on both sides.

---

## 5. Safe Amount (O2 — Your View)

| Rule | Value | Source |
|---|---|---|
| **Safe amount** | Inverted EMI: `Safe EMI` at `fair-rate midpoint` + sensible tenure | Standard maths |
| **Sensible tenure** | Personal `48m` · Secured `84m` · Informal `36m` (each age-capped to 60) | Internal |
| **Variable pay (salaried)** | Fixed counted fully, variable ×0.5 | Internal |
| **Self-employed cash** | ×0.5 | Internal — unverifiable |
| **Gig discount** | Steady ×0.95 / Variable ×0.85 / Unknown ×0.90 | Internal |

---

## 6. Fair Rate (O3)

| Lane | Unknown | Good (≥750) | Mid (650–749) | Weak (<650) |
|---|---|---|---|---|
| **Personal** | 12–16% | 10.5–12.5% | 11.5–14% | 15–18% |
| **Secured / Business** | 11–13.5% | 10–11.5% | 10.5–12.5% | 12–14% |
| **Informal / Small-ticket** | 15–18% | 13–15% | 14–17% | 17–20% |

- Bands are **assumptions, not live data**. `Unknown` credit = widest band, never a penalty score.
- Confidence narrows what you see: `High → middle 50%`, `Medium → 75%`, `Low → full width` (`src/rules/rate.js:13`).

---

## 7. APR — Approx. All-in Annual Cost (O3)

| Rule | Value |
|---|---|
| **Approx. all-in annual cost** | `Nominal + fee% × 12 / tenureYears` — shown as *Approx. all-in annual cost ~14.6%* with disclaimer: *"Estimate — actual fees vary by lender."* |
| **Assumed fee** | Personal / Secured `1%` · Informal `2%` |

Calculation kept, wording borrower-friendly. `aprBreakdown()` `src/rules/rate.js:37` exposes `nominal + feeDrag = apr`.

---

## 8. EMI Presentation (O4)

| Item | How It Looks |
|---|---|
| **Your requested loan** | `₹6L` (rounded headline) |
| **Estimated EMI** | `~₹15,650/mo` at fair-mid rate + safe tenure — for the amount you asked for |
| **Your maximum safe EMI** | `~₹42,300/mo` — ceiling, not a recommendation; sticky header in results |
| **What-if slider** | Drag `₹2L → ₹15L` and see `~₹7k → ~₹27k/mo says Fits / Above ceiling` live — same `emiForPrincipal` math |
| **Tenure table** | At *safer amount centre* (if you borrowed only the safer amount), lane-aware grid `Personal 24/36/48/60 · Secured 36/60/84/120 · Informal 12/24/36/48` · Footnote: *At your requested amount EMIs would be ~₹X higher* |
| **Caps** | Personal 5y · Informal 5y · Secured 10y |

`Safe EMI` is computed once `src/rules/cashFlow.js:110` — never two conflicting ceilings.

---

## 9. Stress Tests — Interactive Lab

| Scenario | Logic | Source |
|---|---|---|
| **Income drop** | Recompute `FCF − drop% × BI + 10% buffer relief` → compare stressed FCF to *your loan's EMI* | Internal — *"Would I still manage this EMI?"* |
| **Rate hike** | Recompute EMI at `fairMid + delta` on safe amount → `Pass ≤ safe EMI ceiling`, `Tight ≤ FCF but > safe ceiling`, `Fail` otherwise | Internal |

**Labels:** Income: `Pass / Tight (≥70% covered) / Fail`. Rate: `Pass (≤safe) / Tight (≤FCF) / Fail`. *Tight* is the honest middle for borderline cases (e.g. Ravi).

**Interactive:** The card is now a **Stress Lab** — two sliders `Income 0→−30% / Rate +0→+3pp` live-recompute `stressTest({incomeDropPct, rateDelta})` `src/rules/stressTest.js:4`. Same engine, your what-if.

---

## 10. Confidence & Ranges

| Level | Penalty | Meaning |
|---|---|---|
| **High** | `≤1` | Near-complete + documented |
| **Medium** | `≤3.5` | Some gaps or partly undocumented |
| **Low** | `>3.5` | Many unknowns or mostly-cash income |

**Penalties:** `Expenses unknown +1 · EMI unknown +2 · Credit unknown +1 · Savings unknown +1 · Branch extra missing +0.5 · ITR missing +1 · Informal cash +1 · Cash-dominated self-employment +1 · Income as range +0.5 · Bounce +1 · EMI horizon unknown +0.5`. Upcoming large expense is conservative via buffer/lump, not a direct penalty. EMI horizon/breakdown unknowns add `+0.5` each.

Confidence drives all ranges: Amounts `±8% / 15% / 25%` `confidence.js:52` + Rate narrowing above — confidence and width never contradict.

---

## 11. Multiple Existing EMIs — Tenure Matters

Borrowers often have `₹3k/1yr + ₹10k/2yr + ₹20k/5yr = ₹33k` today. Tenure matters because a `₹3k` loan frees headroom in 12 months.

- **Question:** After you enter total EMI, the app asks: `When does your largest EMI finish? [Within 6m / 6–12m / 1–2y / >2y / Not sure]` → optional `How many separate EMIs? [1/2/3+]` → if `2/3+`, per-EMI amount + months-left.
- **Engine:** `cashFlow.js` computes `expiringRelief = sum(short EMIs <12m)`. Your verdict and `FCF` still use *today's* total — no optimism. A second set `fcfAfterRelief / safeEmiAfterRelief` and `After relief: Once ₹10k ends 6–12m (₹13k/mo) ends, headroom → ~₹X safe` is display-only. A 12-dot strip `ResultsScreen` shows `●●● ₹33k now → ○○○ ₹20k after 6m`.
- **If you skip tenure:** Horizon defaults to `unknown` → no relief assumed + `+0.5` confidence penalty — same conservative path as before.

---

## 12. Unknown Handling

| Field | Behaviour |
|---|---|
| **Credit score** | `Unknown` — widest band, never `weak`/`poor` |
| **Expenses** | Estimated `35%` salaried / `40%` self-employed / `60%` informal (+15pp if sole earner); labelled `Estimated — not provided`; `−1 confidence` |
| **Income stability** | Unknown → `10%` discount + penalty |
| **EMI (has loan, amount unknown)** | `15%` of income placeholder, `Estimated`, `−2` |
| **EMI horizon / breakdown** | Unknown → no relief + `+0.5` each |
| **Savings buffer** | `Unknown` → tolerance widened, `−1`, never `0` |
| **Implementation** | Stored as literal `"unknown"`, never `0/null`; code branches explicitly |

---

## 13. Product Lanes (Only 3)

| Lane | Who | FOIR | Rate | Tenure | Note |
|---|---|---|---|---|---|
| **Unsecured Personal** | Salaried, no collateral | 45% | 11–16% | 1–5y | Simplest |
| **Secured / Business (LAP)** | Has property, thin paperwork | 55% | 10–13.5% | Up to 10y | 50% LTV cap |
| **Small-ticket / Informal** | Gig, no docs | 40% | 14–18% | Up to 5y | Conservative, often says Don't Borrow |

*Not supported:* Home loans (multi-decade), separate gold lane (folded into informal).

---

## 14. All Assumptions (One Line, Listed Plainly)

`Safe EMI 0.8` · `Buffer 10%/15%` · `Cash ×0.5` · `Gig 85/90/95%` · `Expenses 35/40/60+15%` · `EMI unknown 15%` · `FOIR 40/45/55%` · `LTV 50%` · All rate bands · APR simplification · Typical rates/tenures/fees · `Income −20% / Rate +2pp / 70% Tight` (lab allows `0–30%` / `0–3pp`) · `Rate Tight = >safeEmi but ≤FCF` · Widening `±8/15/25%` + `Bounce +1` + `Horizon +0.5`.

---

## 15. Limitations & Persistence

No bureau data · Self-reported inputs · Static rate bands (not live) · No co-applicant splitting, multiple properties, foreign income · Not a substitute for underwriting · Draft persists in browser `localStorage` for demo continuity + shareable `#s=...` hash link (no backend) — clear with *Start over*.

---

## 16. Sources

**FOIR caps & 50% LAP LTV:** Standard, widely-used Indian lending norms (not one specific bank). **All else:** Internal assumption as marked above. No live data is fetched.
