# Borrower Copilot

### Know what's safe before you borrow — not just what a bank will give you.

> **A browser-only decision assistant for Indian borrowers.**
> Answer ~12 questions → get 4 honest answers + a one-page negotiation card. No login, no backend, no data leaving your device.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#testing--quality)
[![Tests](https://img.shields.io/badge/tests-44%20passing-brightgreen)](#testing--quality)
[![Version](https://img.shields.io/badge/version-1.0-blue)](#)
[![No Backend](https://img.shields.io/badge/backend-none-lightgrey)](#why-this-exists)

---

## Table of Contents
- [Why This Exists](#why-this-exists)
- [What Makes It Different](#what-makes-it-different)
- [Live Demo — Try the Three Borrowers](#live-demo--try-the-three-borrowers)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Testing & Quality](#testing--quality)
- [Limitations](#limitations)
- [Documentation](#documentation)

---

## Why This Exists

A sanction letter tells you the maximum a bank *can* give. It doesn't tell you what remains *comfortable* after EMIs, rent, school fees, and a safety cushion for the unexpected.

**Borrower Copilot** fills that gap:

| What Other Calculators Do | What Borrower Copilot Does |
|---|---|
| Takes amount + rate + tenure → EMI | Judges the loan: *Should you borrow at all?* |
| Shows a single exact number | Shows **ranges** (`₹12–16L`) + precise details on demand |
| Treats all income the same | Routes `salaried` vs `self-employed + property` vs `gig` differently |
| Ignores uncertainty | `I don't know` widens the range and lowers confidence — never counted as zero |

---

## What Makes It Different

- **Adaptive Questionnaire — 12 questions on average.** 9 core + 2–5 branch extras. Salaried, shop owner, and gig worker each see only their path.
- **Two Numbers, Honestly Separated.** `Possible lender sanction` (what a bank *might* approve) vs `Safer borrowing range` (what cash flow says is comfortable) — plus a Waterfall bar and a 12-dot relief strip when a short EMI frees headroom.
- **Stress Lab — Drag the Future.** Income `0→−30%` and Rate `+0→+3pp` sliders live-recompute `Pass / Tight / Fail` on the same engine.
- **One-Page Negotiation Card.** `Requested · Possible vs Safer · Fair rate · Approx. all-in · EMIs · Why` plus *“Could you offer ≤12.3% at ~1% fee?”* and *“If they say 14%, reply: My max is ₹26k/mo.”* — **Copy / Save as Image / Print / Share link** (`#s=...` hash, no backend).
- **9 Real-World Purposes & Honest Unknowns.** Built for thousands of borrowers, not 3 personas. `I don't know` widens the range and lowers confidence — never counted as zero; live estimate updates as you answer.

---

## Live Demo — Try the Three Borrowers

Home → **Try the three test borrowers** → prefilled **Review** → tap any row to edit → **See my results**

| Persona | Situation | Ask | System |
|---|---|---|---|
| **Priya, 29** — Bengaluru, salaried | ₹1,10,000, EMI ₹14k, score 780 | ₹8L · *Planned personal / family expense* | **Borrow** — personal lane, `₹12–16L` safer |
| **Ravi, 42** — Mysuru, kirana owner | ITR ₹4.2L/yr + cash ₹40–80k, property ₹45L free | ₹15L · *Start or grow my income* | **Borrow Less** — secured lane, 50% LTV-capped, `Tight` on Income −20% |
| **Anita, 35** — Hubballi, gig | ₹26–30k variable, 3 app loans, bounce | ₹1.5L · *Income-generating asset* | **Don't Borrow** — safer `≈₹0`, `Low` + bounce warning |

---

## Quick Start

**Requires:** Node 18+

```powershell
npm install
npm run dev          # → http://localhost:5173
```

Check production build, tests and lint:
```powershell
npm run build
npm run preview
npm test            # 44 tests — cash-flow, LTV, rate, confidence, personas, bounce, edges
npm run lint
```

No `.env`, no services, no database.

---

## How It Works

```
Answers → draftToProfile() → resolveLane() → Cash Flow (BI, FCF, Safe EMI)
       → Lender Sanction (FOIR + LTV, age-capped to 60)
       → Fair Rate (band narrowed by confidence) → Safe Amount
       → Verdict (Borrow / Borrow Less / Don't Borrow)
       → APR (approx. all-in) + Tenure Table + Stress Lab → Confidence → Negotiation Card
```

**Core formulas (simplified):**

- `Blended Income = Documented + Undocumented × 0.5` (gig: `×0.95 / 0.85 / 0.90`)
- `FCF = Blended Income − Existing EMI − Expenses − 10% Buffer (15% if sole/bounce/upcoming) − Upcoming/6`
- `Safe EMI = FCF × 0.8` — 20% breathing room, the single ceiling
- `Lender Max EMI = FOIR cap (45% / 55% / 40%) × Verifiable Income − Existing EMI`
- `APR ≈ nominal + fee% × 12 / tenureYears` — shown as *Approx. all-in annual cost*

> All rules are **pure functions** in `src/rules/` — same inputs → same outputs, UI-free and live-changeable. See [`RULES.md`](./RULES.md) for every threshold.

---

## Project Structure

```
src/
  data/
    questions.js      Questions, branching (showIf), lane routing, draft→profile, 9 purposes, horizon + 3-EMI breakdown
    rateBands.js      Rate bands, FOIR caps (45/55/40), tenures, LTV 50%, purpose classes
    presets.js        Priya / Ravi / Anita — demos & test fixtures
  rules/              Pure functions — zero UI imports
    cashFlow.js       DI / BI / FCF / Safe EMI + expiring relief (12-mo)
    sanction.js       FOIR + LTV sanction (age-capped)
    rate.js           Band lookup → narrowing + APR breakdown
    confidence.js     Completeness + verifiability → High/Medium/Low + widening 8/15/25%
    stressTest.js     Interactive Income −30% & Rate +3pp lab (Pass/Tight/Fail vs safe ceiling)
    verdict.js        O1–O4 aggregator, What-if amount slider, card
    finance.js        EMI / principal math, INR formatting (rounded headlines)
    engine.test.js    44 engine tests
  components/
    Questionnaire.jsx  MoneyInput (live INR hint) + StepperPicker (age/counts, no free typing) + horizon/breakdown
    ReviewAnswers.jsx  Grouped edit screen
    ResultsScreen.jsx  Hero + O2 Dual Bars + O3 Track + O4 EMI split (sticky) + Stress Lab + Waterfall + Relief + Trace + Card
    NegotiationCard.jsx Card with Copy / Save as Image (canvas) / Print + Share link
    ui.jsx            SVG Mark + Logo, Header, ConfBadge
  App.jsx             Wizard (welcome → quiz → review → results) + localStorage + hash-share + live estimate
  index.css           Paper/ink/brand tokens, bc-* components, motion & print rules
```

Change a number? Edit `src/rules/` or `src/data/rateBands.js` — `npm test` stays green in <1s for the follow-up live change.

---

## Testing & Quality

```powershell
npm test   # 44 tests: cash-flow & LTV, rate unknown→wide, confidence tiers, 3 personas, bounce hardening, purpose taxonomy, EMI tenure relief, edges
npm run lint   # 0 errors
npm run build  # 33 modules, ~83–85kB gzip
```

Headlines never claim false precision (`17,89,209`): rounded to `₹12–16L`, precise on `Show exact numbers` expand.

---

## Limitations

Self-reported inputs only — no bureau pull · Static rate bands (assumptions, not live offers) · No co-applicant splitting, multiple properties, foreign income · Not a substitute for real underwriting · Draft persists in `localStorage` + shareable `#s=` hash for demo (clear via *Start over*).

---

## Documentation

- **Rules:** [`RULES.md`](./RULES.md) — *what · value · why · source* for every rule, threshold and band
- **Run-Throughs:** [`RUNTHROUGHS.md`](./RUNTHROUGHS.md) — Priya, Ravi, Anita end-to-end with engine traces and cards
- **Walkthrough:** [`WALKTHROUGH.md`](./WALKTHROUGH.md) — 5-minute demo script: what to click, what builds next, what was cut

---

## License

Built for the Lokta Build Challenge. Thresholds are documented assumptions, not financial advice. No license for production use.
