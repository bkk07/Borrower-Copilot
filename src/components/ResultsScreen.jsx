import { useEffect, useState } from "react";
import OutputCard from "./OutputCard.jsx";
import StressTestCard from "./StressTestCard.jsx";
import NegotiationCard from "./NegotiationCard.jsx";
import { ConfBadge } from "./ui.jsx";
import { formatINR, fmtRangeLakh, fmtRangeLakhRounded, fmtLakhRounded } from "../rules/finance.js";

function ThinIcon({ kind }) {
  const d =
    kind === "borrow"
      ? "M11 18.2 L15.6 22.8 L25.2 13.2"
      : kind === "less"
        ? "M12 18 H24 M12 22 H20"
        : "M13 13 L23 23 M23 13 L13 23";
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="9" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.22" />
      <path d={d} fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VerdictHero({ result, profile }) {
  const r = result;
  const theme =
    r.verdict.key === "borrow"
      ? { bg: "linear-gradient(135deg,#0b3b2c,#176b3f)", chip: "#e3f1e6", chipInk: "#0b3b2c", icon: "borrow" }
      : r.verdict.key === "less"
        ? { bg: "linear-gradient(135deg,#6b4408,#b97f1f)", chip: "#faecd2", chipInk: "#6b4408", icon: "less" }
        : { bg: "linear-gradient(135deg,#5c130e,#a4261f)", chip: "#f9e2df", chipInk: "#5c130e", icon: "dont" };
  return (
    <section className="anim-rise overflow-hidden rounded-2xl text-white shadow-xl" style={{ background: theme.bg }}>
      <div className="p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold" style={{ background: theme.chip, color: theme.chipInk }}>Should you borrow?</span>
          <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/90">{r.laneLabel}</span>
          <ConfBadge level={r.confidence.level} />
        </div>
        <h2 className="font-display mt-3 flex items-center gap-3 text-4xl font-semibold md:text-5xl">
          <ThinIcon kind={theme.icon} /> {r.verdict.label.replace(/^(✅|⚠️|🛑)\s*/, "")}
        </h2>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-white/90">{r.verdict.reason}</p>
        <p className="mt-1 max-w-xl text-sm italic text-white/70">{r.verdict.tone}</p>
        {r.verdict.bounceWarning ? (
          <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">{r.verdict.bounceWarning}</p>
        ) : null}
        {r.verdict.key === "dont" && r.cf.fcf <= 0 ? (
          <p className="mt-2 rounded-xl bg-white/15 p-3 text-sm text-white/90">
            A lender may still offer a loan, but that does not mean the loan is affordable for you. Your free cash flow is already around {fmtLakhRounded(r.cf.fcf)}/month.
          </p>
        ) : null}
        <p className="mt-4 text-sm text-white/80">
          Requested {fmtLakhRounded(profile.requestedAmount)} · needs ~{formatINR(r.emiNeeded)}/mo — see the detailed EMI comparison below.
        </p>
      </div>
    </section>
  );
}

// Animated dual-bar: bank sanction vs safe amount on one scale.
function DualBars({ sanctionRange, safeRange }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true))); return () => cancelAnimationFrame(t); }, []);
  const max = Math.max(sanctionRange[1], safeRange[1], 1);
  const row = (label, range, color, use, sub) => (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">{label} {use && <span className="ml-1 rounded-md bg-[#0b3b2c] px-1.5 py-0.5 text-[11px] text-white">USE THIS</span>}</p>
        <p className="font-display text-lg font-bold">{fmtRangeLakhRounded(range)}</p>
      </div>
      <div className="bc-bar mt-1"><div style={{ width: on ? `${Math.max(2, (range[1] / max) * 100)}%` : "0", background: color }} /></div>
      <p className="mt-0.5 text-xs text-[#6f6355]">{sub}</p>
    </div>
  );
  return (
    <div className="grid gap-4">
      {row("Possible lender sanction", sanctionRange, "#b3a893", false, `Bank estimate · up to ${fmtLakhRounded(sanctionRange[1])}`)}
      {row("Safer borrowing range", safeRange, "linear-gradient(90deg,#0b3b2c,#1d6b4d)", true, `borrower-side cash-flow comfort · up to ${fmtLakhRounded(safeRange[1])}`)}
    </div>
  );
}

// Rate band track: full lane band with the fair-range marker positioned on it.
function RateTrack({ fullBand, fairRange, aprLabel }) {
  const [lo, hi] = fullBand;
  const span = Math.max(hi - lo, 0.1);
  const left = ((fairRange[0] - lo) / span) * 100;
  const width = ((fairRange[1] - fairRange[0]) / span) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-3xl font-bold">{fairRange[0]}–{fairRange[1]}<span className="text-xl">%</span></p>
        <p className="text-sm text-[#6f6355]">{aprLabel}</p>
      </div>
      <div className="bc-track mt-3">
        <div className="bc-track-marker" style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs text-[#6f6355]">
        <span>{lo}% (lane floor)</span><span>your fair slice in dark green</span><span>{hi}% (lane cap)</span>
      </div>
    </div>
  );
}

export default function ResultsScreen({ result, profile, onRestart, onEdit }) {
  const r = result;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <VerdictHero result={r} profile={profile} />
      {r.routing.guessed && (
        <p className="anim-rise-1 mt-3 rounded-xl border border-[#e8c877] bg-[#faecd2] p-3 text-sm">⚠️ {r.routing.reason}</p>
      )}

      <div className="mt-4 grid gap-4">
        <OutputCard kicker="How much could you get vs. how much is safe" title="How much could you get vs. how much is safe" badge={<ConfBadge level={r.confidence.level} />} delay={1}
          why={`${r.explanations.sanctionGap} The safer range uses your free cash flow (${formatINR(r.cf.fcf)}/month → ${formatINR(r.cf.safeEmi)} safe EMI). The lender sanction is a FOIR estimate, not what you can comfortably afford.`}>
          <div className="rounded-xl bg-[#faf5ea] p-3 text-xs leading-relaxed text-[#4a4238]">A lender may approve more than what looks comfortable based on your current cash flow.</div>
          <div className="mt-3"><DualBars sanctionRange={r.sanction.range} safeRange={r.safe.range} /></div>
          <p className="mt-2 text-[13px] text-[#6f6355]">Possible lender sanction: Bank estimate · {r.sanction.tenureMonths} months at ~{r.sanction.typicalRate}%{r.sanction.cappedByLtv ? " · limited by your property value" : ""} &nbsp;|&nbsp; Safer range: {r.safe.tenureMonths} months at ~{r.rate.fairMid}%</p>
          <details className="mt-2 text-xs text-[#6f6355]"><summary className="cursor-pointer font-semibold text-[#0b3b2c]">Show exact numbers</summary><p className="mt-1">Sanction {fmtRangeLakh(r.sanction.range)} · Safer {fmtRangeLakh(r.safe.range)} — headlines are rounded to avoid false precision.</p></details>
          {r.verdict.key === "less" && (
            <p className="mt-2 rounded-xl bg-[#faecd2] p-3 text-sm">👉 Consider <b>{fmtLakhRounded(r.safe.center)}</b> instead of {fmtLakhRounded(profile.requestedAmount)} — same purpose, survivable EMI.</p>
          )}
          {r.safe.center <= 0 && (
            <p className="mt-2 rounded-xl bg-[#f9e2df] p-3 text-sm">A lender may still offer a loan, but that does not mean the loan is affordable for you. Your safer borrowing range is ≈ ₹0 today.</p>
          )}
        </OutputCard>

        <OutputCard kicker="What's a fair rate?" title="What's a fair rate?" badge={<ConfBadge level={r.confidence.level} />} delay={1}
          why={`${r.explanations.fairRate} Approx. all-in cost adds the ${r.rate.feePct}% processing fee spread over the loan life (illustrative estimate, see RULES.md).`}>
          <RateTrack fullBand={r.rate.fullBand} fairRange={r.rate.fairRange}
            aprLabel={<><span className="text-xs font-semibold uppercase tracking-widest text-[#6f6355]">Approx. all-in annual cost</span> <span className="ml-2">~<b className="text-[#1c1611]">{r.rate.apr}%</b></span></>} />
          <p className="mt-1 text-xs text-[#6f6355]">This is an estimate using the assumed processing fee. Actual APR depends on the lender's fees and charges.</p>
          <p className="mt-3 rounded-xl bg-[#faf5ea] p-3 text-sm">If the lender quotes above <b>{r.rate.fairRange[1]}%</b>, push back — cite your {profile.creditScoreKnown ? `score of ${profile.creditScore}` : "profile"} and this band.</p>
          {r.lenderComparison && <p className="mt-2 rounded-xl bg-[#e2ece4] p-3 text-sm font-medium">{r.lenderComparison.text}</p>}
        </OutputCard>

        <OutputCard kicker="What EMI should you agree to?" title={r.emiCeiling > 0 ? `What EMI should you agree to? Stay near ${formatINR(r.emiCeiling)}/month` : "No safe EMI today — agree to none"} badge={<ConfBadge level={r.confidence.level} />} delay={2}
          why={`${r.explanations.safeEmi} The ${fmtLakhRounded(profile.requestedAmount)} you asked for needs ~${formatINR(r.emiNeeded)}/month at a fair rate.`}>
          <div className="grid gap-2 rounded-xl bg-white p-3">
            <div className="sticky top-0 z-[1] -mx-3 -mt-3 flex items-baseline justify-between rounded-t-xl bg-[#faf5ea] px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6f6355]">Your requested loan</span>
              <span className="font-display text-lg font-bold">{fmtLakhRounded(profile.requestedAmount)}</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#4a4238]">Estimated EMI</span>
              <span className="font-bold">~{formatINR(r.emiNeeded)}/month</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#e3d9c6] pt-2 text-sm">
              <span className="font-bold text-[#0b3b2c]">Your maximum safe EMI</span>
              <span className="font-bold text-[#0b3b2c]">~{formatINR(r.emiCeiling)}/month</span>
            </div>
            <p className="text-xs text-[#6f6355]">{r.emiNeeded <= r.emiCeiling && r.emiCeiling > 0 ? "Your requested loan's estimated EMI is below your current safe EMI ceiling." : r.emiCeiling > 0 ? "Your requested loan's EMI would be above your safe ceiling — consider borrowing less." : "There is no comfortable EMI headroom today."}</p>
          </div>
          <p className="mb-1 mt-3 text-xs font-bold uppercase tracking-widest text-[#6f6355]">Tenure trade-off — if you borrowed only the safer amount · {fmtLakhRounded(r.safe.center)} @ {r.rate.fairMid}%</p>
          <table className="bc-table w-full text-[15px]">
            <thead><tr><th>Tenure</th><th>EMI / mo</th><th>Total interest</th></tr></thead>
            <tbody>
              {r.tenureTable.map((t) => (
                <tr key={t.months}>
                  <td className="font-semibold">{t.years} yrs</td>
                  <td className="font-bold text-[#0b3b2c]">{formatINR(t.emi)}</td>
                  <td className="text-[#4a4238]">{formatINR(t.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs italic text-[#6f6355]">* At your requested amount of {fmtLakhRounded(profile.requestedAmount)}, EMIs would be about {formatINR(Math.round((profile.requestedAmount / Math.max(r.safe.center, 1)) * (r.tenureTable[1]?.emi ?? r.emiNeeded)))}/mo higher at the same tenures — this table shows the safer amount.</p>
        </OutputCard>

        <StressTestCard stress={r.stress} confidence={r.confidence} />

        {(r.consolidationNote || r.debtPayoffNote) && (
          <div className="bc-card anim-rise-2 border-l-4 !border-l-[#b97f1f] p-5">
            <p className="font-bold">💡 Before any new loan</p>
            {r.debtPayoffNote && <p className="mt-1 text-[15px] text-[#4a4238]">{r.debtPayoffNote}</p>}
            {r.consolidationNote && <p className="mt-1 text-[15px] text-[#4a4238]">{r.consolidationNote}</p>}
          </div>
        )}

        <div className="bc-card anim-rise-2 p-5">
          <p className="flex items-center gap-2 font-bold">🔍 Every number, traced <ConfBadge level={r.confidence.level} /></p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14.5px] text-[#4a4238]">
            <li>
              Safe EMI ~{formatINR(r.cf.safeEmi)}/month — monthly income {fmtLakhRounded(r.cf.blendedIncome)}, existing EMI {r.cf.existingEmi.estimated ? <span>~{formatINR(r.cf.existingEmi.value)}/month <span className="rounded bg-amber-100 px-1 py-0.5 text-xs font-bold text-amber-900">Estimated</span></span> : `${formatINR(r.cf.existingEmi.value)}/month`}, essential expenses {r.cf.expenses.estimated ? <span>~{formatINR(r.cf.expenses.value)}/month <span className="rounded bg-amber-100 px-1 py-0.5 text-xs font-bold text-amber-900">Estimated — not provided</span></span> : `${formatINR(r.cf.expenses.value)}/month`}, safety cushion {Math.round(r.cf.buffer.rate * 100)}%{r.cf.upcomingMonthly ? ` + ~${formatINR(r.cf.upcomingMonthly)}/month upcoming expense` : ""} → FCF {fmtLakhRounded(r.cf.fcf)}/month → ×0.8 breathing room.
            </li>
            <li>
              Credit score: {r.profile?.creditScoreKnown ? `${r.profile.creditScore} (${r.rate.bucket})` : <span>Unknown — <em>this does not mean your credit score is poor.</em> Band stays wide at {r.rate.fullBand[0]}–{r.rate.fullBand[1]}%.</span>}
            </li>
            <li>{r.explanations.confidence}</li>
            {r.confidence.reasons.slice(1, 4).map((x) => <li key={x}>{x}.</li>)}
          </ul>
        </div>

        <div className="anim-rise-3"><NegotiationCard result={{ ...r, profile }} /></div>

        <div className="no-print flex gap-2 pb-10">
          <button type="button" onClick={onEdit} className="bc-btn-ghost flex-1 !bg-white">← Edit answers</button>
          <button type="button" onClick={onRestart} className="bc-btn-ghost flex-1 !bg-[#1c1611] !text-white">↺ Start over</button>
        </div>
      </div>
    </div>
  );
}
