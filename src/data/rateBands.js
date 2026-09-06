// Rate bands from Final Spec §7-D. Judgement-based realistic Indian market
// bands, NOT live data. See RULES.md §6.
export const RATE_BANDS = {
  personal: {
    // [lo, hi]
    unknown: [12, 16],
    good: [10.5, 12.5], // credit >= 750
    mid: [11.5, 14], // 650–749 (judgement interpolation)
    weak: [15, 18], // credit < 650
  },
  secured_business: {
    unknown: [11, 13.5],
    good: [10, 11.5],
    mid: [10.5, 12.5],
    weak: [12, 14], // rare in this lane; conservative fallback
  },
  informal_small_ticket: {
    unknown: [15, 18],
    good: [13, 15],
    mid: [14, 17],
    weak: [17, 20],
  },
};

// Lane defaults (judgement, documented in RULES.md)
export const LANE_DEFAULTS = {
  personal: {
    label: "Unsecured Personal Loan",
    foirCap: 0.45,
    typicalRate: 13, // used to convert lender max-EMI -> sanction amount
    sanctionTenureMonths: 60,
    safeTenureMonths: 48,
    maxTenureMonths: 60,
    processingFeePct: 1,
  },
  secured_business: {
    label: "Secured / Business Loan (LAP-style)",
    foirCap: 0.55,
    typicalRate: 12,
    sanctionTenureMonths: 84,
    safeTenureMonths: 84,
    maxTenureMonths: 120,
    processingFeePct: 1,
    ltvCap: 0.5, // sanction <= 50% of collateral value
  },
  informal_small_ticket: {
    label: "Small-ticket / Informal Loan",
    foirCap: 0.4,
    typicalRate: 16.5,
    sanctionTenureMonths: 36,
    safeTenureMonths: 36,
    maxTenureMonths: 60,
    processingFeePct: 2,
  },
};

export const CREDIT_THRESHOLDS = { good: 750, weak: 650 };

export function creditBucket(profile) {
  if (!profile.creditScoreKnown || profile.creditScore == null) return "unknown";
  const s = Number(profile.creditScore);
  if (!Number.isFinite(s)) return "unknown";
  if (s >= CREDIT_THRESHOLDS.good) return "good";
  if (s < CREDIT_THRESHOLDS.weak) return "weak";
  return "mid";
}
