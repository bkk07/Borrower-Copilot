// Central money-math helpers. Pure functions, no UI imports.
export function emiForPrincipal(principal, annualRatePct, months) {
  if (!principal || principal <= 0 || !months || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

export function principalForEmi(emi, annualRatePct, months) {
  if (!emi || emi <= 0 || !months || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return emi * months;
  const pow = Math.pow(1 + r, months);
  return (emi * (pow - 1)) / (r * pow);
}

export function totalInterest(principal, emi, months) {
  return Math.max(0, emi * months - principal);
}

export function midpointOf(value, fallback = 0) {
  if (Array.isArray(value)) return (Number(value[0]) + Number(value[1])) / 2;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatINR(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  const v = Math.round(Number(n));
  return "₹" + v.toLocaleString("en-IN");
}

export function formatLakh(n) {
  if (!Number.isFinite(Number(n))) return "—";
  const v = Number(n);
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return formatINR(v);
}

export function formatRangeINR([lo, hi]) {
  return `${formatINR(lo)}–${formatINR(hi)}`;
}

// Indian-denomination display: lakhs / crores (UI readability).
export function fmtLakh(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (a >= 100000) {
    const l = v / 100000;
    return `₹${l >= 100 ? Math.round(l) : l.toFixed(l >= 10 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")}L`;
  }
  if (a >= 1000) return `₹${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function fmtRangeLakh([lo, hi]) {
  if (!lo && !hi) return "≈ ₹0";
  return `${fmtLakh(lo)}–${fmtLakh(hi)}`;
}

// Rounded headline form for ranges — avoids false precision like ₹17,89,209.
export function fmtLakhRounded(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "≈ ₹0";
  const a = Math.abs(v);
  if (a >= 10000000) return `₹${(v / 10000000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (a >= 100000) {
    // snap to 0.5L for <10L, 1L for >=10L
    const step = a < 1000000 ? 50000 : 100000;
    const r = Math.round(v / step) * step;
    return fmtLakh(r);
  }
  if (a >= 10000) {
    const r = Math.round(v / 5000) * 5000;
    return `₹${(r / 1000).toFixed(0)}k`;
  }
  return formatINR(Math.round(v / 1000) * 1000);
}

export function fmtRangeLakhRounded([lo, hi]) {
  if (!lo && !hi) return "≈ ₹0";
  // when both tiny, keep the precise helper — headline will be ≈₹0 branch above
  return `${fmtLakhRounded(lo)}–${fmtLakhRounded(hi)}`;
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
