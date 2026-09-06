import { useState } from "react";
import { Logo } from "./ui.jsx";

export default function NegotiationCard({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };
  return (
    <section className="overflow-hidden rounded-2xl bg-[#0b3b2c] text-white shadow-xl">
      <div className="flex items-center justify-between p-5 pb-0">
        <Logo light />
        <span className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-100">Take to bank</span>
      </div>
      <div className="mx-5 my-3 h-[3px] rounded bg-gradient-to-r from-[#b97f1f] via-[#e8c877] to-transparent" />
      <pre className="mx-5 whitespace-pre-wrap rounded-xl bg-black/25 p-4 font-mono text-[12.5px] leading-relaxed text-emerald-50">{text}</pre>
      <div className="no-print flex gap-2 p-5 pt-3">
        <button type="button" onClick={copy} className="flex-1 cursor-pointer rounded-xl bg-[#b97f1f] py-3 text-sm font-bold text-white hover:brightness-110">
          {copied ? "Copied ✓" : "⧉ Copy card"}
        </button>
        <button type="button" onClick={() => window.print()} className="flex-1 cursor-pointer rounded-xl border border-white/40 py-3 text-sm font-bold text-white hover:bg-white/10">
          🖨 Print / save
        </button>
      </div>
    </section>
  );
}
