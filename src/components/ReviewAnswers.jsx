import { QUESTIONS } from "../data/questions.js";

const GROUP_TITLES = {
  must: "The essentials",
  salaried: "About your salary",
  self_employed: "About your business",
  informal: "About your gig work",
  optional: "Lender offers (optional)",
};

function answerLabel(q, draft) {
  const v = draft[q.id];
  const opt = q.options?.find((o) => String(o.value) === String(v));
  if (opt) return opt.label;
  switch (q.id) {
    case "income":
      return draft.incomeMax ? `₹${Number(draft.income).toLocaleString("en-IN")}–₹${Number(draft.incomeMax).toLocaleString("en-IN")}` : v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
    case "existingEmi":
      if (draft.existingEmiUnknown) return "Has EMI — amount unknown (estimated)";
      return v === "0" || v === 0 ? "None" : v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
    case "householdExpenses":
      if (draft.expensesUnknown) return "Unknown — will be estimated";
      return v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
    case "cashIncomeRange":
      return draft.cashMin || draft.cashMax
        ? `₹${Number(draft.cashMin || 0).toLocaleString("en-IN")}–₹${Number(draft.cashMax || 0).toLocaleString("en-IN")}`
        : "—";
    case "creditScoreKnown":
    case "collateralAvailable":
    case "collateralEncumbered":
    case "recentBounce":
    case "soleEarner":
      if (v === "yes") return "Yes";
      if (v === "no") return "No";
      return "Skipped";
    case "requestedAmount":
    case "collateralValue":
    case "itrAnnualIncome":
      return v ? `₹${Number(v).toLocaleString("en-IN")}` : "Skipped";
    case "variableIncomePct":
      return v ? `${v}%` : "Skipped";
    default:
      return v === "" || v == null ? "Skipped" : String(v);
  }
}

export default function ReviewAnswers({ draft, onEdit, onBack, onSubmit }) {
  const relevant = QUESTIONS.filter((q) => {
    if (!q.showIf) return true;
    try { return q.showIf(draft); } catch { return true; }
  }).filter((q) => {
    if (q.group === "optional" && !draft[q.id]) return false;
    return true;
  });

  const groups = [];
  for (const q of relevant) {
    const g = q.group || "must";
    if (!groups.length || groups[groups.length - 1].key !== g) groups.push({ key: g, items: [] });
    groups[groups.length - 1].items.push(q);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="bc-eyebrow">Step 2 of 2 · Review</p>
      <h2 className="font-display mt-1 text-3xl font-semibold">Is this you?</h2>
      <p className="mt-1 text-[15px] text-[#6f6355]">Tap any row to fix it. Nothing is saved anywhere — this lives only in your browser.</p>

      {groups.map((g) => (
        <div key={g.key} className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#6f6355]">{GROUP_TITLES[g.key] ?? g.key}</p>
          <div className="bc-card divide-y divide-[#efe6d3] overflow-hidden">
            {g.items.map((q) => (
              <button key={q.id} type="button" onClick={() => onEdit(q.id)} className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-4 py-3 text-left hover:bg-[#faf5ea]">
                <span>
                  <span className="block text-[13px] text-[#6f6355]">{q.text}</span>
                  <span className="block text-[15px] font-bold">{answerLabel(q, draft)}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#0b3b2c]">Edit ›</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 flex gap-2 pb-10">
        <button type="button" onClick={onBack} className="bc-btn-ghost flex-1 !bg-white">← Back</button>
        <button type="button" onClick={onSubmit} className="bc-btn-primary flex-[2]">See my results →</button>
      </div>
    </div>
  );
}
