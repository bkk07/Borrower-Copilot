// Lender-sanction engine (Final Spec §7-B). FOIR + LTV. Pure functions.
import { LANE_DEFAULTS } from "../data/rateBands.js";
import { principalForEmi } from "./finance.js";
import { documentedIncome } from "./cashFlow.js";

// Sanction base income per lane (judgement — RULES.md §4):
// salaried -> documented salary; secured -> blended (collateral lowers risk,
// lender does cash-flow assessment); informal -> discounted safe income.
export function sanctionBaseIncome(profile, lane, cf) {
  if (lane === "secured_business") return cf.blendedIncome;
  if (lane === "informal_small_ticket") return cf.blendedIncome;
  return documentedIncome(profile);
}

export function sanctionCalc(profile, lane, cf) {
  const def = LANE_DEFAULTS[lane];
  const base = Math.max(0, Math.round(sanctionBaseIncome(profile, lane, cf)));
  const foirCap = def.foirCap;
  const maxLenderEmi = Math.max(0, Math.round(base * foirCap - cf.existingEmi.value));
  let amount = Math.round(principalForEmi(maxLenderEmi, def.typicalRate, def.sanctionTenureMonths));
  let ltvCap = null;
  let cappedByLtv = false;
  if (lane === "secured_business") {
    const free = profile.collateral?.available && profile.collateral?.encumbered !== true;
    const val = Number(profile.collateral?.value);
    if (free && Number.isFinite(val) && val > 0) {
      ltvCap = Math.round(val * def.ltvCap);
      if (amount > ltvCap) {
        amount = ltvCap;
        cappedByLtv = true;
      }
    }
  }
  return { base, foirCap, maxLenderEmi, amount, ltvCap, cappedByLtv, typicalRate: def.typicalRate, tenureMonths: def.sanctionTenureMonths };
}
