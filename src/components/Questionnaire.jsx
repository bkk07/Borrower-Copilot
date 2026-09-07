// Polished single-question renderer. Presentational only (helpers live in data/questions.js).
import { setField } from "../data/questions.js";

// One-line helper text per option — only where it earns its place.
// Q1 (loan purpose) intentionally has no per-option sub-text per UX spec.
const OPTION_SUB = {
  personal: "No collateral · 1–5 yrs",
  business_secured: "Against property · LAP-style · longer tenure",
  informal_small_ticket: "Small ticket / informal · conservative limits",
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
  requestedAmount: { min: 0, max: 5000000 },
  age: { min: 18, max: 65 },
  creditScore: { min: 300, max: 900 },
  collateralValue: { min: 0, max: 20000000 },
  income: { min: 0, max: 5000000 },
  incomeMax: { min: 0, max: 5000000 },
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

function PlainNumber({ qId, value }) {
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
          inputMode="none"
          readOnly
          tabIndex={-1}
          value={value ?? ""}
          placeholder="Tap a value below"
          className="bc-input !pr-24 cursor-pointer bg-[#faf5ea]"
          aria-invalid={msg ? "true" : "false"}
          onFocus={(e) => e.target.blur()}
        />
        {hint ? <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-sm font-semibold text-[#6f6355] sm:block">{hint}</span> : null}
      </div>
      {msg ? <p className="mt-1 text-xs font-medium text-[#a4261f]">{msg}</p> : null}
    </div>
  );
}

function StepperPicker({ qId, value, onChange, chips, label }) {
  const spec = LIMITS[qId] ?? LIMITS.default;
  const step = qId === "creditScore" ? 10 : qId === "variableIncomePct" ? 5 : 1;
  const n = Number(String(value ?? "").replace(/,/g, ""));
  const cur = Number.isFinite(n) ? n : null;
  const dec = () => {
    if (cur == null) { onChange(String(spec.min ?? 0)); return; }
    const next = Math.max(spec.min ?? 0, cur - step);
    onChange(String(next));
  };
  const inc = () => {
    if (cur == null) { onChange(String(spec.min ?? 0)); return; }
    const next = Math.min(spec.max ?? 100, cur + step);
    onChange(String(next));
  };
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={dec} aria-label={`Decrease ${label}`} className="h-11 w-11 shrink-0 rounded-xl border border-[#e3d9c6] bg-white text-xl font-bold hover:border-[#0b3b2c]">−</button>
        <div className="bc-input flex-1 !pr-4 text-center font-bold pointer-events-none select-none" aria-live="polite">{cur == null ? "—" : cur}{qId === "variableIncomePct" ? "%" : ""}</div>
        <button type="button" onClick={inc} aria-label={`Increase ${label}`} className="h-11 w-11 shrink-0 rounded-xl border border-[#e3d9c6] bg-white text-xl font-bold hover:border-[#0b3b2c]">+</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => onChange(String(c))} className={`rounded-full border px-3 py-1 text-xs font-semibold ${String(cur) === String(c) ? "border-[#0b3b2c] bg-[#0b3b2c] text-white" : "border-[#e3d9c6] bg-white hover:border-[#0b3b2c]"}`}>{c}{qId === "age" ? " yrs" : qId === "variableIncomePct" ? "%" : ""}</button>
        ))}
        <button type="button" onClick={() => onChange("")} className="rounded-full border border-dashed border-[#c9b995] bg-[#faf5ea] px-3 py-1 text-xs font-semibold">Clear</button>
      </div>
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
          <MoneyInput value={draft.requestedAmount} onChange={(v) => set("requestedAmount", v)} placeholder="0" qId="requestedAmount" />
          <div className="no-print flex flex-wrap gap-1.5">
            {[50000, 100000, 300000, 500000, 800000, 1500000].map((a) => (
              <button key={a} type="button" onClick={() => set("requestedAmount", String(a))} className="rounded-full border border-[#e3d9c6] bg-white px-3 py-1 text-xs font-semibold hover:border-[#0b3b2c]">₹{new Intl.NumberFormat("en-IN").format(a)}</button>
            ))}
            <button type="button" onClick={() => set("requestedAmount", "0")} className="rounded-full border border-[#e3d9c6] bg-white px-3 py-1 text-xs font-semibold hover:border-[#0b3b2c]">₹0</button>
          </div>
          <p className="text-sm text-[#6f6355]">You can enter any amount from ₹0 — be honest, there's no penalty for a big number.</p>
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
          <StepperPicker qId="creditScore" value={draft.creditScore} onChange={(v) => set("creditScore", v)} label="credit score" chips={[550, 650, 700, 750, 780, 800, 850]} />
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
      return <StepperPicker qId="age" value={draft.age} onChange={(v) => set("age", v)} label="age" chips={[22, 26, 29, 35, 42, 50, 58]} />;
    case "employmentYears":
      return <StepperPicker qId="employmentYears" value={draft.employmentYears} onChange={(v) => set("employmentYears", v)} label="years worked" chips={[0, 1, 3, 5, 10, 15]} />;
    case "businessYears":
      return <StepperPicker qId="businessYears" value={draft.businessYears} onChange={(v) => set("businessYears", v)} label="business years" chips={[1, 3, 5, 10, 14, 20]} />;
    case "itrAnnualIncome":
      return <MoneyInput value={draft.itrAnnualIncome} onChange={(v) => set("itrAnnualIncome", v)} placeholder="e.g. 4,20,000 / yr" qId="itrAnnualIncome" />;
    case "variableIncomePct":
      return <StepperPicker qId="variableIncomePct" value={draft.variableIncomePct} onChange={(v) => set("variableIncomePct", v)} label="variable %" chips={[0, 10, 20, 30, 50]} />;
    case "existingEmiHorizon":
    case "emi2MonthsLeft":
    case "emi3MonthsLeft":
      return <ChoiceList options={q.options} value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
    case "existingEmiCount":
      return <ChoiceList options={q.options} value={draft.existingEmiCount} onChange={(v) => set("existingEmiCount", v)} />;
    case "emi2Amount":
      return <MoneyInput value={draft.emi2Amount} onChange={(v) => set("emi2Amount", v)} placeholder="e.g. 10,000" qId="emi2Amount" />;
    case "emi3Amount":
      return <MoneyInput value={draft.emi3Amount} onChange={(v) => set("emi3Amount", v)} placeholder="e.g. 3,000" qId="emi3Amount" />;
    case "existingLoanCount":
      return <StepperPicker qId="existingLoanCount" value={draft.existingLoanCount} onChange={(v) => set("existingLoanCount", v)} label="loan count" chips={[0, 1, 2, 3, 5]} />;
    default:
      return <PlainNumber qId={q.id} value={draft[q.id]} onChange={(v) => set(q.id, v)} />;
  }
}
