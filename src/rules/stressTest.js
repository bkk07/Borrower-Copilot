// Stress test: two fixed scenarios (Final Spec §7-H). Pure function.
import { emiForPrincipal } from "./finance.js";

export function stressTest({ safeAmount, fairMid, safeTenureMonths, safeEmi, fcf, blendedIncome, emiNeeded }) {
  // 1. Income drops 20% -> recompute FCF, does the ACTUAL loan EMI still fit?
  // (Spec narrative: "you would/would not still manage this EMI" — the EMI
  // of the loan asked for, not the theoretical max safe EMI.)
  const stressedIncome = blendedIncome * 0.8;
  // Expenses + existing EMI are sticky; buffer scales with income (10% rule).
  // We approximate: stressed FCF = fcf - 20% of income + buffer relief.
  const stressedFcf = Math.round(fcf - blendedIncome * 0.2 + blendedIncome * 0.2 * 0.1);
  const need = Math.max(emiNeeded || 0, 0);
  const ratio = need > 0 ? stressedFcf / need : stressedFcf >= 0 ? 1 : 0;
  const incomeStatus = ratio >= 1 ? "pass" : ratio >= 0.7 ? "tight" : "fail";
  // 2. Rate rises 2pp at the same amount -> does EMI stay within the safe ceiling?
  const stressedEmi = Math.round(emiForPrincipal(safeAmount, fairMid + 2, safeTenureMonths));
  // PASS = comfortably within safeEmi, TIGHT = above safeEmi but within FCF, FAIL otherwise.
  let rateStatus;
  let ratePass;
  if (safeEmi <= 0) {
    rateStatus = stressedEmi <= 0 ? "pass" : "fail";
    ratePass = rateStatus === "pass";
  } else if (stressedEmi <= safeEmi) {
    rateStatus = "pass";
    ratePass = true;
  } else if (stressedEmi <= Math.max(fcf, 0)) {
    rateStatus = "tight";
    ratePass = false;
  } else {
    rateStatus = "fail";
    ratePass = false;
  }
  void stressedIncome;
  return {
    incomeDrop: { newFcf: stressedFcf, status: incomeStatus, pass: incomeStatus === "pass", ratio: Math.round(ratio * 100) / 100 },
    rateRise: { newEmi: stressedEmi, status: rateStatus, pass: ratePass },
  };
}
