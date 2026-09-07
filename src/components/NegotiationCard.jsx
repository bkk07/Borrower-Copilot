import { useState } from "react";
import { Logo } from "./ui.jsx";
import { fmtRangeLakh, formatINR } from "../rules/finance.js";

// result-aware: styled rows + plain fallback for clipboard/share
export default function NegotiationCard({ result, text }) {
  const fallback = text || result?.card;
  const copyText = fallback;
  const hasResult = !!result;
  const r = result;
  const feeHint = r?.rate?.feePct ? `~${r.rate.feePct}%` : "per lender";
  void feeHint;
  const negotiationLine =
    r && r.rate?.fairRange
      ? `Could you offer ≤${r.rate.fairRange[1]}% at ~${r.rate.feePct ?? 1}% fee? My fair range is ${r.rate.fairRange[0]}–${r.rate.fairRange[1]}%.`
      : null;
  const rows = hasResult ? [
    ["Requested", fmtRangeLakh([r.profile?.requestedAmount, r.profile?.requestedAmount])],
    ["Possible lender range", fmtRangeLakh(r.sanction.range)],
    ["Safer borrowing range", fmtRangeLakh(r.safe.range)],
    ["Fair rate estimate", `${r.rate.fairRange[0]}–${r.rate.fairRange[1]}%`],
    ["Approx. all-in annual cost", `~${r.rate.apr}%`],
    ["Requested-loan EMI", `~${formatINR(r.emiNeeded)}/month`],
    ["Maximum comfortable EMI", `~${formatINR(r.cf.safeEmi)}/month`],
    ["Why", r.verdict.reason],
    ["Confidence", r.confidence.level],
  ] : null;
  void encodeURIComponent(copyText);
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
  const saveImage = () => {
    const w = 900, h = 520, pad = 32;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // background
    ctx.fillStyle = "#0b3b2c"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 18); ctx.fill();
    // accent line
    const grad = ctx.createLinearGradient(pad, 0, w - pad, 0);
    grad.addColorStop(0, "#b97f1f"); grad.addColorStop(1, "rgba(185,127,31,0)");
    ctx.fillStyle = grad; ctx.fillRect(pad + 16, pad + 54, w - pad * 2 - 32, 3);
    // title
    ctx.fillStyle = "white"; ctx.font = "700 22px Inter, sans-serif"; ctx.fillText("BORROWER NEGOTIATION CARD", pad + 16, pad + 36);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "600 10px Inter, sans-serif"; ctx.fillText("Take to bank  •  Borrower Copilot", pad + 16, pad + 48);
    // rows
    const rows = hasResult ? [
      ["Requested", fmtRangeLakh([r.profile?.requestedAmount, r.profile?.requestedAmount])],
      ["Possible lender range", fmtRangeLakh(r.sanction.range)],
      ["Safer borrowing range", fmtRangeLakh(r.safe.range)],
      ["Fair rate", `${r.rate.fairRange[0]}–${r.rate.fairRange[1]}%`],
      ["Approx. all-in", `~${r.rate.apr}%`],
      ["Requested EMI", `~${formatINR(r.emiNeeded)}/mo`],
      ["Max comfortable EMI", `~${formatINR(r.cf.safeEmi)}/mo`],
    ] : [["Card", copyText.slice(0, 60)]];
    let y = pad + 86;
    ctx.font = "12px Inter, sans-serif";
    for (const [k, v] of rows) {
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "700 10px Inter, sans-serif"; ctx.fillText(k.toUpperCase(), pad + 16, y);
      ctx.fillStyle = "white"; ctx.font = "600 13px monospace"; ctx.fillText(String(v), pad + 180, y);
      y += 24; ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(pad + 16, y, w - pad * 2 - 32, 1); y += 12;
    }
    ctx.fillStyle = "#e8c877"; ctx.font = "600 11px Inter, sans-serif";
    const line = r?.rate?.fairRange ? `Could you offer ≤${r.rate.fairRange[1]}% at ~${r.rate.feePct ?? 1}% fee?` : "";
    if (line) { ctx.fillText(line, pad + 16, y + 6); }
    const url = c.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = "borrower-negotiation-card.png"; a.click();
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
          {negotiationLine ? <p className="mt-2 rounded bg-white/10 p-2 text-[12px] font-semibold text-amber-200">💬 {negotiationLine} <span className="font-normal text-emerald-50">(Approx. all-in cost is an estimate — actual APR depends on the lender's fees.)</span></p> : null}
          {r.rate?.fairRange ? <p className="mt-2 rounded bg-white/10 p-2 text-[12px] text-emerald-50">If they say 14%, reply: <span className="font-semibold text-white">"My fair range is {r.rate.fairRange[0]}–{r.rate.fairRange[1]}%, and my max comfortable EMI is {formatINR(r.cf.safeEmi)}/mo. Can we structure to that?"</span></p> : null}
          {r.lenderComparison && <p className="text-[12px] text-amber-200">{r.lenderComparison.text}</p>}
        </div>
      ) : (
        <pre className="mx-5 whitespace-pre-wrap rounded-xl bg-black/25 p-4 font-mono text-[12.5px] leading-relaxed text-emerald-50">{fallback}</pre>
      )}
      <div className="no-print flex gap-2 p-5 pt-3">
        <div className="relative flex-1">
          <button type="button" onClick={doCopy} className="w-full cursor-pointer rounded-xl bg-[#b97f1f] py-3 text-sm font-bold text-white hover:brightness-110">
            {copied ? "Copied ✓" : "Copy card"}
          </button>
          {copied ? <span key={copied ? "t" : "f"} className="bc-toast pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[#1c1611] px-3 py-1 text-xs font-bold text-white shadow">Copied to clipboard</span> : null}
        </div>
        <button type="button" onClick={saveImage} className="flex-1 cursor-pointer rounded-xl bg-white py-3 text-sm font-bold text-[#0b3b2c] hover:bg-emerald-50">
          Save as Image
        </button>
        <button type="button" onClick={() => { doShare(); }} className="flex-1 cursor-pointer rounded-xl border border-white/40 bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20">
          Print / Save
        </button>
      </div>
    </section>
  );
}
