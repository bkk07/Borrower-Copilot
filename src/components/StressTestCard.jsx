import OutputCard from "./OutputCard.jsx";
import { ConfBadge } from "./ui.jsx";
import { formatINR } from "../rules/finance.js";

export default function StressTestCard({ stress, confidence }) {
  const inc = stress.incomeDrop;
  const rate = stress.rateRise;
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
  return (
    <OutputCard
      kicker="Stress test"
      title="What if things get worse?"
      badge={<span className="text-xs font-semibold text-[#6f6355]">2 fixed scenarios</span>}
      why="Income −20% recomputes free cash flow against the EMI your loan actually needs. Rate +2pp recomputes the EMI on the same safe amount. Fixed scenarios, not a full simulator."
      delay={2}
    >
      <ul className="grid gap-2.5">
        {tile(incMeta, <>If income dropped 20%, free cash flow would be <b>{formatINR(inc.newFcf)}/month</b> — {inc.status === "pass" ? "your EMI still fits comfortably within the safe ceiling." : inc.status === "tight" ? "still potentially manageable, but close to the safe boundary." : "not affordable under the stress scenario."}</>)}
        {tile(rateMeta, <>If rates rose 2 points, the same loan would cost <b>{formatINR(rate.newEmi)}/month</b> — {rate.status === "pass" ? "comfortably within safe affordability." : rate.status === "tight" ? "still potentially manageable, but close to or above the safe safety boundary." : "not affordable under the stress scenario."}</>)}
      </ul>
      <p className="mt-2.5 flex items-center gap-2 text-xs text-[#6f6355]">Ranges already reflect unknowns: <ConfBadge level={confidence.level} /></p>
    </OutputCard>
  );
}
