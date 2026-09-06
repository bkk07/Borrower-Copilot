// Polished single-question renderer. Presentational only (helpers live in data/questions.js).
import { setField } from "../data/questions.js";

// One-line helper text per option — the "unique" product feel: every choice explains itself.
const OPTION_SUB = {
  wedding: "Family event — judged on affordability, not the occasion",
  medical: "Emergency — we stay neutral, never judgemental",
  education: "Long-horizon need — tenure matters more here",
  business_stock: "Productive use — noted qualitatively, never inflated into maths",
  vehicle: "Includes two-wheelers & e-scooters",
  debt_payoff: "We check whether new debt truly beats old debt",
  other: "Anything else — the same cash-flow rules apply",
  personal: "No collateral · FOIR-based · 1–5 yrs",
  business_secured: "Against property · LAP-style · longer tenure",
  informal_small_ticket: "Small ticket / vehicle / gold-type · conservative limits",
  unsure: "We'll guess your lane from income — flagged as a guess",
  salaried: "Fixed salary — the simplest, most verifiable case",
  self_employed: "Business + cash income — we count cash at 50%",
  informal: "Gig / cash work — income gets a stability discount",
  steady: "Roughly the same every month",
  variable: "Swings a lot — we apply a 15% safety discount",
  unknown: "We'll use a mid-level estimate and widen your ranges",
  0: "No buffer — stress test will be strict",
  "<1": "Less than a month of expenses",
  "1-3": "A small cushion",
  "3-6": "Comfortable cushion",
  "6+": "Strong cushion",
};

function OptButton({ label, sub, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`bc-opt${active ? " active" : ""}`}>
      <span className="bc-opt-tick">{active ? "✓" : ""}</span>
      <span>
        <span className="block font-semibold leading-snug">{label}</span>
        {sub && <span className="bc-opt-sub block">{sub}</span>}
      </span>
    </button>
  );
}

function ChoiceList({ options, value, onChange }) {
  return (
    <div className="grid gap-2.5">
      {options.map((o) => (
        <OptButton
          key={o.value}
          label={o.label}
          sub={OPTION_SUB[o.value]}
          active={String(value) === String(o.value)}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

function YesNo({ value, onChange, includeUnknown = true }) {
  const opts = [
    { v: "yes", label: "Yes" },
    { v: "no", label: "No" },
  ];
  if (includeUnknown) opts.push({ v: "", label: "Not sure" });
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {opts.map((o) => {
        const active = String(value ?? "") === o.v;
        return (
          <button key={o.label} type="button" onClick={() => onChange(o.v)} className={`bc-opt${active ? " active" : ""} flex-col !gap-1 !p-4 text-center`}>
            <span className="bc-opt-tick mx-auto">{active ? "✓" : ""}</span>
            <span className="font-semibold">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#b97f1f]">₹</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={value ?? ""}
        placeholder={placeholder ?? "50,000"}
        onChange={(e) => onChange(e.target.value)}
        className="bc-input !pl-10"
      />
    </div>
  );
}

function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-dashed border-[#c9b995] bg-[#faf5ea] p-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0b3b2c]" />
      <span className="leading-snug text-[#4a4238]">{children}</span>
    </label>
  );
}

export default function QuestionInput({ q, draft, setDraft }) {
  const set = (k, v) => setField(setDraft, k, v);
  switch (q.id) {
    case "loanPurpose":
    case "loanType":
    case "incomeType":
    case "savingsBufferMonths":
    case "incomeStability":
      return <ChoiceList options={q.options} value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
    case "requestedAmount":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.requestedAmount} onChange={(v) => set("requestedAmount", v)} placeholder="8,00,000" />
          <p className="text-sm text-[#6f6355]">The starting point for every output — be honest, there's no penalty for a big number.</p>
        </div>
      );
    case "income":
      return (
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Monthly income (take-home)</label>
            <MoneyInput value={draft.income} onChange={(v) => set("income", v)} placeholder="1,10,000" />
          </div>
          {draft.incomeType !== "salaried" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">Range max <span className="font-normal text-[#6f6355]">(for variable income — optional)</span></label>
              <MoneyInput value={draft.incomeMax} onChange={(v) => set("incomeMax", v)} placeholder="80,000" />
            </div>
          )}
        </div>
      );
    case "existingEmi":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.existingEmi} onChange={(v) => { set("existingEmi", v); set("existingEmiUnknown", false); }} placeholder="0 if none" />
          <CheckRow checked={!!draft.existingEmiUnknown} onChange={(c) => set("existingEmiUnknown", c)}>
            I do pay EMIs but don't know the total — <b>estimate it for me</b> (kept as "unknown", never zero).
          </CheckRow>
        </div>
      );
    case "householdExpenses":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.householdExpenses} onChange={(v) => { set("householdExpenses", v); set("expensesUnknown", false); }} placeholder="40,000" />
          <CheckRow checked={!!draft.expensesUnknown} onChange={(c) => set("expensesUnknown", c)}>
            I don't know exactly — <b>estimate from my income type</b> (labelled as an assumption, widens ranges).
          </CheckRow>
        </div>
      );
    case "creditScoreKnown":
      return <YesNo value={draft.creditScoreKnown} onChange={(v) => set("creditScoreKnown", v)} includeUnknown={false} />;
    case "creditScore":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.creditScore} onChange={(v) => set("creditScore", v)} placeholder="780" />
          <p className="text-sm text-[#6f6355]">300–900. "Don't know" stays <b>unknown</b> — never treated as a bad score.</p>
        </div>
      );
    case "collateralAvailable":
    case "collateralEncumbered":
    case "recentBounce":
    case "soleEarner":
      return <YesNo value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
    case "collateralValue":
      return <MoneyInput value={draft.collateralValue} onChange={(v) => set("collateralValue", v)} placeholder="45,00,000" />;
    case "cashIncomeRange":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Min / month</label>
            <MoneyInput value={draft.cashMin} onChange={(v) => set("cashMin", v)} placeholder="40,000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Max / month</label>
            <MoneyInput value={draft.cashMax} onChange={(v) => set("cashMax", v)} placeholder="80,000" />
          </div>
        </div>
      );
    default:
      return (
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={draft[q.id] ?? ""}
          placeholder="Optional — leave blank to skip"
          onChange={(e) => set(q.id, e.target.value)}
          className="bc-input"
        />
      );
  }
}
