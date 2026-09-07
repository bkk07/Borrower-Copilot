import { useEffect, useMemo, useState } from "react";
import { blankDraft, draftToProfile, visibleQuestions, isAnswered } from "./data/questions.js";
import { PRESETS } from "./data/presets.js";
import { evaluate } from "./rules/verdict.js";
import { formatINR, fmtLakh } from "./rules/finance.js";
import QuestionInput from "./components/Questionnaire.jsx";
import ReviewAnswers from "./components/ReviewAnswers.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import { Header, Logo } from "./components/ui.jsx";

function tryEvaluate(draft) {
  try {
    const p = draftToProfile(draft);
    if (!p.requestedAmount) return null;
    return evaluate(p);
  } catch {
    return null;
  }
}

const PERSONAS = [
  { key: "priya", name: "Priya, 29", place: "Bengaluru · salaried", line: "₹1.1L/month, car EMI ₹14k, score 780. Wants ₹8L for a wedding.", expect: "Borrow — with room to spare" },
  { key: "ravi", name: "Ravi, 42", place: "Mysuru · kirana owner", line: "ITR ₹4.2L/yr + cash, owns ₹45L shop. Wants ₹15L for stock + vehicle.", expect: "Borrow Less — via the secured lane" },
  { key: "anita", name: "Anita, 35", place: "Hubballi · gig + tailoring", line: "₹26–30k/month, 3 app loans, a bounce last month. Wants ₹1.5L e-scooter.", expect: "Don't Borrow — fix old debt first" },
];

const OUTPUTS = [
  { k: "O1", t: "Should you borrow?", d: "A real verdict with a reason. “Don't borrow” is a legitimate, reachable answer.", i: "⚖️" },
  { k: "O2", t: "How much — two numbers", d: "What a bank will likely sanction vs. what you can safely carry. Often very different.", i: "💰" },
  { k: "O3", t: "A fair rate + real cost", d: "A band, not a point — plus APR with fees, so the lender's quote can be judged.", i: "📉" },
  { k: "O4", t: "The EMI ceiling", d: "The monthly number never to cross, the tenure trade-off, and one stress test.", i: "🛡️" },
];

export default function App() {
  const [step, setStep] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("bc_step") || "null");
      return ["welcome", "quiz", "review", "results"].includes(s) ? s : "welcome";
    } catch { return "welcome"; }
  });
  const [draft, setDraft] = useState(() => {
    try {
      const raw = localStorage.getItem("bc_draft");
      if (!raw) return blankDraft;
      const parsed = JSON.parse(raw);
      // migrate stale lender-offer keys from pre-removal builds
      const { existingLenderOfferRate, existingLenderOfferFee, existingLenderOfferTenure, ...rest } = parsed;
      void existingLenderOfferRate; void existingLenderOfferFee; void existingLenderOfferTenure;
      return { ...blankDraft, ...rest };
    } catch { return blankDraft; }
  });
  const [qIndex, setQIndex] = useState(() => {
    try {
      const v = Number(JSON.parse(localStorage.getItem("bc_qIndex") || "0"));
      return Number.isFinite(v) ? v : 0;
    } catch { return 0; }
  });

  // Persist across refresh / accidental close (no backend, no account).
  useEffect(() => { try { localStorage.setItem("bc_draft", JSON.stringify(draft)); } catch { /* ignore */ } }, [draft]);
  useEffect(() => { try { localStorage.setItem("bc_step", JSON.stringify(step)); } catch { /* ignore */ } }, [step]);
  useEffect(() => { try { localStorage.setItem("bc_qIndex", JSON.stringify(qIndex)); } catch { /* ignore */ } }, [qIndex]);

  const visible = useMemo(() => visibleQuestions(draft), [draft]);
  const q = visible[Math.min(qIndex, visible.length - 1)];
  const done = visible.filter((qq) => isAnswered(qq, draft)).length;
  const live = useMemo(() => (step === "quiz" || step === "review" ? tryEvaluate(draft) : null), [step, draft]);

  const startFresh = () => { localStorage.removeItem("bc_draft"); localStorage.removeItem("bc_step"); localStorage.removeItem("bc_qIndex"); setDraft(blankDraft); setQIndex(0); setStep("quiz"); window.scrollTo(0, 0); };
  const goHome = () => { setStep("welcome"); window.scrollTo(0, 0); };
  const loadPreset = (name) => { setDraft({ ...blankDraft, ...PRESETS[name] }); setQIndex(0); setStep("review"); window.scrollTo(0, 0); };

  const result = useMemo(() => {
    if (step !== "results") return null;
    try { return evaluate(draftToProfile(draft)); } catch (e) { console.error(e); return null; }
  }, [step, draft]);

  /* ================= WELCOME ================= */
  if (step === "welcome") {
    return (
      <div className="min-h-screen">
        <Header onHome={goHome} onCta={startFresh} />
        {/* HERO */}
        <section className="hero-grid border-b border-[#e3d9c6]">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
            <div className="anim-rise">
              <p className="bc-eyebrow">For Indian borrowers · No login · Free</p>
              <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.08] md:text-[3.4rem]">
                Banks tell you what <em className="text-[#0b3b2c]">they'll</em> give you. We tell you what's <em className="text-[#b97f1f]">safe</em> for you.
              </h1>
              <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-[#4a4238]">
                Answer ~12 smart questions about your money. Get four honest answers — should you borrow,
                how much is safe, what rate is fair, what EMI won't hurt you — plus a one-page card to hold up at the bank.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={startFresh} className="bc-btn-gold !w-auto flex-1 px-6">Check my loan →</button>
                <a href="#personas" className="bc-btn-ghost flex-1 text-center no-underline">See it on 3 borrowers</a>
              </div>
              <p className="mt-3 text-xs text-[#6f6355]">No login · nothing stored · ~3 minutes · works on a phone</p>
            </div>
            {/* sample card mock */}
            <div className="anim-rise-1">
              <div className="rotate-1 rounded-2xl bg-[#0b3b2c] p-[1px] shadow-2xl transition-transform hover:rotate-0">
                <div className="rounded-2xl bg-[#0b3b2c] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <Logo light />
                    <span className="rounded-full border border-white/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-100">Medium confidence</span>
                  </div>
                  <div className="my-3 h-px bg-gradient-to-r from-[#b97f1f] via-[#b97f1f]/40 to-transparent" />
                  <p className="font-display text-lg italic leading-snug text-emerald-50">"The ₹8,00,000 needs ~₹20,891/month — inside your safe EMI of ₹36,000."</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 font-mono text-[13px]">
                    <div><dt className="text-[10px] uppercase tracking-widest text-emerald-200/70">Possible sanction</dt><dd className="font-bold">₹13–18L</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-widest text-emerald-200/70">Safer range</dt><dd className="font-bold text-amber-200">₹12–16L</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-widest text-emerald-200/70">Fair rate</dt><dd className="font-bold">10.8–12.3%</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-widest text-emerald-200/70">Max EMI</dt><dd className="font-bold">₹36,000/mo</dd></div>
                  </dl>
                  <button type="button" onClick={startFresh} className="mt-4 w-full cursor-pointer rounded-xl bg-[#b97f1f] py-3 text-sm font-bold text-white hover:brightness-110">
                    Get your card in ~3 minutes →
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-[#6f6355]">Priya's real card, computed by the engine below</p>
            </div>
          </div>
          {/* stats strip */}
          <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-2 px-4 pb-10">
            {[["4", "outputs, not one number"], ["3", "loan lanes, routed automatically"], ["12–15", "questions, adaptive to you"]].map(([n, l]) => (
              <div key={l} className="bc-card p-3 text-center md:p-4">
                <p className="font-display text-2xl font-bold text-[#0b3b2c] md:text-3xl">{n}</p>
                <p className="text-xs text-[#6f6355] md:text-sm">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROBLEM */}
        <section className="mx-auto w-full max-w-5xl px-4 py-12">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bc-card anim-rise border-l-4 !border-l-[#a4261f] p-5">
              <p className="bc-eyebrow !text-[#a4261f]">The bank's number</p>
              <p className="font-display mt-1 text-2xl font-semibold">"You're approved for ₹17.9L at 14%."</p>
              <p className="mt-2 text-[15px] text-[#4a4238]">Sanction letters maximise what the <em>bank</em> can collect — no view of your comfort.</p>
            </div>
            <div className="bc-card anim-rise-1 border-l-4 !border-l-[#0b3b2c] p-5">
              <p className="bc-eyebrow !text-[#0b3b2c]">Your number</p>
              <p className="font-display mt-1 text-2xl font-semibold">"₹11.7L is safe. Above 12.3% — push back."</p>
              <p className="mt-2 text-[15px] text-[#4a4238]">Free-cash-flow maths on <em>your</em> side — with ranges that admit what we don't know.</p>
            </div>
          </div>
        </section>

        {/* OUTPUTS */}
        <section className="border-y border-[#e3d9c6] bg-[#efe8da]">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <p className="bc-eyebrow">What you walk away with</p>
            <h2 className="font-display mt-1 text-3xl font-semibold">Four answers. One card.</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {OUTPUTS.map((o, i) => (
                <div key={o.k} className={`bc-card p-5 anim-rise-${Math.min(i, 3)}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{o.i}</span>
                    <span className="rounded-md bg-[#0b3b2c] px-2 py-0.5 font-mono text-xs font-bold text-white">{o.k}</span>
                  </div>
                  <p className="mt-2 text-lg font-bold">{o.t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-[#4a4238]">{o.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="mx-auto w-full max-w-5xl px-4 py-12">
          <p className="bc-eyebrow">How it works</p>
          <h2 className="font-display mt-1 text-3xl font-semibold">Three minutes, zero paperwork</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {[["1", "Answer honestly", "Purpose, income, EMIs, expenses. Say “don't know” freely — it widens ranges, never punishes."], ["2", "We route + compute", "Salaried, shop-owner and gig paths differ. Bank sanction and safe amount are computed separately."], ["3", "Negotiate", "Copy or print your card. “Fair is 10.8–12.3%, because…” beats accepting the first offer."]].map(([n, t, d]) => (
              <li key={n} className="bc-card p-5">
                <span className="font-display text-3xl font-bold text-[#b97f1f]">{n}</span>
                <p className="mt-1 font-bold">{t}</p>
                <p className="mt-1 text-[15px] text-[#4a4238]">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* PERSONAS */}
        <section id="personas" className="border-t border-[#e3d9c6] bg-[#0b3b2c]">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <p className="bc-eyebrow !text-[#e8c877]">Proof, not promises</p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-white">Three borrowers. Three different truths.</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {PERSONAS.map((p) => (
                <div key={p.key} className="rounded-2xl bg-white/[.06] p-5 ring-1 ring-white/15 backdrop-blur">
                  <p className="font-display text-xl font-semibold text-white">{p.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/70">{p.place}</p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">{p.line}</p>
                  <p className={`mt-3 rounded-xl p-2.5 text-sm font-semibold ${p.key === "priya" ? "bg-emerald-900 text-emerald-100 ring-1 ring-emerald-700" : p.key === "ravi" ? "bg-amber-900 text-amber-100 ring-1 ring-amber-700" : "bg-red-900 text-red-100 ring-1 ring-red-700"}`}>{p.expect}</p>
                  <button type="button" onClick={() => loadPreset(p.key)} className="mt-3 w-full cursor-pointer rounded-xl bg-white py-2.5 text-sm font-bold text-[#0b3b2c] hover:bg-emerald-50">
                    Run {p.name.split(",")[0]}'s case →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-2xl px-4 py-14 text-center">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Know your numbers before you visit.</h2>
          <p className="mt-2 text-[#4a4238]">The best-informed person in the room should be you.</p>
          <button type="button" onClick={startFresh} className="bc-btn-primary mx-auto mt-5 !w-auto px-10">Check my loan →</button>
        </section>
      </div>
    );
  }

  /* ================= QUIZ ================= */
  if (step === "quiz") {
    const last = qIndex >= visible.length - 1;
    const canNext = isAnswered(q, draft);
    const pct = Math.round(((qIndex + 1) / visible.length) * 100);
    return (
      <div className="min-h-screen">
        <Header onHome={goHome} onCta={startFresh} ctaLabel="Restart" />
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_300px]">
          <div key={q?.id} className="anim-rise">
            <div role="status" aria-live="polite" className="flex items-center justify-between text-sm text-[#6f6355]">
              <span className="font-semibold">Question {qIndex + 1} of {visible.length}</span>
              <span>{done} answered · {pct}%</span>
            </div>
            <div className="bc-progress mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress"><div style={{ width: `${pct}%` }} /></div>
            <div className="bc-card mt-4 p-5 md:p-7">
              {q?.group !== "must" && (
                <span className="mb-2 inline-block rounded-full bg-[#efe8da] px-3 py-1 text-xs font-bold text-[#6f6355]">
                  {q?.group === "optional" ? "✦ Optional" : `✦ For ${q?.group?.replace("_", " ")} profiles`} · skip anytime
                </span>
              )}
              <h2 id="q-title" className="font-display text-2xl font-semibold leading-snug md:text-[1.7rem]">{q?.text}</h2>
              {q?.helper ? <p id="q-helper" className="mt-1 text-sm text-[#6f6355]">{q.helper}</p> : null}
              <div className="mt-4" aria-labelledby="q-title" aria-describedby={q?.helper ? "q-helper" : undefined}><QuestionInput q={q} draft={draft} setDraft={setDraft} /></div>
            </div>
            {!canNext && <p className="mt-2 text-sm font-medium text-[#9a5b0b]">Answer to continue{q.group !== "must" ? " — or Skip" : ""}.</p>}
            <div className="mt-4 flex gap-2 pb-10">
              <button type="button" disabled={qIndex === 0} onClick={() => { setQIndex((i) => Math.max(0, i - 1)); window.scrollTo(0, 0); }} className="bc-btn-ghost flex-1 !bg-white disabled:opacity-40">← Back</button>
              {q.group !== "must" && (
                <button type="button" onClick={() => { if (last) setStep("review"); else setQIndex((i) => i + 1); window.scrollTo(0, 0); }} className="bc-btn-ghost flex-1 !bg-white">Skip →</button>
              )}
              <button
                type="button" disabled={!canNext}
                onClick={() => { if (last) { setStep("review"); } else setQIndex((i) => Math.min(visible.length - 1, i + 1)); window.scrollTo(0, 0); }}
                className="bc-btn-primary flex-[2]"
              >
                {last ? "Review answers →" : "Continue →"}
              </button>
            </div>
          </div>
          {/* aside */}
          <aside className="no-print hidden md:block">
            <div className="sticky top-20 grid gap-3">
              <div className="bc-card p-4">
                <p className="bc-eyebrow">Why we ask</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#4a4238]">This helps us estimate what's comfortable for you. Every question changes your result in a small but meaningful way.</p>
              </div>
              <div className="rounded-2xl bg-[#0b3b2c] p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/70">Live estimate</p>
                {live && live.cf.blendedIncome > 0 ? (
                  <div className="mt-1 text-sm">
                    <p className="font-display text-xl font-semibold">{live.verdict.key === "borrow" ? "Looking borrowable" : live.verdict.key === "less" ? "Heading to borrow-less" : "Heading to don't-borrow"}</p>
                    <p className="mt-1 text-emerald-50/85">Safe EMI so far: <b>{formatINR(live.cf.safeEmi)}/mo</b></p>
                    <p className="text-emerald-50/85">Fair rate so far: <b>{live.rate.fairRange[0]}–{live.rate.fairRange[1]}%</b> · {live.confidence.level}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-emerald-50/85">Keep answering — your live verdict appears here once income + amount are in.</p>
                )}
              </div>
              <div className="bc-card p-4 text-sm text-[#4a4238]">
                Not sure? We widen the range. An answer like "I don't know" never counts as zero.
              </div>
            </div>
          </aside>
        </div>
        {/* mobile live strip */}
        {live && live.cf.blendedIncome > 0 && (
          <div className="no-print sticky bottom-0 border-t border-[#e3d9c6] bg-[#0b3b2c] px-4 py-2.5 text-white md:hidden">
            <p className="text-center text-[13px]">
              <b>Live:</b> {live.verdict.key === "borrow" ? "borrowable" : live.verdict.key === "less" ? "borrow less" : "at risk"} · safe EMI <b>{formatINR(live.cf.safeEmi)}</b> · {live.rate.fairRange[0]}–{live.rate.fairRange[1]}%
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ================= REVIEW ================= */
  if (step === "review") {
    return (
      <div className="min-h-screen">
        <Header onHome={goHome} onCta={startFresh} ctaLabel="Restart" />
        {live && (
          <div className="border-b border-[#e3d9c6] bg-[#0b3b2c] text-white">
            <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-200/70">Live preview</span>
              <span className="font-bold">{live.verdict.label}</span>
              <span>Safe EMI <b>{formatINR(live.cf.safeEmi)}</b></span>
              <span>Safe <b>{fmtLakh(live.safe.center)}</b></span>
              <span>Fair <b>{live.rate.fairRange[0]}–{live.rate.fairRange[1]}%</b></span>
            </div>
          </div>
        )}
        <ReviewAnswers
          draft={draft}
          onBack={() => { setStep("quiz"); setQIndex(visible.length - 1); window.scrollTo(0, 0); }}
          onEdit={(qid) => { const i = visible.findIndex((qq) => qq.id === qid); setQIndex(Math.max(0, i)); setStep("quiz"); window.scrollTo(0, 0); }}
          onSubmit={() => { setStep("results"); window.scrollTo(0, 0); }}
        />
      </div>
    );
  }

  /* ================= RESULTS ================= */
  if (!result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p>Something went wrong calculating. Please go back and check amounts.</p>
        <button type="button" onClick={() => setStep("review")} className="bc-btn-primary mt-3">← Back to answers</button>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Header onHome={goHome} onCta={startFresh} ctaLabel="New check" />
      <ResultsScreen
        result={result}
        profile={draftToProfile(draft)}
        onRestart={() => { setDraft(blankDraft); setQIndex(0); setStep("welcome"); window.scrollTo(0, 0); }}
        onEdit={() => { setStep("review"); window.scrollTo(0, 0); }}
      />
    </div>
  );
}
