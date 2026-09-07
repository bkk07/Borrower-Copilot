# Borrower Copilot — Know What's Safe Before You Borrow

**Borrower Copilot** is a browser-only decision assistant for Indian borrowers. It helps you answer four questions before you visit a bank: *Should I borrow? How much is safe? What's a fair interest rate? What EMI can I comfortably afford?*

Unlike a standard EMI calculator, it judges the loan itself — showing ranges, not false precision, and producing a one-page **Negotiation Card** you can take to the lender.

> **No login · No backend · No data stored · 100% in-browser · ~3 minutes**

---

## Why This Exists

A bank tells you what *it* is willing to give you. Nobody tells you what is actually *safe* for you, given your cash flow, existing EMIs, expenses, and safety buffer.

Borrower Copilot is the missing voice on the borrower's side:

- Two numbers, clearly separated: **Possible lender sanction** (FOIR-based, lender view) vs **Safer borrowing range** (cash-flow based, your view)
- Fair rate as a **band**, plus approx. all-in annual cost (with fee effect)
- EMI ceiling comparison: **Requested-loan EMI vs Maximum safe EMI** + tenure trade-off table
- One stress test: income −20% and rate +2%
- Honest `Don't Borrow` when numbers say so — with a clear why

---

## Key Features

- **Adaptive questionnaire** — 9 core questions + 2–5 branch extras for `salaried / self-employed / informal` incomes. ~12 questions total, everyone sees only their path.
- **9 real-world purposes** — `Essential expense`, `Planned personal / family expense`, `Home improvement`, `Major purchase`, `Start or grow my income`, `Pay off existing debt`, `Education or career`, `Income-generating asset`, `Something else` (not tied to demo personas).
- **Three loan lanes** — automatically routed: `Personal (45% FOIR)`, `Secured / Business (55% FOIR + 50% LTV)`, `Small-ticket / Informal (40% FOIR)` — so a shop owner with property isn't judged like a salaried employee.
- **Honesty engine** — `Unknown` stays `Unknown`. Expenses/EMI unknown → `Estimated` label, wider ranges, lower confidence. Never silent zero.
- **Live estimate** — verdict preview while you answer (desktop sidebar + mobile strip).

---

## Quick Start (under 5 minutes)

**Requirements:** Node 18+

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`

Verify production build & tests:

```powershell
npm run build
npm run preview
npm test
npm run lint
```

No environment variables, no services.

---

## Try the Three Test Borrowers

Home → **"Try the three test borrowers"**

| Persona | Income | Ask | Expected |
|---|---|---|---|
| **Priya, 29** — Bengaluru, salaried | ₹1,10,000, EMI ₹14k, score 780 | ₹8L for *Planned personal / family expense* | **Borrow** — personal lane |
| **Ravi, 42** — Mysuru, kirana owner | ITR ₹4.2L/yr + cash ₹40–80k, property ₹45L | ₹15L to *Start or grow my income* | **Borrow Less** — secured lane, LTV capped |
| **Anita, 35** — Hubballi, gig | ₹26–30k variable, 3 app loans, bounce | ₹1.5L *Income-generating asset* | **Don't Borrow** — safe ≈₹0 |

Each jumps to a prefilled **Review** screen → edit any answer → **Results**.

---

## How It Works (High Level)

```
Answers → draftToProfile() → resolveLane() → Cash Flow (BI, FCF, Safe EMI)
       → Lender Sanction (FOIR + LTV) → Fair Rate (band → narrowed by confidence)
       → Safe Amount → Verdict (Borrow / Borrow Less / Don't Borrow)
       → APR + Tenure Table → Stress Test → Confidence → Negotiation Card
```

All calculations are **pure functions** in `src/rules/` — same answers always give same results, separately testable from UI.

**Core formulas (simplified):**

- `Blended Income = Documented + Undocumented × 0.5`
- `FCF = Blended Income − Existing EMI − Expenses − Safety Buffer (10% → 15% if sole earner/bounce/upcoming) − Upcoming/6`
- `Safe EMI = FCF × 0.8` (20% breathing room)
- `Lender Max EMI = FOIR cap × Verifiable Income − Existing EMI`
- `APR ≈ nominal + fee% × 12 / tenureYears` (approx., labelled as estimate)

See full thresholds in [`RULES.md`](./RULES.md).

---

## Project Structure

```
src/
  data/
    questions.js      Questions, branching (showIf), lane routing, draft→profile, 9 purposes
    rateBands.js      Rate bands, FOIR caps, tenures, LTV, purpose classes
    presets.js        Priya / Ravi / Anita demo data (43 tests rely on this)
  rules/              Pure functions — no UI imports
    cashFlow.js       DI / BI / FCF / Safe EMI (+ estimated flags)
    sanction.js       FOIR + LTV sanction (age-capped to 60)
    rate.js           Rate lookup + narrowing + APR breakdown
    confidence.js     Completeness + verifiability → High/Medium/Low + widening 8/15/25%
    stressTest.js     Income −20% (Pass/Tight/Fail) + Rate +2pp (Pass/Tight/Fail vs safe ceiling)
    verdict.js        O1–O4 aggregator + card + explanations
    finance.js        EMI math, INR helpers (fmtLakhRounded for headlines)
    engine.test.js    43 engine tests
  components/
    Questionnaire.jsx  Single-question renderer (MoneyInput with live INR hint, StepperPicker for age/counts)
    ReviewAnswers.jsx  Grouped edit screen
    ResultsScreen.jsx  O1 Hero + O2 Dual Bars + O3 Track + O4 EMI split (sticky) + Stress + Trace + Card
    NegotiationCard.jsx Card with Copy / Print (Web Share fallback)
    ui.jsx            Logo (SVG mark), Header, ConfBadge
  App.jsx             Wizard (welcome → quiz → review → results) + localStorage persistence + live estimate
  index.css           Paper/ink/brand tokens, bc-* components, motion & print rules
```

Change a threshold? Edit `src/rules/` or `src/data/rateBands.js` — UI updates without code change.

---

## Testing & Quality

```powershell
npm test   # 43 tests: cash-flow, LTV, rate unknown→wide, confidence, 3 personas, bounce hardening, edges
npm run lint
npm run build   # 33 modules, ~82kB gzip
```

All outputs are ranges. No hard claim like `17,89,209` in headlines — rounded to `₹12–16L` style with precise `Show exact numbers` expandable.

---

## Limitations

- Self-reported inputs only — no bureau pull
- Static rate bands (assumptions, not live offers)
- No co-applicant splitting, multiple properties, foreign income
- Not a substitute for real underwriting
- Draft persists in `localStorage` for demo (clear via *Start over*)

---

## Documentation

- **Rules:** [`RULES.md`](./RULES.md) — every rule, threshold, assumption (`what · value · why · source`)
- **Run-throughs:** [`RUNTHROUGHS.md`](./RUNTHROUGHS.md) — 3 borrowers end-to-end with engine traces + cards
- **Walkthrough:** [`WALKTHROUGH.md`](./WALKTHROUGH.md) — 5-minute demo script

---

## License

Internal demo for the Lokta Build Challenge. No license for production use — thresholds are documented assumptions, not financial advice.
