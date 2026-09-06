import { ConfBadge } from "./ui.jsx";

export default function OutputCard({ kicker, title, badge, children, why, delay = 0 }) {
  return (
    <section className={`bc-card anim-rise-${Math.min(delay, 3)} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="bc-eyebrow">{kicker}</p>
          <h3 className="font-display mt-0.5 text-[1.35rem] font-semibold leading-snug">{title}</h3>
        </div>
        {badge ?? <ConfBadge level="Medium" />}
      </div>
      <div className="mt-3 text-[15px] leading-relaxed">{children}</div>
      {why && (
        <details className="bc-details mt-3 rounded-xl bg-[#faf5ea] p-3">
          <summary>Why this number? One sentence.</summary>
          <p>{why}</p>
        </details>
      )}
    </section>
  );
}
