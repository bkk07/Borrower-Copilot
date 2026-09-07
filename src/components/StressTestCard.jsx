import { useMemo, useState } from "react";
import OutputCard from "./OutputCard.jsx";
import { ConfBadge } from "./ui.jsx";
import { formatINR } from "../rules/finance.js";
import { stressTest } from "../rules/stressTest.js";

export default function StressTestCard({ stress, confidence, ctx }) {
  const [incomeDrop, setIncomeDrop] = useState(20);
  const [rateDelta, setRateDelta] = useState(2);
  const live = useMemo(() => {
    if (!ctx) return stress;
    return stressTest({ ...ctx, incomeDropPct: incomeDrop, rateDelta });
  }, [ctx, stress, incomeDrop, rateDelta]);
  const inc = live.incomeDrop;
  const rate = live.rateRise;
  const incMeta =
    inc.status === "pass"
      ? ["PASS", "#176b3f", "#e3f1e6"]
      : inc.status === "tight"
        ? ["TIGHT — proceed carefully", "#9a5b0b", "#faecd2"]
        : ["FAIL", "#a4261f", "#f9e2df"];
  const rateMeta =
    rate.status === "pass" ? ["PASS", "#176b3f", "#e3f1e6"] : rate.status === "tight" ? ["TIGHT", "#9a5b0b", "#faecd2"] : ["FAIL", "#a4261f", "#f9e2df"];
  const tile = (meta, body) => (
    <li className="rounded-xl p-3.5" style={{ background: meta[2] }}>
      <span className="text-sm font-extrabold tracking-wide" style={{ color: meta[1] }}>{meta[0]}</span>
      <span className="block text-[15px] text-[#1c1611]">{body}</span>
    </li>
  );
  const clampIncome = (v) => Math.max(0, Math.min(30, Number(v) || 0));
  const clampRate = (v) => Math.max(0, Math.min(3, Number(v) || 0));
  return (
    <OutputCard
      kicker="Stress lab — drag the future"
      title="What if things get worse?"
      badge={<span className="text-xs font-semibold text-[#6f6355]">Interactive</span>}
      why="Drag the sliders — income drop recomputes free cash flow vs your EMI, rate hike recomputes EMI vs safe ceiling. Same engine, your what-if."
      delay={2}
    >
      <div className="grid gap-4 rounded-xl bg-[#faf5ea] p-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6f6355]">Income drop</span>
            <span className="rounded-full bg-[#0b3b2c] px-3 py-1 text-xs font-bold text-white">{incomeDrop}%</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" aria-label="Decrease income drop" onClick={() => setIncomeDrop((v) => clampIncome(v - 5))} className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-[#e3d9c6] bg-white text-lg font-bold hover:border-[#0b3b2c]">−</button>
            <input type="range" min="0" max="30" step="5" value={incomeDrop} onChange={(e) => setIncomeDrop(clampIncome(e.target.value))} onInput={(e) => setIncomeDrop(clampIncome(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e3d9c6] accent-[#0b3b2c]" style={{ touchAction: "pan-x" }} />
            <button type="button" aria-label="Increase income drop" onClick={() => setIncomeDrop((v) => clampIncome(v + 5))} className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-[#e3d9c6] bg-white text-lg font-bold hover:border-[#0b3b2c]">+</button>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[#6f6355]"><span>0%</span><span>15%</span><span>30%</span></div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6f6355]">Rate hike</span>
            <span className="rounded-full bg-[#b97f1f] px-3 py-1 text-xs font-bold text-white">+{rateDelta}pp</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" aria-label="Decrease rate hike" onClick={() => setRateDelta((v) => clampRate(v - 1))} className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-[#e3d9c6] bg-white text-lg font-bold hover:border-[#0b3b2c]">−</button>
            <input type="range" min="0" max="3" step="1" value={rateDelta} onChange={(e) => setRateDelta(clampRate(e.target.value))} onInput={(e) => setRateDelta(clampRate(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e3d9c6] accent-[#b97f1f]" style={{ touchAction: "pan-x" }} />
            <button type="button" aria-label="Increase rate hike" onClick={() => setRateDelta((v) => clampRate(v + 1))} className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-[#e3d9c6] bg-white text-lg font-bold hover:border-[#0b3b2c]">+</button>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[#6f6355]"><span>+0pp</span><span>+1.5pp</span><span>+3pp</span></div>
        </div>
      </div>
      <ul className="mt-3 grid gap-2.5">
        {tile(incMeta, <>If income dropped {incomeDrop}%, free cash flow would be <b>{formatINR(inc.newFcf)}/month</b> — {inc.status === "pass" ? "your EMI still fits comfortably within the safe ceiling." : inc.status === "tight" ? "still potentially manageable, but close to the safe boundary." : "not affordable under the stress scenario."}</>)}
        {tile(rateMeta, <>If rates rose {rateDelta} {rateDelta === 1 ? "point" : "points"}, the same loan would cost <b>{formatINR(rate.newEmi)}/month</b> — {rate.status === "pass" ? "comfortably within safe affordability." : rate.status === "tight" ? "still potentially manageable, but close to or above the safe safety boundary." : "not affordable under the stress scenario."}</>)}
      </ul>
      <p className="mt-2.5 flex items-center gap-2 text-xs text-[#6f6355]">Ranges already reflect unknowns: <ConfBadge level={confidence.level} /></p>
    </OutputCard>
  );
}
