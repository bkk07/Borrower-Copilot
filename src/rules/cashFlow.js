// Cash-flow engine (Final Spec §7-A/C + §9). Pure functions.
// Unknown stays "unknown" until here; fallbacks are flagged, never silent.

import { midpointOf } from "./finance.js";

// Expense fallbacks as share of effective income (judgement, RULES.md §12).
const EXPENSE_RATIO = { salaried: 0.35, self_employed: 0.4, informal: 0.6 };
const SOLE_EARNER_UPLIFT = 0.15; // informal sole earner: 60% -> 75%

// Placeholder when user HAS an EMI but doesn't know the amount (judgement).
const UNKNOWN_EMI_RATIO = 0.15;

export function documentedIncome(profile) {
  if (profile.incomeType === "salaried") {
    return midpointOf(profile.income?.amount, 0);
  }
  if (profile.incomeType === "self_employed") {
    if (profile.itrAnnualIncome != null && profile.itrAnnualIncome > 0)
      return profile.itrAnnualIncome / 12;
    return 0;
  }
  return 0; // informal: nothing a bank can verify
}

function cashMid(profile) {
  if (profile.incomeType === "self_employed" && profile.cashIncomeRange)
    return midpointOf(profile.cashIncomeRange, 0);
  return 0;
}

// Blended Income: DI + discounted undocumented cash. Used for the borrower's
// OWN safe math, never (except secured lane, documented) for bank sanction.
export function blendedIncome(profile) {
  if (profile.incomeType === "salaried") {
    const gross = midpointOf(profile.income?.amount, 0);
    const varPct = Number(profile.variableIncomePct);
    if (!Number.isFinite(varPct) || varPct <= 0 || varPct > 90) return gross;
    const fixed = gross * (1 - varPct / 100);
    const variable = gross * (varPct / 100) * 0.5; // 50% discount
    return fixed + variable;
  }
  if (profile.incomeType === "self_employed") {
    const declared = Array.isArray(profile.income?.amount)
      ? midpointOf(profile.income.amount, 0)
      : null;
    const di = documentedIncome(profile);
    const cash = cashMid(profile);
    // If no ITR at all, fall back to declared monthly figure as DI.
    const base = di > 0 ? di : (declared ?? 0);
    return base + cash * 0.5;
  }
  // informal: midpoint then stability discount
  const mid = midpointOf(profile.income?.amount, 0);
  const s = profile.incomeStability;
  if (s === "steady") return mid * 0.95;
  if (s === "variable") return mid * 0.85;
  return mid * 0.9; // unknown stability: mid-level discount + confidence drop
}

export function stabilityDiscountLabel(profile) {
  if (profile.incomeType !== "informal") return null;
  if (profile.incomeStability === "steady") return "5% stability discount (steady gig income)";
  if (profile.incomeStability === "variable") return "15% stability discount (variable gig income)";
  return "10% stability discount (stability unknown — mid-level, flagged)";
}

export function effectiveExpenses(profile, incomeBase) {
  if (profile.householdExpenses !== "unknown" && Number(profile.householdExpenses) >= 0) {
    return { value: Number(profile.householdExpenses), estimated: false, label: "you confirmed this" };
  }
  let ratio = EXPENSE_RATIO[profile.incomeType] ?? 0.4;
  if (profile.incomeType === "informal" && profile.soleEarner === true) ratio += SOLE_EARNER_UPLIFT;
  return {
    value: Math.round(incomeBase * ratio),
    estimated: true,
    label: `estimated at ${Math.round(ratio * 100)}% of income — you didn't confirm this`,
  };
}

export function effectiveEmi(profile, incomeBase) {
  if (profile.existingEmi === "none") return { value: 0, estimated: false, label: "no existing EMI" };
  if (typeof profile.existingEmi === "number")
    return { value: profile.existingEmi, estimated: false, label: "you confirmed this" };
  return {
    value: Math.round(incomeBase * UNKNOWN_EMI_RATIO),
    estimated: true,
    label: "estimated at 15% of income — you said you have an EMI but not the amount",
  };
}

export function bufferAmount(profile, incomeBase) {
  const highRisk = profile.soleEarner === true || profile.recentBounce === true;
  const upcoming = Number(profile.upcomingExpense) > 0;
  const rate = upcoming || highRisk ? 0.15 : 0.1;
  return {
    value: Math.round(incomeBase * rate),
    rate,
    label: upcoming ? "15% buffer (large upcoming expense in 6 months)" : highRisk ? "15% buffer (sole earner or recent bounce)" : "10% buffer",
  };
}

export function cashFlow(profile) {
  const incomeBase = Math.max(0, Math.round(blendedIncome(profile)));
  const di = Math.round(documentedIncome(profile));
  const expenses = effectiveExpenses(profile, incomeBase);
  const emi = effectiveEmi(profile, incomeBase);
  const buf = bufferAmount(profile, incomeBase);
  const upcomingLump = Math.max(0, Math.round(Number(profile.upcomingExpense ?? 0) / 6)); // spread over 6 months
  const fcf = Math.round(incomeBase - emi.value - expenses.value - buf.value - upcomingLump);
  const safeEmi = Math.max(0, Math.round(fcf * 0.8)); // keep 20% breathing room
  return {
    documentedIncome: di,
    blendedIncome: incomeBase,
    expenses,
    existingEmi: emi,
    buffer: buf,
    upcomingMonthly: upcomingLump,
    fcf,
    safeEmi,
    stabilityNote: stabilityDiscountLabel(profile),
  };
}
