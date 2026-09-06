# Five-minute walkthrough

## 0:00–1:00 — The idea (60s)
Banks decide what *they'll* give you. Nobody tells you what's *safe* for you.
Borrower Copilot asks ~12 questions and gives 4 answers — borrow or not, bank sanction vs. safe amount,
fair rate + real cost, EMI ceiling — plus a one-page Negotiation Card for the bank branch.

## 1:00–3:30 — One borrower, end to end (150s)
1. Open the app → **Check my loan**.
2. Answer as **Priya**: wedding · ₹8,00,000 · personal · salaried (5 yrs) · ₹1,10,000 ·
   EMI ₹14,000 · expenses ₹40,000 · 29 · score 780 · buffer not sure.
3. **Review screen** — edit anything, see it stick.
4. **Results**: ✅ Borrow · sanction ₹13.3–17.9L vs safe ₹11.7–15.9L ·
   fair 10.8–12.3% (~14.6% with fees) · ceiling ₹36,000/mo · stress Pass · Medium confidence.
5. **Negotiation Card** → Copy / Print. Or tap a preset (Priya/Ravi/Anita) on the home screen
   to jump straight to any of the three.

## 3:30–4:30 — Why the other two matter (60s)
- **Ravi** gets routed to the *secured* lane (property-backed) — an ITR-only calculator would
  wrongly offer him ~₹5L; we show ~₹20L sanction but only ~₹14.6L safe → Borrow Less, stress "tight".
- **Anita** gets 🛑 Don't Borrow with ₹0 safe, a consolidation note, and ranges that stay wide
  at Low confidence — the "don't" outcome is real and reachable.

## 4:30–5:00 — What next / what I'd cut (30s)
**Build next:** lender-offer comparison is in; next would be saved scenarios (localStorage),
Hindi/Kannada copy, and a PDF export of the card.
**Cut:** login/accounts, backend, ML credit model, home-loan maths, negotiation chatbot,
loan-ROI calculator — all deliberately out of scope (see spec §2 CUT list).
Every threshold they'd ask me to change live sits in `RULES.md` + `src/rules/` as pure
functions — e.g. FOIR caps in `src/data/rateBands.js`, buffers in `src/rules/cashFlow.js`.
