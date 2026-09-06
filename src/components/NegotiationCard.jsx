import { useState } from "react";
import { Logo } from "./ui.jsx";
import { fmtRangeLakh, formatINR } from "../rules/finance.js";

// result-aware: styled rows + plain fallback for clipboard/share
export default function NegotiationCard({ result, text }) {
  const fallback = text || result?.card;
  const copyText = fallback;
  const hasResult = !!result;
  const r = result;
  const rows = hasResult ? [
    ["Profile", `${r.profile?.incomeType?.replace("_", " ") ?? r.routing?.lane ?? ""} · ${r.cf ? `${formatINR(r.cf.blendedIncome)}/mo` : ""} · Credit: ${r.profile?.creditScoreKnown ? r.profile?.creditScore : "unknown"}`],
    ["Asked for", `${formatINR(r.profile?.requestedAmount)} for ${r.verdict?.key ?? ""}`],
    ["Bank might offer", fmtRangeLakh(r.sanction.range)],
    ["Safe for you", fmtRangeLakh(r.safe.range)],
    ["Fair rate", `${r.rate.fairRange[0]}–${r.rate.fairRange[1]}%`],
    ["Real cost (APR)", `~${r.rate.apr}%`],
    ["Max EMI", `${formatINR(r.cf.safeEmi)}/mo`],
    ["Confidence", r.confidence.level],
  ] : null;
  const waText = encodeURIComponent(copyText);
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };
  const doShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Borrower Copilot — negotiation card", text: copyText });
        return;
      }
    } catch { /* user cancelled — fall through to copy */ }
    return doCopy();
  };
  return (
    <section id="negotiation-card" className="overflow-hidden rounded-2xl bg-[#0b3b2c] text-white shadow-xl">
      <div className="flex items-center justify-between p-5 pb-0">
        <Logo light />
        <span className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-100">Take to bank</span>
      </div>
      <div className="mx-5 my-3 h-[3px] rounded bg-gradient-to-r from-[#b97f1f] via-[#e8c877] to-transparent" />
      {hasResult && rows ? (
        <div className="mx-5 grid gap-1 rounded-xl bg-black/25 p-4 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[10rem_1fr] gap-2 border-b border-white/10 py-1.5 last:border-0">
              <span className="font-bold uppercase tracking-widest text-white/60">{k}</span>
              <span className="font-mono text-emerald-50">{v}</span>
            </div>
          ))}
          <p className="mt-2 text-[12px] leading-relaxed text-emerald-50"><span className="font-bold text-white">Why: </span>{r.verdict.reason}</p>
          {r.lenderComparison && <p className="text-[12px] text-amber-200">{r.lenderComparison.text}</p>}
        </div>
      ) : (
        <pre className="mx-5 whitespace-pre-wrap rounded-xl bg-black/25 p-4 font-mono text-[12.5px] leading-relaxed text-emerald-50">{fallback}</pre>
      )}
      <div className="no-print flex flex-wrap gap-2 p-5 pt-3">
        <button type="button" onClick={doCopy} className="flex-1 cursor-pointer rounded-xl bg-[#b97f1f] py-3 text-sm font-bold text-white hover:brightness-110">
          {copied ? "Copied ✓" : "⧉ Copy"}
        </button>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 cursor-pointer rounded-xl border border-white/40 bg-white/10 py-3 text-center text-sm font-bold text-white hover:bg-white/20"
        >
          Share on WhatsApp
        </a>
        <button type="button" onClick={doShare} className="flex-1 cursor-pointer rounded-xl border border-white/40 py-3 text-sm font-bold text-white hover:bg-white/10">
          Share · Print
        </button>
        <button type="button" onClick={() => window.print()} className="flex-1 cursor-pointer rounded-xl border border-white/40 py-3 text-sm font-bold text-white hover:bg-white/10">
          🖨 Print
        </button>
      </div>
    </section>
  );
}
