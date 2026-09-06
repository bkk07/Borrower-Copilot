# Borrower Copilot

Banks tell you what *they'll* give you. This app tells you what's *safe* for you.

Answer ~12 smart questions → get 4 honest outputs (should you borrow · bank sanction vs. safe amount ·
fair rate + real cost · EMI ceiling + stress test) → walk into the bank with a one-page **Negotiation Card**.

Built for the Lokta Borrower Copilot build challenge. No login, no backend, no data stored — everything runs in the browser.

## Run it (under 5 minutes)

```powershell
npm install
npm run dev
```

Open the printed `http://localhost:5173`. To verify the production build:

```powershell
npm run build
npm run preview
npm test
```

Node 18+ required. That's it — no env vars, no services.

## Try the three test borrowers

Home screen → **"Try the three test borrowers"** → Priya (salaried ✅ Borrow) ·
Ravi (shop owner ⚠️ Borrow Less, secured lane) · Anita (gig 🛑 Don't Borrow).
Each jumps to a prefilled Review screen; tap through to results.

## Project layout

```
src/
  data/questions.js     all questions + branching + lane routing + draft→profile
  data/rateBands.js     rate bands, FOIR caps, lane tenures/fees
  data/presets.js       Priya / Ravi / Anita demo presets
  rules/cashFlow.js     DI / blended income / FCF / safe EMI
  rules/sanction.js     FOIR + LTV bank-sanction estimate
  rules/rate.js         band lookup + confidence narrowing + APR
  rules/confidence.js   completeness + verifiability scoring, range widening
  rules/stressTest.js   income −20% / rate +2pp scenarios
  rules/verdict.js      combines everything into O1–O4 + card
  rules/finance.js      EMI / principal maths, INR formatting
  rules/engine.test.js  30+ engine tests (scenarios + edges + branching)
  components/           Questionnaire, ReviewAnswers, ResultsScreen,
                        OutputCard, StressTestCard, NegotiationCard
  App.jsx               wizard state (localStorage persistence + live estimate + a11y)
```

Rules are pure functions — no UI imports — so any threshold can be changed live without touching components.

## Deliverables (challenge root)

- Working app — this repo (`npm run dev`)
- `RULES.md` — every rule, threshold, band, assumption (what · value · why · source/judgement)
- `RUNTHROUGHS.md` — Priya, Ravi, Anita: questions asked, four outputs, Negotiation Card each
- `WALKTHROUGH.md` — five-minute tour: what to click, what to build next, what was cut
