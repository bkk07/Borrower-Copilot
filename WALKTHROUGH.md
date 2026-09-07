# Borrower Copilot — 5-Minute Walkthrough

> One sentence: Answer ~12 questions about your cash flow, get 4 honest outputs, walk into the bank with a one-page card — no login, no data leaving your browser.

---

## 0:00–1:00 The Idea

**Problem:** A bank tells you what *it* will give you. Nothing tells you what is *comfortable* for you — after EMIs, rent, school fees, and a safety cushion.

**Solution:** Borrower Copilot shows two numbers side-by-side — **Possible lender sanction** (FOIR-style, lender view) vs **Safer borrowing range** (cash-flow, your view) — plus fair rate band, EMI ceiling comparison, and a stress test. Every headline is a rounded range; details expand to precise math. Unknown answers widen the range and lower confidence, never a silent zero.

---

## 1:00–3:30 One Borrower End-to-End (Priya)

1. **Open → Check my loan**
   `npm run dev` → `http://localhost:5173` → **Check my loan**
2. **Answer as Priya** (9 core + salaried extras):
   - *What are you planning to use the money for?* → **Planned personal / family expense**
   - *How much?* → **₹8,00,000** (tap chip `₹8L` or type from ₹0)
   - *Loan type* → **Personal**
   - *How do you earn?* → **Salaried** → *Years worked 5* → *Variable pay skip*
   - *Monthly income* → **₹1,10,000**
   - *Existing EMI* → **₹14,000** (or `Estimate it for me` if unknown)
   - *Essential expenses* → **₹40,000**
   - *Age* → **29** (stepper, no free typing)
   - *Credit score known?* → **Yes → 780** (stepper, 300–900, unknown stays widest band)
   - *Savings buffer* → **Not sure**
3. **Review → Edit live**
   *Review your answers* is grouped: *The essentials / About your salary*. Tap any row → jump back to that question → change it → forward again. Draft persists in `localStorage` (clear via *Start over*).
4. **Results**
   - **O1 Should you borrow?** — **Borrow** · ₹20,891/mo needs vs ₹36,000/mo safe ceiling
   - **O2 How much?** — **Possible sanction ₹13–18L** vs **Safer range ₹12–16L** — *use this* (details: `See precise amounts`)
   - **O3 What's a fair rate?** — **10.8–12.3%** · Approx. all-in **~14.6%** (`Estimate — actual fees vary`) + range track
   - **O4 What EMI should you agree to?** — **Requested ~₹20,891** vs **Max safe ~₹36,000** (sticky header) + tenure table at safer amount + footnote
   - **Stress** — `Income −20% Pass` · `Rate +2pp Pass`
   - **Confidence Medium** — only buffer unknown
5. **Negotiation Card** → **Copy card** (toast) / **Print / Save** (Web Share fallback). The card shows: Requested + Possible/Safer ranges + Fair rate + Approx. all-in + Requested vs Max EMI + Why + *Could you offer ≤12.3% at ~1% fee? My fair range is 10.8–12.3%.*

Quick presets: Home → **Run Priya's / Ravi's / Anita's case →** jumps straight to Review with prefilled data.

---

## 3:30–4:30 Why the Other Two Matter

- **Ravi, 42 — Mysuru, self-employed, ₹45L property** — Asks *Start or grow my income* ₹15L. ITR-only math would say ~₹5L. Because collateral is free, the app routes to **Secured / Business lane** (FOIR 55% + 50% LTV) → **Possible ₹17–23L but Safer ₹12–17L** → **Borrow Less**. Stress `Tight` is the honest signal. This proves lane routing works.
- **Anita, 35 — Hubballi, gig ₹26–30k variable, sole earner, 3 app loans, bounce** — Asks *Income-generating asset* ₹1.5L. Cash-flow `FCF −₹1,120 → Safe EMI 0`. → **Don't Borrow** with `Recent bounce increases risk` warning + consolidation note *Clear ₹35k high-rate loans first*. **Possible sanction ₹1.3–2.1L is still shown** with note *"A lender may still offer a loan, but that does not mean it is affordable"* — the core principle. Proves `Don't Borrow` is reachable and not branding the borrower.

---

## 4:30–5:00 What Next / What Was Cut

**Built & verified:** 43 engine tests `npm test`, lane-aware tenure grids, age cap to 60, upcoming-expense buffer bump, debt-payoff swap analysis, rounded headlines + precise details, aria-describedby for Q1 helper, toast + sticky O4.

**Build next (if time):** Saved scenarios export, Hindi/Kannada copy, PWA offline install.

**Intentionally cut — per spec CUT list:** Login/accounts, backend/DB, ML credit scoring, bureau pull, home-loan multi-decade math, negotiation chatbot, PDF library, loan-ROI calculator. All would add complexity without improving the core decision.

**Live-change defense:** Every threshold they can ask to change live is a pure function in `RULES.md` + `src/rules/` — e.g. FOIR caps `src/data/rateBands.js:26`, buffers `src/rules/cashFlow.js:91`, widening `src/rules/confidence.js:52`. Change a number → `npm test` stays green in <1s.

---

### Checklist Before You Demo

- `npm run dev` works in 3 commands
- Priya → Borrow · Ravi → Borrow Less + secured badge · Anita → Don't Borrow with bounce warning
- Each Results page shows: O1 verdict + bounce note (if any), O2 two bars, O3 band + `~X%` approx. all-in, O4 split EMI box, stress `Pass/Tight/Fail`, trace list, card with `Copy`
- Refresh → draft restored via localStorage; Start over → cleared
