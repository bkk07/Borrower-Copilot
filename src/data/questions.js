// Question definitions + adaptive branching (Final Spec §4–§5).
// Each question: { id, group, text, kind, required, options?, branches?, affects }

export const INCOME_TYPES = [
  { value: "salaried", label: "Salaried (fixed salary)" },
  { value: "self_employed", label: "Self-employed / business" },
  { value: "informal", label: "Gig / informal / cash work" },
];

export const LOAN_TYPES = [
  { value: "personal", label: "Personal loan (unsecured)" },
  { value: "business_secured", label: "Business / secured loan (against property)" },
  { value: "informal_small_ticket", label: "Small-ticket / vehicle / gold-type loan" },
  { value: "unsure", label: "Not sure — help me choose" },
];

export const LOAN_PURPOSES = [
  { value: "wedding", label: "Wedding / family event" },
  { value: "medical", label: "Medical / emergency" },
  { value: "education", label: "Education" },
  { value: "business_stock", label: "Business stock / expansion" },
  { value: "vehicle", label: "Vehicle (incl. two-wheeler / e-scooter)" },
  { value: "debt_payoff", label: "Pay off existing debt" },
  { value: "other", label: "Other" },
];

// Ordered flow. Branch questions carry `showIf(profile)`.
export const QUESTIONS = [
  { id: "loanPurpose", group: "must", text: "What do you want the loan for?", kind: "choice", options: LOAN_PURPOSES, required: true, affects: "O1 verdict tone + explanation" },
  { id: "requestedAmount", group: "must", text: "How much do you want to borrow? (₹)", kind: "amount", required: true, affects: "All outputs" },
  { id: "loanType", group: "must", text: "What type of loan is this?", kind: "choice", options: LOAN_TYPES, required: true, affects: "O2, O3 (lane selection)" },
  { id: "incomeType", group: "must", text: "How do you earn?", kind: "choice", options: INCOME_TYPES, required: true, affects: "Which extra questions appear" },

  // --- salaried extras ---
  { id: "employmentYears", group: "salaried", text: "How many years have you worked (including this job)?", kind: "number", required: false, showIf: (p) => p.incomeType === "salaried", affects: "Confidence / stability" },
  { id: "variableIncomePct", group: "salaried", text: "Roughly what % of your income is bonus / variable (not fixed)?", kind: "percent", required: false, showIf: (p) => p.incomeType === "salaried", affects: "Safe income (variable part discounted 50%)" },

  // --- self-employed extras ---
  { id: "businessYears", group: "self_employed", text: "How many years has your business been running?", kind: "number", required: false, showIf: (p) => p.incomeType === "self_employed", affects: "Confidence + lane fit" },
  { id: "itrAnnualIncome", group: "self_employed", text: "Yearly income as per your ITR / tax filing? (₹/year, 0 if none)", kind: "amount", required: false, showIf: (p) => p.incomeType === "self_employed", affects: "Bank-sanction math (documented income)" },
  { id: "cashIncomeRange", group: "self_employed", text: "Rough monthly cash income outside the ITR? (₹/month range)", kind: "range", required: false, showIf: (p) => p.incomeType === "self_employed", affects: "Safe-amount math (discounted 50%)" },
  { id: "collateralAvailable", group: "self_employed", text: "Do you own property / an asset you could offer as security?", kind: "yesno", required: false, showIf: (p) => p.incomeType === "self_employed" || p.loanType === "business_secured", affects: "Unlocks secured lane, raises sanction ceiling" },
  { id: "collateralValue", group: "self_employed", text: "Roughly what is that asset worth? (₹)", kind: "amount", required: false, showIf: (p) => p.collateralAvailable === true || p.collateralAvailable === "yes", affects: "LTV cap (50%) on sanction" },
  { id: "collateralEncumbered", group: "self_employed", text: "Is that asset already pledged for another loan?", kind: "yesno", required: false, showIf: (p) => p.collateralAvailable === true || p.collateralAvailable === "yes", affects: "If yes, asset cannot raise sanction" },

  // --- gig/informal extras ---
  { id: "incomeStability", group: "informal", text: "Is your income steady month to month, or does it vary a lot?", kind: "choice", options: [{ value: "steady", label: "Steady" }, { value: "variable", label: "Varies a lot" }, { value: "unknown", label: "Not sure" }], required: false, showIf: (p) => p.incomeType === "informal", affects: "Safety discount on income" },
  { id: "existingLoanCount", group: "informal", text: "How many small / app loans do you currently have running?", kind: "number", required: false, showIf: (p) => p.incomeType === "informal", affects: "Debt-burden flag" },
  { id: "recentBounce", group: "informal", text: "Has any EMI / repayment bounced in the last 6 months?", kind: "yesno", required: false, showIf: (p) => p.incomeType === "informal", affects: "Don't-borrow override" },
  { id: "soleEarner", group: "informal", text: "Are you the only earner supporting your household?", kind: "yesno", required: false, showIf: (p) => p.incomeType === "informal", affects: "Raises safety buffer to 15%" },

  // --- must questions continue ---
  { id: "income", group: "must", text: "What is your monthly income? (₹ — a range is fine for gig work)", kind: "amount_or_range", required: true, affects: "All money calculations" },
  { id: "existingEmi", group: "must", text: "Do you already pay EMI each month? If yes, how much? (₹, 0 = none)", kind: "emi", required: true, affects: "O1, O2, O3, O4" },
  { id: "householdExpenses", group: "must", text: "Monthly essential expenses (rent, food, bills, school)? (₹)", kind: "amount_or_unknown", required: true, affects: "O1, O2 (safe amount), O4" },
  { id: "age", group: "must", text: "What is your age?", kind: "number", required: true, affects: "O4 (tenure options)" },
  { id: "creditScoreKnown", group: "must", text: "Do you know your credit score?", kind: "yesno", required: true, affects: "O3 + confidence" },
  { id: "creditScore", group: "must", text: "Your credit score (300–900)?", kind: "number", required: false, showIf: (p) => p.creditScoreKnown === true || p.creditScoreKnown === "yes", affects: "O3 rate band" },
  { id: "savingsBufferMonths", group: "must", text: "How many months of expenses do you have saved as backup?", kind: "choice", options: [{ value: "0", label: "None (0)" }, { value: "<1", label: "Less than 1 month" }, { value: "1-3", label: "1–3 months" }, { value: "3-6", label: "3–6 months" }, { value: "6+", label: "6+ months" }, { value: "unknown", label: "Not sure" }], required: true, affects: "O1, stress test, confidence" },

  // --- optional for anyone ---
  { id: "upcomingExpense", group: "optional", text: "Any large expense coming in the next 6 months? (₹ — school fees, medical, etc.)", kind: "amount_optional", required: false, affects: "Raises safety buffer (moves FCF / safe EMI)" },
  { id: "existingLenderOfferRate", group: "optional", text: "Has a lender offered you a rate? What %? (optional)", kind: "number_optional", required: false, affects: "Lender-offer comparison line only" },
  { id: "existingLenderOfferFee", group: "optional", text: "Processing fee they quoted? (% — optional)", kind: "number_optional", required: false, affects: "APR comparison only" },
  { id: "existingLenderOfferTenure", group: "optional", text: "Tenure they offered? (months — optional)", kind: "number_optional", required: false, affects: "APR comparison only" },
];

export function visibleQuestions(draft) {
  return QUESTIONS.filter((q) => {
    if (!q.showIf) return true;
    try {
      return q.showIf(draft);
    } catch {
      return true;
    }
  });
}

// Form helpers (kept here so component files export only components).
export function setField(setDraft, key, value) {
  setDraft((d) => ({ ...d, [key]: value }));
}

// Minimal "is this question answered" check for progress + gating.
export function isAnswered(q, draft) {
  const v = draft[q.id];
  if (q.id === "income") return draft.income !== "" && draft.income != null;
  if (q.id === "existingEmi") return draft.existingEmi !== "" || draft.existingEmiUnknown;
  if (q.id === "householdExpenses") return draft.householdExpenses !== "" || draft.expensesUnknown;
  if (q.id === "cashIncomeRange") return draft.cashMin !== "" || draft.cashMax !== "";
  if (["existingLenderOfferRate", "existingLenderOfferFee", "existingLenderOfferTenure", "upcomingExpense", "employmentYears", "variableIncomePct", "businessYears", "itrAnnualIncome", "existingLoanCount", "creditScore"].includes(q.id)) return true; // optional
  if (q.group === "optional") return true;
  return v !== "" && v != null;
}

// Lane routing (Final Spec §3 + §7-B). Returns { lane, guessed, reason }.
export function resolveLane(p) {
  const hasFreeCollateral =
    (p.collateralAvailable === true || p.collateralAvailable === "yes") &&
    (p.collateralEncumbered === false || p.collateralEncumbered === "no" || p.collateralEncumbered == null) &&
    Number(p.collateralValue) > 0;

  if (p.loanType === "business_secured" || (hasFreeCollateral && p.incomeType === "self_employed")) {
    return {
      lane: "secured_business",
      guessed: false,
      reason: "Secured / business lane: collateral is available, so sanction follows LAP-style rules.",
    };
  }
  if (p.loanType === "business_secured") {
    return { lane: "secured_business", guessed: false, reason: "You chose a secured / business loan." };
  }
  if (p.loanType === "informal_small_ticket" || p.incomeType === "informal") {
    return {
      lane: "informal_small_ticket",
      guessed: false,
      reason: "Small-ticket / informal lane: uncertain income, conservative limits.",
    };
  }
  if (p.loanType === "personal") {
    return { lane: "personal", guessed: false, reason: "Unsecured personal-loan lane (FOIR-based)." };
  }
  // loanType unsure -> guess from income type / purpose
  if (p.loanType === "unsure" || !p.loanType) {
    if (p.incomeType === "self_employed" && hasFreeCollateral)
      return { lane: "secured_business", guessed: true, reason: "Guessed secured lane from your asset + self-employment (you said 'not sure')." };
    if (p.incomeType === "informal")
      return { lane: "informal_small_ticket", guessed: true, reason: "Guessed small-ticket lane from informal income (you said 'not sure')." };
    return { lane: "personal", guessed: true, reason: "Guessed personal-loan lane (you said 'not sure'). Flagged as a guess." };
  }
  return { lane: "personal", guessed: true, reason: "Defaulted to personal-loan lane." };
}

export const blankDraft = {
  loanPurpose: "",
  requestedAmount: "",
  loanType: "",
  incomeType: "",
  employmentYears: "",
  variableIncomePct: "",
  businessYears: "",
  itrAnnualIncome: "",
  cashMin: "",
  cashMax: "",
  collateralAvailable: "",
  collateralValue: "",
  collateralEncumbered: "",
  income: "",
  incomeMax: "",
  existingEmi: "",
  existingEmiUnknown: false,
  householdExpenses: "",
  expensesUnknown: false,
  age: "",
  creditScoreKnown: "",
  creditScore: "",
  savingsBufferMonths: "",
  incomeStability: "",
  existingLoanCount: "",
  recentBounce: "",
  soleEarner: "",
  existingLenderOfferRate: "",
  existingLenderOfferFee: "",
  existingLenderOfferTenure: "",
  upcomingExpense: "",
};

// Convert flat form draft -> borrowerProfile (Final Spec §6).
export function draftToProfile(d) {
  const num = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const yn = (v) => {
    if (v === true || v === "yes") return true;
    if (v === false || v === "no") return false;
    return null;
  };

  const incomeSingle = num(d.income);
  const incomeMax = num(d.incomeMax);
  const income =
    incomeSingle != null && incomeMax != null
      ? { amount: [incomeSingle, incomeMax], documented: d.incomeType === "salaried" }
      : { amount: incomeSingle, documented: d.incomeType === "salaried" };

  let existingEmi;
  if (d.existingEmiUnknown) existingEmi = "unknown";
  else if (d.existingEmi === "" || d.existingEmi == null) existingEmi = "unknown";
  else {
    const e = num(d.existingEmi);
    existingEmi = e == null ? "unknown" : e <= 0 ? "none" : e;
  }

  return {
    loanPurpose: d.loanPurpose || "other",
    requestedAmount: num(d.requestedAmount) ?? 0,
    upcomingExpense: num(d.upcomingExpense),
    loanType:
      d.loanType === "business_secured"
        ? "business_secured"
        : d.loanType === "informal_small_ticket"
          ? "informal_small_ticket"
          : d.loanType === "personal"
            ? "personal"
            : "unsure",
    incomeType: d.incomeType || "salaried",
    income,
    employmentYears: num(d.employmentYears),
    variableIncomePct: num(d.variableIncomePct),
    businessYears: num(d.businessYears),
    itrAnnualIncome: num(d.itrAnnualIncome),
    cashIncomeRange:
      num(d.cashMin) != null || num(d.cashMax) != null
        ? [num(d.cashMin) ?? 0, num(d.cashMax) ?? num(d.cashMin) ?? 0]
        : null,
    incomeStability: d.incomeStability || null,
    existingEmi,
    existingLoanCount: num(d.existingLoanCount),
    recentBounce: d.recentBounce === "" ? null : yn(d.recentBounce),
    soleEarner: d.soleEarner === "" ? null : yn(d.soleEarner),
    householdExpenses: d.expensesUnknown ? "unknown" : (num(d.householdExpenses) ?? "unknown"),
    age: num(d.age) ?? 30,
    creditScoreKnown: yn(d.creditScoreKnown) === true,
    creditScore: yn(d.creditScoreKnown) === true ? num(d.creditScore) : null,
    savingsBufferMonths: d.savingsBufferMonths || "unknown",
    collateral: {
      available: yn(d.collateralAvailable) === true,
      value: num(d.collateralValue),
      encumbered: d.collateralEncumbered === "" ? null : yn(d.collateralEncumbered),
    },
    existingLenderOffer:
      num(d.existingLenderOfferRate) != null
        ? {
            rate: num(d.existingLenderOfferRate),
            fee: num(d.existingLenderOfferFee) ?? 0,
            tenureMonths: num(d.existingLenderOfferTenure) ?? 48,
          }
        : null,
  };
}
