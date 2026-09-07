// Polished single-question renderer. Presentational only (helpers live in data/questions.js).
import { setField } from "../data/questions.js";

// One-line helper text per option — only where it earns its place.
// Q1 (loan purpose) intentionally has no per-option sub-text per UX spec.
const OPTION_SUB = {
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

const LIMITS = {
  requestedAmount: { min: 10000, max: 5000000 },
  age: { min: 18, max: 65 },
  creditScore: { min: 300, max: 900 },
  collateralValue: { min: 100000, max: 20000000 },
  income: { min: 5000, max: 5000000 },
  incomeMax: { min: 5000, max: 5000000 },
  cashMin: { min: 0, max: 5000000 },
  cashMax: { min: 0, max: 5000000 },
  existingEmi: { min: 0, max: 2000000 },
  householdExpenses: { min: 0, max: 2000000 },
  upcomingExpense: { min: 0, max: 5000000 },
  employmentYears: { min: 0, max: 50 },
  businessYears: { min: 0, max: 60 },
  itrAnnualIncome: { min: 0, max: 100000000 },
  existingLoanCount: { min: 0, max: 50 },
  variableIncomePct: { min: 0, max: 100 },
  default: { min: 0, max: 100000000 },
};

function clampNum(qId, raw) {
  if (raw === "" || raw == null) return raw;
  const spec = LIMITS[qId] ?? LIMITS.default;
  const n = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n)) return raw;
  if (n < spec.min) return String(spec.min);
  if (n > spec.max) return String(spec.max);
  return String(n);
}

function clampMsg(qId, raw) {
  const spec = LIMITS[qId] ?? LIMITS.default;
  if (raw === "" || raw == null) return null;
  const n = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n)) return "Enter a valid number.";
  if (spec.min != null && n < spec.min) return `Minimum is ${spec.min.toLocaleString("en-IN")}.`;
  if (spec.max != null && n > spec.max) return `Maximum is ${spec.max.toLocaleString("en-IN")}.`;
  if (qId === "creditScore" && (n < 300 || n > 900)) return "Credit scores range from 300 to 900.";
  if (qId === "age" && (n < 18 || n > 65)) return "Age must be between 18 and 65.";
  return null;
}

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

function MoneyInput({ value, onChange, placeholder, qId }) {
  const msg = qId ? clampMsg(qId, value) : null;
  const hint = (() => {
    if (!value) return null;
    const n = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    try {
      return new Intl.NumberFormat("en-IN").format(n);
    } catch {
      return null;
    }
  })();
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#b97f1f]">₹</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value ?? ""}
          placeholder={placeholder ?? "50,000"}
          onChange={(e) => onChange(clampNum(qId ?? "default", e.target.value))}
          className="bc-input !pl-10 !pr-24"
          aria-invalid={msg ? "true" : "false"}
        />
        {hint ? <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-sm font-semibold text-[#6f6355] sm:block">{hint}</span> : null}
      </div>
      {msg ? <p className="mt-1 text-xs font-medium text-[#a4261f]">{msg}</p> : null}
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

function PlainNumber({ qId, value, onChange }) {
  const msg = clampMsg(qId, value);
  const hint = (() => {
    if (!value) return null;
    const n = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    try {
      return new Intl.NumberFormat("en-IN").format(n);
    } catch {
      return null;
    }
  })();
  return (
    <div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value ?? ""}
          placeholder="Optional — leave blank to skip"
          onChange={(e) => onChange(clampNum(qId, e.target.value))}
          className="bc-input !pr-24"
          aria-invalid={msg ? "true" : "false"}
        />
        {hint ? <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-sm font-semibold text-[#6f6355] sm:block">{hint}</span> : null}
      </div>
      {msg ? <p className="mt-1 text-xs font-medium text-[#a4261f]">{msg}</p> : null}
    </div>
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
          <MoneyInput value={draft.requestedAmount} onChange={(v) => set("requestedAmount", v)} placeholder="8,00,000" qId="requestedAmount" />
          <p className="text-sm text-[#6f6355]">The starting point for every output — be honest, there's no penalty for a big number.</p>
        </div>
      );
    case "income":
      return (
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Monthly income (take-home)</label>
            <MoneyInput value={draft.income} onChange={(v) => set("income", v)} placeholder="1,10,000" qId="income" />
          </div>
          {draft.incomeType !== "salaried" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">Range max <span className="font-normal text-[#6f6355]">(for variable income — optional)</span></label>
              <MoneyInput value={draft.incomeMax} onChange={(v) => set("incomeMax", v)} placeholder="80,000" qId="incomeMax" />
            </div>
          )}
        </div>
      );
    case "existingEmi":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.existingEmi} onChange={(v) => { set("existingEmi", v); set("existingEmiUnknown", false); }} placeholder="0 if none" qId="existingEmi" />
          <CheckRow checked={!!draft.existingEmiUnknown} onChange={(c) => set("existingEmiUnknown", c)}>
            I do pay EMIs but don't know the total — <b>estimate it for me</b> (kept as "unknown", never zero).
          </CheckRow>
        </div>
      );
    case "householdExpenses":
      return (
        <div className="grid gap-3">
          <MoneyInput value={draft.householdExpenses} onChange={(v) => { set("householdExpenses", v); set("expensesUnknown", false); }} placeholder="40,000" qId="householdExpenses" />
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
          <MoneyInput value={draft.creditScore} onChange={(v) => set("creditScore", v)} placeholder="780" qId="creditScore" />
          <p className="text-sm text-[#6f6355]">300–900. "Don't know" stays <b>unknown</b> — never treated as a bad score.</p>
        </div>
      );
    case "collateralAvailable":
    case "collateralEncumbered":
    case "recentBounce":
    case "soleEarner":
      return <YesNo value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
    case "collateralValue":
      return <MoneyInput value={draft.collateralValue} onChange={(v) => set("collateralValue", v)} placeholder="45,00,000" qId="collateralValue" />;
    case "cashIncomeRange":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Min / month</label>
            <MoneyInput value={draft.cashMin} onChange={(v) => set("cashMin", v)} placeholder="40,000" qId="cashMin" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Max / month</label>
            <MoneyInput value={draft.cashMax} onChange={(v) => set("cashMax", v)} placeholder="80,000" qId="cashMax" />
          </div>
        </div>
      );
    case "upcomingExpense":
      return (
        <div className="grid gap-2">
          <MoneyInput value={draft.upcomingExpense} onChange={(v) => set("upcomingExpense", v)} placeholder="e.g. 60,000" qId="upcomingExpense" />
          <p className="text-sm text-[#6f6355]">If you know a big payment is coming, we spread it over 6 months and raise the buffer — this one question can move your safe EMI.</p>
        </div>
      );
    case "age":
      return <PlainNumber qId="age" value={draft.age} onChange={(v) => set("age", v)} />;
    case "employmentYears":
      return <PlainNumber qId="employmentYears" value={draft.employmentYears} onChange={(v) => set("employmentYears", v)} />;
    case "businessYears":
      return <PlainNumber qId="businessYears" value={draft.businessYears} onChange={(v) => set("businessYears", v)} />;
    case "itrAnnualIncome":
      return <PlainNumber qId="itrAnnualIncome" value={draft.itrAnnualIncome} onChange={(v) => set("itrAnnualIncome", v)} />;
    case "variableIncomePct":
      return <PlainNumber qId="variableIncomePct" value={draft.variableIncomePct} onChange={(v) => set("variableIncomePct", v)} />;
    case "existingLoanCount":
      return <PlainNumber qId="existingLoanCount" value={draft.existingLoanCount} onChange={(v) => set("existingLoanCount", v)} />;
    case "existingLenderOfferRate":
      return <PlainNumber qId="default" value={draft.existingLenderOfferRate} onChange={(v) => set("existingLenderOfferRate", v)} />;
    case "existingLenderOfferFee":
      return <PlainNumber qId="default" value={draft.existingLenderOfferFee} onChange={(v) => set("existingLenderOfferFee", v)} />;
    case "existingLenderOfferTenure":
      return <PlainNumber qId="default" value={draft.existingLenderOfferTenure} onChange={(v) => set("existingLenderOfferTenure", v)} />;
    default:
      return <PlainNumber qId={q.id} value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
  }
}
