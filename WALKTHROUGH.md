# Borrower Copilot — 5-Minute Walkthrough

> **One sentence:** Answer ~12 questions about your cash flow, get 4 honest outputs, walk into the bank with a one-page card — no login, no data leaving your browser.

---

## 0:00–1:00 The Idea

**Problem:** A bank tells you the maximum it *can* lend. Nothing tells you what remains *comfortable* after EMIs, rent, school fees and a safety cushion for the unexpected.

**Solution:** Borrower Copilot shows two numbers side-by-side — **Possible lender sanction** (FOIR-style, lender view) vs **Safer borrowing range** (cash-flow, your view) — plus fair rate band, EMI ceiling comparison with a **What-if slider**, interactive **Stress Lab**, a **Waterfall** of your cash flow, and a shareable **Negotiation Card**. Headlines are rounded ranges; details expand to precise math. Unknown answers widen the range and lower confidence, never a silent zero.

---

## 1:00–3:30 One Borrower End-to-End (Priya, 29)

1. **Open → Check my loan**
   `npm run dev` → `http://localhost:5173` → **Check my loan**
2. **Answer as Priya** (9 core + salaried extras):
   - *What are you planning to use the money for?* → **Planned personal / family expense**
   - *How much?* → **₹8,00,000** (tap chip `₹8L` or type from ₹0)
   - *Loan type* → **Personal**
   - *How do you earn?* → **Salaried** → *Years worked 5* → *Variable pay skip*
   - *Monthly income* → **₹1,10,000**
   - *Existing EMI* → **₹14,000** → *Largest EMI ends?* → **More than 2 years**
   - *Essential expenses* → **₹40,000**
   - *Age* → **29** (stepper, no free typing)
   - *Credit score known?* → **Yes → 780** (stepper, 300–900, Unknown stays widest band)
   - *Savings buffer* → **Not sure**
3. **Review → Edit live**
   *Review your answers* is grouped: *The essentials / About your salary*. Tap any row → jump back to that question → change it → forward again. Draft persists in `localStorage` + shareable `#s=...` hash link (clear via *Start over*).
4. **Results — what to point at:**
   - **O1 Should you borrow?** — **Borrow** · ₹20,891/mo needs vs ₹36,000/mo safe ceiling — thin-icon badge, not emoji
   - **O2 How much?** — **Possible sanction ₹13–18L** vs **Safer range ₹12–16L** — *use this* → expand **Show exact numbers** → dual bars animate
   - **O3 What's a fair rate?** — **10.8–12.3%** · **Approx. all-in ~14.6%** (`Estimate — actual fees vary`) + range track (your fair slice in green)
   - **O4 What EMI should you agree to?** — **Requested ~₹20,891** vs **Max safe ~₹36,000** (sticky header) → drag **Try a smaller amount** slider `₹5L→₹10L` → see `Fits / Above ceiling` live
   - **Waterfall** — stacked bar `Income ₹1.1L → EMI ₹14k → Expenses ₹40k → Buffer 10% → FCF ₹45k → Safe ₹36k ×0.8` under *Every number, traced*
   - **Stress Lab** — drag **Income 0→−30% / Rate +0→+3pp** → watch `Pass / Tight / Fail` flip live (same engine, your what-if)
   - **After relief** — hidden for Priya (single long EMI) — but show **12-dot strip** demo with a split-EMI example: `●●●●●●○○○○○○ ₹33k now → ₹20k after 6m`
   - **Confidence Medium** — only buffer unknown; waterfall shows documented income → narrow range earned
5. **Negotiation Card** → **Copy card** (toast) / **Save as Image** (canvas, no lib) / **Print / Save** + **Copy share link**. Card shows: Requested + Possible/Safer ranges + Fair rate + Approx. all-in + Requested vs Max EMI + Why + *Could you offer ≤12.3% at ~1% fee? My fair range is 10.8–12.3%.* + rehearsal *If they say 14%, reply: My max comfortable EMI is ₹36,000/mo.*

Quick presets: Home → **Run Priya's / Ravi's / Anita's case →** jumps straight to Review with prefilled data (now includes horizon).

---

## 3:30–4:30 Why the Other Two Matter

  - **Ravi, 42 — Mysuru, self-employed, ₹45L property** — Asks *Start or grow my income* ₹15L. ITR-only math would say ~₹5L. Because collateral is free, the app routes to **Secured / Business lane** (FOIR 55% + 50% LTV) → **Possible ₹17–23L but Safer ₹12–17L** → **Borrow Less**. Drag his **What-if slider to ₹13L → ₹23k fits**.
  - **Stress Lab:** drag **Income −20% → Tight** is the honest signal. This proves lane routing works. His **EMI horizon** is `>2 years` so no short relief strip — correct.

- **Anita, 35 — Hubballi, gig ₹26–30k variable, sole earner, 3 app loans, bounce, horizon Not sure** — Asks *Income-generating asset* ₹1.5L. Cash-flow `FCF −₹1,120 → Safe EMI 0`. → **Don't Borrow** with `Recent bounce increases risk` warning + consolidation note *Clear ₹35k high-rate loans first* + **Save & Compare** shows `Saved ₹8L vs Current ₹1.5L`. **Multiple EMIs:** if she had broken down `₹10k/6–12m + ₹3k/<6m`, the card would show **After relief +₹13k/mo** and the **12-dot strip** — but verdict stays on today, display-only headroom. Proves `Don't Borrow` is reachable and not branding the borrower, and tenure awareness works.

---

## 4:30–5:00 What Next / What Was Cut

**Built & verified (44 tests `npm test`, lane-aware grids, age cap to 60, horizon + 3-EMI breakdown, waterfall, stress lab, image card, hash-share):**
- Rounded headlines + `Show exact numbers` + Waterfall + 12-dot strip
- What-if amount slider + Interactive Stress Lab (sliders)

**Build next:** Saved scenario compare view — data already in `localStorage bc_saved`.

**Intentionally cut — per spec CUT list:** Login/accounts, backend/DB, ML credit scoring, bureau pull, home-loan multi-decade math, negotiation chatbot, PDF library, loan-ROI calculator.

**Live-change defense:** Every threshold they can ask to change live is a pure function in `RULES.md` + `src/rules/` — e.g. FOIR caps `src/data/rateBands.js:25`, buffers `src/rules/cashFlow.js:91`, horizon mapping `src/rules/cashFlow.js:80`, widening `src/rules/confidence.js:52`. Change a number → `npm test` stays green in <1s.

---

### Checklist Before You Demo

- `npm run dev` → `Questions /12` progress, Q1 helper announced, `Not sure? We widen…` in aside
- `npm run test` → 44 tests pass
- Priya → **Borrow** · O2 dual bars animate · O3 band · O4 slider drags · Stress Lab sliders flip · Card `Copy / Save as Image`
- Ravi → **Borrow Less** + secured badge + `Tight` on drag −20%
- Anita → **Don't Borrow** + bounce warning + pause plan + dot strip when breakdown provided
- Refresh → draft restored via `localStorage`; open `#s=...` link on another phone → same answers; *Start over* → cleared; Copy link → toast
