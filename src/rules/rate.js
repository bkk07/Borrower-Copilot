// Rate + APR (Final Spec §7-D/E). Pure functions.
import { RATE_BANDS, creditBucket } from "../data/rateBands.js";

export function rateBand(profile, lane) {
  const bucket = creditBucket(profile);
  const table = RATE_BANDS[lane] ?? RATE_BANDS.personal;
  const band = table[bucket] ?? table.unknown;
  return { band: [...band], bucket };
}

// Confidence narrows the shown range: Low = full band, Medium = middle 75%,
// High = middle 50%. Same confidence value drives ranges everywhere.
export function narrowedBand(band, confidence) {
  const [lo, hi] = band;
  const width = hi - lo;
  if (confidence === "High") return [round1(lo + width * 0.25), round1(hi - width * 0.25)];
  if (confidence === "Medium") return [round1(lo + width * 0.125), round1(hi - width * 0.125)];
  return [round1(lo), round1(hi)];
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function bandMid(band) {
  return (band[0] + band[1]) / 2;
}

// Simplified APR: spread a one-time fee over the loan life (approximation,
// labelled as such in the UI + RULES.md §7).
export function aprEstimate(nominalRate, feePct, tenureMonths) {
  return aprBreakdown(nominalRate, feePct, tenureMonths).apr;
}

// Same maths, but exposes the fee-drag split so the UI can show
// "11.6% + ~3.0% fee drag ≈ 14.6%" instead of a bare alarming number.
export function aprBreakdown(nominalRate, feePct, tenureMonths) {
  const years = tenureMonths / 12;
  const feeDrag = !years || years <= 0 ? 0 : Math.round((((feePct || 0) * 12) / years) * 10) / 10;
  const apr = Math.round((nominalRate + feeDrag) * 10) / 10;
  return { apr, nominal: Math.round(nominalRate * 10) / 10, feeDrag, feePct: feePct || 0 };
}
