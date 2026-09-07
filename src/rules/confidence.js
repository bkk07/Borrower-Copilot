// Confidence (Final Spec §7-I + §9). Pure function.
// High: mostly answered + mostly documented. Medium: some gaps. Low: many
// "unknown" or mostly unverifiable cash. Confidence widens every shown range.
export function confidenceScore(profile) {
  const penalties = [];
  const penalise = (pts, reason) => penalties.push({ pts, reason });

  // --- completeness + bounce risk ---
  if (profile.recentBounce === true)
    penalise(1, "recent payment bounce — repayment risk is higher");
  if (profile.householdExpenses === "unknown")
    penalise(1, "expenses estimated — you didn't confirm them");
  if (profile.existingEmi === "unknown")
    penalise(2, "existing EMI amount unknown — estimated");
  if (!profile.creditScoreKnown) penalise(1, "credit score unknown — rate band stays wide");
  if (profile.savingsBufferMonths === "unknown" || !profile.savingsBufferMonths)
    penalise(1, "savings buffer unknown");
  if (profile.incomeType === "salaried") {
    if (profile.employmentYears == null) penalise(0.5, "work history not stated");
    if (profile.variableIncomePct == null) penalise(0.5, "variable-pay share not stated");
  }
  if (profile.incomeType === "self_employed") {
    if (profile.businessYears == null) penalise(0.5, "business age not stated");
    if (profile.itrAnnualIncome == null) penalise(1, "ITR income not stated");
    if (!profile.cashIncomeRange) penalise(0.5, "cash income not stated");
  }
  if (profile.incomeType === "informal") {
    if (!profile.incomeStability || profile.incomeStability === "unknown")
      penalise(1, "income stability unknown");
    if (profile.existingLoanCount == null) penalise(0.5, "app-loan count not stated");
    if (profile.recentBounce == null) penalise(0.5, "bounce history not stated");
    if (profile.soleEarner == null) penalise(0.5, "sole-earner status not stated");
  }

  if (profile.existingEmiHorizon === "unknown") penalise(0.5, "existing EMI end date unknown");
  if (Array.isArray(profile.existingEmiBreakdown)) {
    for (const e of profile.existingEmiBreakdown) if (e.monthsLeft === "unknown") penalise(0.5, "one EMI's end date unknown");
  }

  // --- verifiability ---
  if (profile.incomeType === "informal") penalise(1, "income is self-reported cash (unverifiable)");
  if (profile.incomeType === "self_employed") {
    const di = profile.itrAnnualIncome ? profile.itrAnnualIncome / 12 : 0;
    const cash = profile.cashIncomeRange
      ? (Number(profile.cashIncomeRange[0]) + Number(profile.cashIncomeRange[1])) / 2
      : 0;
    if (cash * 0.5 > di) penalise(1, "most counted income is unverifiable cash");
  }
  if (Array.isArray(profile.income?.amount)) penalise(0.5, "income given as a range");

  const total = penalties.reduce((s, p) => s + p.pts, 0);
  const level = total <= 1 ? "High" : total <= 3.5 ? "Medium" : "Low";
  return { level, penaltyPoints: total, reasons: penalties.map((p) => p.reason) };
}

// Range widening driven by the SAME confidence value (never contradicts it).
export function widenAmount(center, confidence) {
  if (!Number.isFinite(center) || center <= 0) return [0, 0];
  const spread = confidence === "High" ? 0.08 : confidence === "Medium" ? 0.15 : 0.25;
  return [Math.max(0, Math.round(center * (1 - spread))), Math.round(center * (1 + spread))];
}

export function widenEmi(center, confidence) {
  return widenAmount(center, confidence);
}
