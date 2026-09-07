// Verdict engine: combines everything into O1–O4 (Final Spec §7 + §10–§12).
import { LANE_DEFAULTS } from "../data/rateBands.js";
import { resolveLane } from "../data/questions.js";
import { cashFlow } from "./cashFlow.js";
import { sanctionCalc } from "./sanction.js";
import { rateBand, narrowedBand, bandMid, aprBreakdown } from "./rate.js";
import { confidenceScore, widenAmount, widenEmi } from "./confidence.js";
import { stressTest } from "./stressTest.js";
import { emiForPrincipal, principalForEmi, totalInterest } from "./finance.js";

const PURPOSE_LABEL = {
  essential: "essential expense",
  planned_personal: "planned personal / family expense",
  home_improvement: "home improvement",
  major_purchase: "major purchase",
  income_growth: "starting or growing your income",
  debt_payoff: "paying off existing debt",
  education: "education or career",
  productive_asset: "income-generating asset",
  other: "your stated purpose",
};

// Financial-nature classification. Used only for tone / explanations;
// affordability and cash flow remain the decision drivers.
const PURPOSE_CLASS = {
  essential: "essential",
  planned_personal: "discretionary_personal",
  home_improvement: "home",
  major_purchase: "discretionary_purchase",
  income_growth: "productive",
  debt_payoff: "debt_repayment",
  education: "education",
  productive_asset: "productive_asset",
  other: "other",
};

export function evaluate(profile) {
  const routing = resolveLane(profile);
  const lane = routing.lane;
  const def = LANE_DEFAULTS[lane];

  const cf = cashFlow(profile);
  const san = sanctionCalc(profile, lane, cf);
  const rb = rateBand(profile, lane);
  const conf = confidenceScore(profile, lane);
  const fairRange = narrowedBand(rb.band, conf.level);
  const fairMid = bandMid(fairRange);

  // Safe amount from safe EMI at fair-mid rate + sensible tenure.
  const safeTenure = Math.min(def.safeTenureMonths, maxTenureForAge(profile.age, def));
  const safeCenter = Math.round(principalForEmi(cf.safeEmi, fairMid, safeTenure));
  const safeRange = widenAmount(safeCenter, conf.level);
  const sanctionRange = widenAmount(san.amount, conf.level);

  // EMI needed for the requested amount (same fair-mid + safe tenure).
  const emiNeeded = Math.round(emiForPrincipal(profile.requestedAmount, fairMid, safeTenure));
  const emiCeilingRange = widenEmi(cf.safeEmi, conf.level);

  // ---- O1 verdict ----
  const verdict = decideVerdict(profile, cf, emiNeeded);

  // ---- APR / all-in cost (split so the UI can show fee drag) ----
  const feePct = profile.existingLenderOffer?.fee ?? def.processingFeePct;
  const aprParts = aprBreakdown(fairMid, feePct, safeTenure);
  const apr = aprParts.apr;

  // ---- Tenure trade-off at SAFE amount (lane-aware grid) ----
  const tenures = (def.tenureGrid ?? [24, 36, 48, 60]).filter((m) => m <= def.maxTenureMonths);
  const tenureTable = tenures.map((m) => {
    const emi = Math.round(emiForPrincipal(safeCenter, fairMid, m));
    return { months: m, years: m / 12, emi, totalInterest: totalInterest(safeCenter, emi, m) };
  });

  // ---- Stress ----
  const stress = stressTest({
    safeAmount: safeCenter,
    fairMid,
    safeTenureMonths: safeTenure,
    safeEmi: cf.safeEmi,
    fcf: cf.fcf,
    blendedIncome: cf.blendedIncome,
    emiNeeded,
  });

  // ---- Lender-offer comparison (SHOULD feature) ----
  let lenderComparison = null;
  if (profile.existingLenderOffer?.rate != null) {
    const q = Number(profile.existingLenderOffer.rate);
    const [lo, hi] = fairRange;
    lenderComparison = {
      quoted: q,
      verdict: q < lo ? "below" : q > hi ? "above" : "within",
      text:
        q > hi
          ? `Your lender offered ${q}% — that's above the fair range of ${lo}–${hi}%. Push back or walk away.`
          : q < lo
            ? `Your lender offered ${q}% — that's below the fair range of ${lo}–${hi}%. Read the fees carefully; the rate looks good.`
            : `Your lender offered ${q}% — that's within the fair range of ${lo}–${hi}%. Negotiate fees next.`,
    };
  }

  // ---- Debt-consolidation note (SHOULD feature) ----
  let consolidationNote = null;
  const emiVal = cf.existingEmi.value;
  if ((profile.existingLoanCount != null && profile.existingLoanCount >= 2) || (emiVal > 0 && cf.blendedIncome > 0 && emiVal / cf.blendedIncome > 0.2)) {
    consolidationNote =
      "You already carry expensive debt. Clearing or consolidating the old high-rate loans first would free more cash each month than any new loan can — consider that before borrowing more.";
  }

  // ---- Debt-payoff purpose: compare old burden vs new EMI ----
  // Someone borrowing to kill existing debt should see whether the swap wins.
  let debtPayoffNote = null;
  if (profile.loanPurpose === "debt_payoff" && emiVal > 0) {
    const net = emiNeeded - emiVal;
    debtPayoffNote =
      net < 0
        ? `Swapping your current ${fmt(emiVal)}/month for this loan's ~${fmt(emiNeeded)}/month would save about ${fmt(-net)} every month — consolidation can work here, but only if you close the old loans, not add to them.`
        : `This loan would cost ~${fmt(emiNeeded)}/month versus the ${fmt(emiVal)}/month you pay now — that's ${fmt(net)} more each month, so it only makes sense if it wipes out a much higher-rate balance. Don't borrow to add debt on top of debt.`;
  }

  return {
    lane,
    laneLabel: def.label,
    routing,
    cf,
    sanction: { ...san, range: sanctionRange },
    rate: { fullBand: rb.band, bucket: rb.bucket, fairRange, fairMid: Math.round(fairMid * 10) / 10, apr, feeDrag: aprParts.feeDrag, nominal: aprParts.nominal, feePct },
    confidence: conf,
    safe: { center: safeCenter, range: safeRange, tenureMonths: safeTenure },
    emiNeeded,
    emiCeiling: cf.safeEmi,
    emiCeilingRange,
    verdict,
    tenureTable,
    stress,
    lenderComparison,
    consolidationNote,
    debtPayoffNote,
    explanations: buildExplanations(profile, cf, san, fairRange, rb.bucket, conf, verdict, emiNeeded, safeCenter),
    card: buildCard(profile, lane, def, san, sanctionRange, safeRange, fairRange, apr, cf, conf, verdict, lenderComparison),
  };
}

function maxTenureForAge(age, def) {
  const a = Number(age);
  if (!Number.isFinite(a)) return def.safeTenureMonths;
  const yearsTo60 = 60 - a;
  if (yearsTo60 <= 0) return 12;
  return Math.min(def.safeTenureMonths, yearsTo60 * 12);
}

function decideVerdict(profile, cf, emiNeeded) {
  const purpose = PURPOSE_LABEL[profile.loanPurpose] ?? "your stated purpose";
  if ((profile.requestedAmount ?? 0) <= 0 || cf.blendedIncome <= 0) {
    return {
      key: "dont",
      label: "🛑 Don't Borrow",
      reason: "There is no verifiable monthly income to support any EMI right now.",
      tone: emergencyNeutral(profile)
        ? "This is not a judgement on your need — the numbers simply show no room for repayments today."
        : `For ${purpose}, the numbers show no room for repayments today.`,
    };
  }
  if (cf.fcf <= 0) {
    return {
      key: "dont",
      label: "🛑 Don't Borrow",
      reason: `After expenses (${fmt(cf.expenses.value)}), existing loans (${fmt(cf.existingEmi.value)}) and a safety buffer, nothing is left each month.`,
      tone: emergencyNeutral(profile)
        ? "An emergency loan is understandable — but a new EMI right now risks another missed payment."
        : "Borrowing now would very likely lead to another missed payment.",
    };
  }
  // Warning override: recent bounce + expensive existing debt.
  if (profile.recentBounce === true) {
    return {
      key: "dont",
      label: "🛑 Don't Borrow (right now)",
      reason: "A repayment bounced recently and existing debt is costly — new debt makes a spiral worse.",
      tone: "Fix the existing repayments first; a new loan today would very likely bounce too.",
    };
  }
  if (cf.safeEmi < emiNeeded) {
    return {
      key: "less",
      label: "⚠️ Borrow Less",
      reason: `You can afford something — just not the full ${fmt(profile.requestedAmount)}. Your safe EMI (${fmt(cf.safeEmi)}) is below the ${fmt(emiNeeded)}/month the full amount needs.`,
      tone: `Consider borrowing closer to your safe amount instead of the full ask.`,
    };
  }
  return {
    key: "borrow",
    label: "✅ Borrow",
    reason: `The requested ${fmt(profile.requestedAmount)} needs about ${fmt(emiNeeded)}/month — inside your safe EMI of ${fmt(cf.safeEmi)}/month with margin.`,
    tone: emergencyNeutral(profile)
      ? "The loan fits your cash flow with room to spare."
      : `For ${purpose}, the loan fits your cash flow with room to spare.`,
  };
}

function emergencyNeutral(profile) {
  // Essential and education are treated neutrally — never penalised for being discretionary.
  return profile.loanPurpose === "essential" || profile.loanPurpose === "education";
}

function purposeClass(purpose) {
  return PURPOSE_CLASS[purpose] ?? "other";
}

function fmt(n) {
  return "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
}

function buildExplanations(profile, cf, san, fairRange, bucket, conf, verdict, emiNeeded, safeCenter) {
  const creditTxt =
    bucket === "good"
      ? `your credit score (${profile.creditScore}) is strong`
      : bucket === "weak"
        ? `your credit score (${profile.creditScore}) is weak`
        : "your credit history is unknown, so the band stays wide";
  return {
    safeEmi: `Your safe EMI is ${fmt(cf.safeEmi)} because after expenses (${fmt(cf.expenses.value)}) and existing loans (${fmt(cf.existingEmi.value)}), you have about ${fmt(cf.fcf)} left each month — and we keep 20% of that as a safety cushion.`,
    safeAmount: `Your safe borrowing amount is ${fmt(safeCenter)} because that's what a ${fmt(cf.safeEmi)} EMI can cover at a fair rate over ${san.tenureMonths ? "" : ""}a reasonable tenure.`,
    fairRate: `Your fair rate is ${fairRange[0]}–${fairRange[1]}% because ${creditTxt} and this is a ${san ? "" : ""}${laneNoun(profile)} loan.`,
    confidence: `Your confidence is ${conf.level} because ${conf.reasons[0] ?? "the answers were mostly complete and documented"}.`,
    sanctionGap: `A bank might sanction ${fmt(san.amount)} because banks look mainly at whether you can pay each month (FOIR ${Math.round(san.foirCap * 100)}% of verifiable income) — not at how comfortable that leaves you.`,
    verdict: verdict.reason,
    emiNeeded: `The ${fmt(profile.requestedAmount)} you asked for needs ~${fmt(emiNeeded)}/month at a fair rate — compare that with your ${fmt(cf.safeEmi)} safe ceiling.`,
  };
}

function laneNoun(profile) {
  if (profile.loanType === "business_secured") return "secured/business";
  if (profile.loanType === "informal_small_ticket") return "small-ticket";
  return "personal";
}

function buildCard(profile, lane, def, san, sanctionRange, safeRange, fairRange, apr, cf, conf, verdict, lenderComparison) {
  const incomeTxt = Array.isArray(profile.income?.amount)
    ? `${fmt(profile.income.amount[0])}–${fmt(profile.income.amount[1])}`
    : fmt(cf.blendedIncome);
  const lines = [
    "BORROWER NEGOTIATION CARD",
    "────────────────────────",
    `Profile: ${profile.incomeType.replace("_", " ")} · ${incomeTxt}/month · Credit: ${profile.creditScoreKnown ? profile.creditScore : "unknown"}`,
    `Loan requested: ${fmt(profile.requestedAmount)} for ${PURPOSE_LABEL[profile.loanPurpose] ?? "your purpose"}`,
    `Likely bank offer: ${fmt(sanctionRange[0])}–${fmt(sanctionRange[1])}`,
    `Safe amount for you: ${fmt(safeRange[0])}–${fmt(safeRange[1])}`,
    `Fair interest rate: ${fairRange[0]}–${fairRange[1]}%`,
    `Real cost with fees: ~${apr}%`,
    `Max EMI you should agree to: ${fmt(cf.safeEmi)}/month`,
    `Why: ${verdict.reason}`,
    `Confidence: ${conf.level}`,
  ];
  if (lenderComparison) lines.push(lenderComparison.text);
  return lines.join("\n");
}

export { PURPOSE_LABEL, PURPOSE_CLASS, purposeClass };
