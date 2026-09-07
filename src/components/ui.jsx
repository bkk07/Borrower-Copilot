// Shared brand bits: logo, header, footer, badges.
function Mark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="10" fill="url(#bc-mark)" />
      <path d="M11 18.2 L15.6 22.8 L25.2 13.2" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 27.5 L14 27.5 M22 8.5 L22 8.5" stroke="white" strokeOpacity="0.0" />
      <defs>
        <linearGradient id="bc-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b3b2c" />
          <stop offset="100%" stopColor="#1d6b4d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={36} />
      <span className={`font-display text-xl font-semibold leading-none ${light ? "text-white" : ""}`}>
        Borrower Copilot
      </span>
    </span>
  );
}

export function Header({ onHome, onCta, ctaLabel = "Check my loan" }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-[#e3d9c6] bg-[#f7f3ec]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <button type="button" onClick={onHome} className="cursor-pointer border-none bg-transparent p-0" aria-label="Home">
          <Logo />
        </button>
        <div className="flex items-center gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#6f6355] hover:text-black sm:block">
            How it works
          </a>
          <button
            type="button"
            onClick={onCta}
            className="cursor-pointer rounded-xl bg-[#0b3b2c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#072a1f]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#e3d9c6] bg-[#efe8da]">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 text-sm text-[#6f6355] md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 leading-relaxed">
            The missing voice on the borrower's side. Ranges, not false precision — and an honest "don't borrow" when the numbers say so.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#1c1611]">What we never do</p>
          <ul className="mt-2 space-y-1">
            <li>No login, no bureau pull, nothing stored</li>
            <li>No single "exact" number — every output is a range</li>
            <li>"I don't know" is never scored as zero</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[#1c1611]">Built on</p>
          <ul className="mt-2 space-y-1">
            <li>FOIR-style affordability + LAP loan-to-value norms</li>
            <li>Every assumption listed in RULES.md</li>
            <li>Not a substitute for real underwriting</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function ConfBadge({ level }) {
  const map = {
    High: { background: "#e3f1e6", color: "#176b3f", borderColor: "#9fd0ab" },
    Medium: { background: "#faecd2", color: "#9a5b0b", borderColor: "#e8c877" },
    Low: { background: "#f9e2df", color: "#a4261f", borderColor: "#e8a49e" },
  };
  const s = map[level] ?? map.Medium;
  return (
    <span className="inline-block rounded-full border px-3 py-1 text-xs font-bold" style={s}>
      {level} confidence
    </span>
  );
}
