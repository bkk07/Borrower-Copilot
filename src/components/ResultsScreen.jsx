import { useEffect, useState } from "react";
import OutputCard from "./OutputCard.jsx";
import StressTestCard from "./StressTestCard.jsx";
import NegotiationCard from "./NegotiationCard.jsx";
import { ConfBadge } from "./ui.jsx";
import { formatINR, fmtLakh, fmtRangeLakh } from "../rules/finance.js";

function VerdictHero({ result, profile }) {
  const r = result;
  const theme =
    r.verdict.key === "borrow"
      ? { bg: "linear-gradient(135deg,#0b3b2c,#176b3f)", chip: "#e3f1e6", chipInk: "#0b3b2c", icon: "✅" }
      : r.verdict.key === "less"
        ? { bg: "linear-gradient(135deg,#6b4408,#b97f1f)", chip: "#faecd2", chipInk: "#6b4408", icon: "⚠️" }
        : { bg: "linear-gradient(135deg,#5c130e,#a4261f)", chip: "#f9e2df", chipInk: "#5c130e", icon: "🛑" };
  return (
    <section className="anim-rise overflow-hidden rounded-2xl text-white shadow-xl" style={{ background: theme.bg }}>
      <div className="p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold" style={{ background: theme.chip, color: theme.chipInk }}>O1 · VERDICT</span>
          <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/90">{r.laneLabel}</span>
          <ConfBadge level={r.confidence.level} />
        </div>
        <h2 className="font-display mt-3 text-4xl font-semibold md:text-5xl"><span>{theme.icon}</span> {r.verdict.label.replace(/^(✅|⚠️|🛑)\s*/, "")}</h2>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-white/90">{r.verdict.reason}</p>
        <p className="mt-1 max-w-xl text-sm italic text-white/70">{r.verdict.tone}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Asked for", fmtLakh(profile.requestedAmount)],
            ["Needs /mo", `${formatINR(r.emiNeeded)}`],
            ["Safe EMI", `${formatINR(r.emiCeiling)}/mo`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-black/25 p-3 text-center">
              <p className="text-[11px] uppercase tracking-widest text-white/60">{l}</p>
              <p className="font-display text-lg font-bold md:text-xl">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Animated dual-bar: bank sanction vs safe amount on one scale.
function DualBars({ sanctionRange, safeRange }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true))); return () => cancelAnimationFrame(t); }, []);
  const max = Math.max(sanctionRange[1], safeRange[1], 1);
  const row = (label, range, color, use) => (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">{label} {use && <span className="ml-1 rounded-md bg-[#0b3b2c] px-1.5 py-0.5 text-[11px] text-white">USE THIS</span>}</p>
        <p className="font-display text-lg font-bold">{fmtRangeLakh(range)}</p>
      </div>
      <div className="bc-bar mt-1"><div style={{ width: on ? `${Math.max(2, (range[1] / max) * 100)}%` : "0", background: color }} /></div>
      <p className="mt-0.5 text-xs text-[#6f6355]">up to {fmtLakh(range[1])} · from {fmtLakh(range[0])}</p>
    </div>
  );
  return (
    <div className="grid gap-4">
      {row("🏦 Bank might sanction", sanctionRange, "#b3a893", false)}
      {row("🫵 Safe for you", safeRange, "linear-gradient(90deg,#0b3b2c,#1d6b4d)", true)}
    </div>
  );
}

// Rate band track: full lane band with the fair-range marker positioned on it.
function RateTrack({ fullBand, fairRange }) {
  const [lo, hi] = fullBand;
  const span = Math.max(hi - lo, 0.1);
  const left = ((fairRange[0] - lo) / span) * 100;
  const width = ((fairRange[1] - fairRange[0]) / span) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-3xl font-bold">{fairRange[0]}–{fairRange[1]}<span className="text-xl">%</span></p>
        <p className="text-sm text-[#6f6355]">real cost ~<b className="text-[#1c1611]">{fairRange[2] ?? ""}</b></p>
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
        <OutputCard kicker="O2 · How much?" title="Two numbers. Never one." badge={<ConfBadge level={r.confidence.level} />} delay={1}
          why={`${r.explanations.sanctionGap} Your safe amount uses free cash flow (${formatINR(r.cf.fcf)}/month → ${formatINR(r.cf.safeEmi)} safe EMI), not the bank's FOIR maths.`}>
          <DualBars sanctionRange={r.sanction.range} safeRange={r.safe.range} />
          <p className="mt-2 text-[13px] text-[#6f6355]">Bank: FOIR {Math.round(r.sanction.foirCap * 100)}% · {r.sanction.tenureMonths} mo @ ~{r.sanction.typicalRate}%{r.sanction.cappedByLtv ? " · capped at 50% of property value" : ""} &nbsp;|&nbsp; Safe: {r.safe.tenureMonths} mo @ {r.rate.fairMid}%</p>
          {r.verdict.key === "less" && (
            <p className="mt-2 rounded-xl bg-[#faecd2] p-3 text-sm">👉 Consider <b>{fmtLakh(r.safe.center)}</b> instead of {fmtLakh(profile.requestedAmount)} — same purpose, survivable EMI.</p>
          )}
          {r.safe.center <= 0 && (
            <p className="mt-2 rounded-xl bg-[#f9e2df] p-3 text-sm">👉 Safe amount is ≈ ₹0 today. Any new EMI risks another missed payment — see the note below before borrowing.</p>
          )}
        </OutputCard>

        <OutputCard kicker="O3 · Fair rate" title="Know the band before they quote" badge={<ConfBadge level={r.confidence.level} />} delay={1}
          why={`${r.explanations.fairRate} Real cost adds the ${r.rate.feePct}% processing fee spread over the loan life (simplified APR — an approximation, see RULES.md).`}>
          <RateTrack fullBand={r.rate.fullBand} fairRange={[...r.rate.fairRange, `${r.rate.apr}%`]} />
          <p className="mt-3 rounded-xl bg-[#faf5ea] p-3 text-sm">If the lender quotes above <b>{r.rate.fairRange[1]}%</b>, push back — cite your {profile.creditScoreKnown ? `score of ${profile.creditScore}` : "profile"} and this band.</p>
          {r.lenderComparison && <p className="mt-2 rounded-xl bg-[#e2ece4] p-3 text-sm font-medium">{r.lenderComparison.text}</p>}
        </OutputCard>

        <OutputCard kicker="O4 · EMI ceiling" title={r.emiCeiling > 0 ? `Never agree above ${formatINR(r.emiCeiling)}/month` : "No safe EMI today — agree to none"} badge={<ConfBadge level={r.confidence.level} />} delay={2}
          why={`${r.explanations.safeEmi} The ${fmtLakh(profile.requestedAmount)} you asked for needs ~${formatINR(r.emiNeeded)}/month at a fair rate.`}>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#6f6355]">Tenure trade-off · {fmtLakh(r.safe.center)} @ {r.rate.fairMid}%</p>
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
        </OutputCard>

        <StressTestCard stress={r.stress} confidence={r.confidence} />

        {r.consolidationNote && (
          <div className="bc-card anim-rise-2 border-l-4 !border-l-[#b97f1f] p-5">
            <p className="font-bold">💡 Before any new loan</p>
            <p className="mt-1 text-[15px] text-[#4a4238]">{r.consolidationNote}</p>
          </div>
        )}

        <div className="bc-card anim-rise-2 p-5">
          <p className="flex items-center gap-2 font-bold">🔍 Every number, traced <ConfBadge level={r.confidence.level} /></p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14.5px] text-[#4a4238]">
            <li>{r.explanations.safeEmi}{r.cf.expenses.estimated ? " (expenses estimated — you didn't confirm them)" : ""}{r.cf.existingEmi.estimated ? " (EMI estimated — amount unknown)" : ""}</li>
            <li>{r.explanations.confidence}</li>
            {r.confidence.reasons.slice(1, 4).map((x) => <li key={x}>{x}.</li>)}
          </ul>
        </div>

        <div className="anim-rise-3"><NegotiationCard text={r.card} /></div>

        <div className="no-print flex gap-2 pb-10">
          <button type="button" onClick={onEdit} className="bc-btn-ghost flex-1 !bg-white">← Edit answers</button>
          <button type="button" onClick={onRestart} className="bc-btn-ghost flex-1 !bg-[#1c1611] !text-white">↺ Start over</button>
        </div>
      </div>
    </div>
  );
}
