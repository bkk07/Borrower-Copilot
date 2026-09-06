# Borrower Copilot — RULES.md

Every rule, threshold, band and assumption in one table: *what · value · why · source or "my judgement"*.
This document is read as carefully as the code. Code lives in `src/rules/` as pure functions; this file is the contract they implement.

## 1. Philosophy

A bank tells a borrower what *it* is willing to give. Nobody tells the borrower what is actually *safe* for them.
This app is that missing voice — borrower-first, not bank-first. It judges the loan itself, speaks in ranges
(not fake-exact numbers), says "I'm not sure" when it isn't sure, and treats a shopkeeper's cash income
differently from a salaried engineer's salary — because they really are different.

## 2. Definitions (plain language)

| Term | Meaning |
|---|---|
| Documented Income (DI) | Salary, or ITR income ÷ 12 — the part a bank can verify on paper |
| Blended Income (BI) | DI + undocumented cash × 0.5 discount — used only for the borrower's *own* safe math (and the secured lane, see §4), never for plain bank-sanction math |
| Free Cash Flow (FCF) | Blended Income − Existing EMI − Expenses − Safety Buffer |
| Safety Buffer | 10% of income normally; 15% if sole earner or recent bounce |
| FOIR | Fixed Obligations to Income Ratio — the share of verifiable income a lender lets go to EMIs |
| LTV | Loan-to-Value — loan ÷ collateral value; our cap is 50% (LAP norm) |
| APR (approx) | Nominal rate + one-time fee spread over the loan life (simplified, labelled as approximation) |

## 3. Affordability rules (O1 verdict + safe EMI)

| What | Value | Why | Source |
|---|---|---|---|
| Don't Borrow | FCF ≤ 0 | No real room left each month | My judgement |
| Don't Borrow (override) | Recent bounce = yes (informal lane) | Already showing debt stress — new debt makes it worse | My judgement |
| Borrow Less | 0 < FCF but safe EMI < EMI needed for requested amount | Can afford something, not the full ask | My judgement |
| Borrow | Safe EMI ≥ EMI needed, with margin | Genuinely affordable | My judgement |
| Max Safe EMI | FCF × 0.8 (keep 20% breathing room) | Deliberate safety margin | My judgement |
| Income = 0 / no income | O1 = Don't Borrow immediately, skip money math | No income supports no EMI | My judgement |
| EMI > income, or expenses ≥ income | FCF deeply negative → Don't Borrow, flag existing debt | Same FCF rule, surfaced plainly | My judgement |
| Medical purpose | Neutral tone, no "discretionary" scolding | Criticising emergency borrowing is tone-deaf | My judgement |
| Productive purpose (business stock) | Positive qualitative mention only, never a hard number | We cannot verify future earnings | My judgement |

## 4. Lender sanction rules (O2, bank side)

| What | Value | Why | Source |
|---|---|---|---|
| Max lender EMI | FOIR cap × sanction-base income − existing EMI | Standard FOIR method | General Indian lending practice |
| FOIR cap, personal lane | 45% | Unsecured salaried norm | General market practice |
| FOIR cap, secured/business lane | 55% | Collateral lowers lender risk | General market practice |
| FOIR cap, informal lane | 40% | Thin-file / cash income gets tighter caps | General market practice |
| Sanction-base income, salaried | Documented salary | What a bank verifies | My judgement |
| Sanction-base income, secured lane | Blended income (DI + 50%-discounted cash) | LAP-style lenders underwrite cash flow against collateral; pure-ITR view would trap genuine borrowers (see Ravi) | My judgement |
| Sanction-base income, informal lane | Discounted safe income (stability-adjusted) | No documented income exists; small-ticket lenders lend on self-reported flow | My judgement |
| LTV cap, secured lane | Sanction ≤ 50% of free collateral value | Typical LAP loan-to-value | General market practice |
| Encumbered asset | Contributes nothing to sanction | Already pledged elsewhere | My judgement |
| Amount conversion | Standard EMI formula at lane typical rate + tenure | Turns EMI cap into a loan amount | Standard amortisation math |

Lane typical rate/tenure (judgement): personal 13% / 60 mo · secured 12% / 84 mo · informal 16.5% / 36 mo.

## 5. Safe amount rules (O2, borrower side)

| What | Value | Why | Source |
|---|---|---|---|
| Safe amount | EMI formula inverted: safe EMI at fair-rate midpoint, sensible tenure | Same maths as sanction, honest inputs | Standard amortisation math |
| Sensible tenure | Personal 48 mo · secured 84 mo (age-capped at 60) · informal 36 mo | Don't stretch small/uncertain loans for decades | My judgement |
| Salaried variable pay | Fixed part counted fully, variable part × 0.5 | Bonus isn't guaranteed | My judgement |
| Self-employed cash | Counted × 0.5 | Unverifiable by definition | My judgement |
| Gig income discount | Steady ×0.95 · variable ×0.85 · unknown ×0.90 | Volatility is risk; unknown gets mid-level + confidence drop | My judgement |

## 6. Rate rules (O3)

| Lane | Unknown | Good (≥750) | Mid (650–749) | Weak (<650) | Source |
|---|---|---|---|---|---|
| Personal | 12–16% | 10.5–12.5% | 11.5–14% | 15–18% | Judgement-based realistic bands |
| Secured / business | 11–13.5% | 10–11.5% | 10.5–12.5% | 12–14% (rare) | Judgement-based realistic bands |
| Informal / small-ticket | 15–18% | 13–15% | 14–17% | 17–20% | Judgement-based realistic bands |

Bands are **assumptions, not live data**. Unknown credit is *unknown* — never a penalty, the band just stays wide.
Mid-band rows are judgement interpolations. Confidence narrows the shown range: Low = full band, Medium = middle 75%, High = middle 50%.

## 7. APR rules (O3, all-in cost)

| What | Value | Why | Source |
|---|---|---|---|
| APR ≈ nominal + (fee% × 12 ÷ tenure years) | Simplified fee-spreading | Lets borrowers compare 12%+fee vs 13% no-fee honestly | My judgement (approximation, labelled in UI) |
| Default fee assumption | 1% personal/secured · 2% informal | Small-ticket lenders charge more upfront | My judgement |

## 8. EMI rules (O4)

| What | Value | Why | Source |
|---|---|---|---|
| EMI ceiling | = Max Safe EMI (not recomputed) | One number, never two contradicting ceilings | My judgement |
| Tenure table | 2/3/4/5 yrs at safe amount, fair-mid rate | Shows time-vs-interest trade-off | Standard EMI maths |
| Lane tenure caps | Personal 5 yrs · informal 5 yrs · secured 10 yrs | Don't normalise decade-long personal debt | My judgement |

## 9. Stress rules

| What | Value | Why | Source |
|---|---|---|---|
| Scenario 1 | Income −20% → recompute FCF → still covers the *actual loan EMI*? | The question that matters: "would I still manage *this* EMI?" | My judgement |
| Scenario 2 | Rate +2pp → recompute EMI on same safe amount → still fits FCF? | Rate shocks are real in floating/small-ticket credit | My judgement |
| Verdicts | Pass / Tight (≥70% covered) / Fail + new numbers | "Tight" is honest for borderline cases (Ravi) | My judgement |

## 10. Confidence rules

| What | Value | Why | Source |
|---|---|---|---|
| High | Penalty ≤ 1 (near-complete + documented) | Narrow ranges earned | My judgement |
| Medium | Penalty ≤ 3.5 | Some gaps or partly undocumented income | My judgement |
| Low | Above that | Many unknowns or mostly-cash income | My judgement |

Penalties: expenses unknown +1 · EMI amount unknown +2 · credit unknown +1 · savings unknown +1 ·
branch extras missing +0.5 each · ITR missing +1 · informal income +1 (unverifiable) · cash-dominated self-employment +1 ·
income as range +0.5. Confidence directly sets every shown range width (amounts ±8/15/25%, rates narrowed per §6).

## 11. Product-specific rules (3 lanes only)

| Lane | Who | Rate band | Tenure | Notes |
|---|---|---|---|---|
| Unsecured personal | Salaried, no collateral | 11–16% | 1–5 yrs | FOIR-based, simplest |
| Secured / business (LAP-style) | Has property, thin paperwork | 10–13.5% | Up to 10 yrs | Sanction also capped by 50% LTV; longer tenure allowed |
| Small-ticket / informal | Gig income, no docs | 14–18% | Up to 5 yrs | Conservative; often says don't borrow |

NOT supported: home loans (different multi-decade math, none of our borrowers need one), separate gold lane (folded into informal logic).

## 12. Unknown-data handling

| Field | Behaviour |
|---|---|
| Credit score | "Unknown" — full-width band, never a penalty score |
| Expenses | Estimated: 35% salaried · 40% self-employed · 60% informal (+15pp if sole earner); labelled estimated; confidence −1 |
| Income stability | Unknown → 10% mid-level discount + confidence drop |
| Lender offer | Comparison line hidden; no penalty elsewhere |
| Savings buffer | Unknown → widened tolerance + confidence −1; never assumed zero |
| EMI amount (has one, unknown value) | 15%-of-income placeholder, labelled estimated, confidence −2 |

Implementation rule: unknowns are stored as literal `"unknown"`, never silent `0`/`null`. Code branches on it explicitly.

## 13. Assumptions (all "my judgement", listed plainly)

0.8 safe-EMI factor · 10/15% buffers · 50% cash discount · 85/90/95% gig factors · 35/40/60(+15)% expense ratios ·
15% unknown-EMI placeholder · FOIR 40/45/55% · LTV 50% · all rate bands · APR simplification · typical rates/tenures/fees ·
stress scenarios (−20%, +2pp, 70% "tight" line) · confidence weights and ±8/15/25% widening.

## 14. Limitations

No bureau data · all inputs self-reported · rate bands are static judgement, not live offers · no co-applicant splitting,
no multiple properties, no foreign income · not a substitute for real underwriting · resets on refresh (no storage by design).

## 15. Sources

FOIR caps and 50% LAP LTV: standard, widely-used Indian lending norms (not one specific bank). Everything else: "my judgement",
as marked above. No live data is fetched anywhere.
