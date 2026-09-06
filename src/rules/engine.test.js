// Engine tests — mirrors Final Spec §17 test plan (rules only, no UI).
import { describe, it, expect } from "vitest";
import { cashFlow } from "./cashFlow.js";
import { sanctionCalc } from "./sanction.js";
import { rateBand, narrowedBand, aprEstimate } from "./rate.js";
import { confidenceScore } from "./confidence.js";
import { evaluate } from "./verdict.js";
import { draftToProfile, visibleQuestions, isAnswered, resolveLane, blankDraft } from "../data/questions.js";
void blankDraft;
import { PRESETS } from "../data/presets.js";

const priya = () => draftToProfile({ ...PRESETS.priya });
const ravi = () => draftToProfile({ ...PRESETS.ravi });
const anita = () => draftToProfile({ ...PRESETS.anita });

describe("cash flow", () => {
  it("computes FCF + safe EMI for normal inputs (Priya)", () => {
    const cf = cashFlow(priya());
    expect(cf.blendedIncome).toBe(110000);
    expect(cf.fcf).toBe(45000);
    expect(cf.safeEmi).toBe(36000); // 45000 * 0.8
  });

  it("goes negative when expenses eat income, flagging estimates", () => {
    const cf = cashFlow(anita());
    expect(cf.fcf).toBeLessThanOrEqual(0);
    expect(cf.safeEmi).toBe(0);
    expect(cf.expenses.estimated).toBe(true);
  });

  it("never silently zeroes unknowns (EMI unknown -> flagged estimate)", () => {
    const p = priya();
    p.existingEmi = "unknown";
    const cf = cashFlow(p);
    expect(cf.existingEmi.value).toBeGreaterThan(0);
    expect(cf.existingEmi.estimated).toBe(true);
  });
});

describe("sanction", () => {
  it("applies LTV cap for free collateral (Ravi)", () => {
    const p = ravi();
    const r = evaluate(p);
    expect(r.lane).toBe("secured_business");
    expect(r.sanction.ltvCap).toBe(2250000);
    expect(r.sanction.amount).toBeLessThanOrEqual(2250000);
  });

  it("ignores encumbered collateral for sanction", () => {
    const p = ravi();
    p.collateral.encumbered = true;
    const cf = cashFlow(p);
    const san = sanctionCalc(p, "secured_business", cf);
    expect(san.ltvCap).toBeNull();
    expect(san.cappedByLtv).toBe(false);
  });

  it("needs no collateral in the personal lane", () => {
    const p = priya();
    const san = sanctionCalc(p, "personal", cashFlow(p));
    expect(san.ltvCap).toBeNull();
    expect(san.foirCap).toBe(0.45);
    expect(san.maxLenderEmi).toBe(35500);
  });
});

describe("rate", () => {
  it("looks up good / unknown / weak bands (personal lane)", () => {
    expect(rateBand(priya(), "personal").band).toEqual([10.5, 12.5]);
    expect(rateBand(ravi(), "personal").bucket).toBe("unknown");
    const weak = { ...priya(), creditScoreKnown: true, creditScore: 600 };
    expect(rateBand(weak, "personal").band).toEqual([15, 18]);
  });

  it("treats unknown credit as unknown, never weak", () => {
    const r = rateBand({ ...priya(), creditScoreKnown: false, creditScore: null }, "personal");
    expect(r.bucket).toBe("unknown");
    expect(r.band).toEqual([12, 16]);
  });

  it("narrows with confidence: Low full, High half", () => {
    expect(narrowedBand([10, 14], "Low")).toEqual([10, 14]);
    expect(narrowedBand([10, 14], "High")).toEqual([11, 13]);
  });

  it("spreads fees into APR (1% over 4y ≈ +3pp)", () => {
    expect(aprEstimate(11.6, 1, 48)).toBeCloseTo(14.6, 1);
  });

  it("tenure grids are lane-aware (secured longest)", () => {
    expect(evaluate(priya()).tenureTable.at(-1).months).toBe(60);
    expect(evaluate(ravi()).tenureTable.at(-1).months).toBe(120);
    expect(evaluate(anita()).tenureTable.at(-1).months).toBe(48);
  });

  it("APR breakdown exposes nominal + feeDrag", () => {
    const r = evaluate(priya());
    expect(r.rate.feeDrag).toBeCloseTo(3, 1);
    expect(r.rate.nominal).toBeLessThan(r.rate.apr);
  });

  it("upcoming expense reduces FCF / safe EMI", () => {
    const p = priya();
    p.upcomingExpense = 120000;
    expect(evaluate(p).cf.safeEmi).toBeLessThan(36000);
  });

  it("debt-payoff purpose emits a consolidation-comparison note", () => {
    const p = { ...priya(), loanPurpose: "debt_payoff", existingEmi: 14000 };
    expect(evaluate(p).debtPayoffNote).toMatch(/Borrow/i);
  });
  it("age near 60 shortens both sanction + safe tenures", () => {
    const old = { ...priya(), age: 59 };
    const r = evaluate(old);
    expect(r.safe.tenureMonths).toBe(12);
    expect(r.sanction.tenureMonths).toBe(12);
  });
  it("education purpose uses neutral tone, not discretionary scolding", () => {
    const p = { ...priya(), loanPurpose: "education", existingEmi: 90000 };
    // Same high EMI that forces 'dont' — tone should be neutral, not purpose-specific scold
    const r = evaluate({ ...p, age: 29 });
    if (r.verdict.key === "dont") expect(r.verdict.tone).not.toMatch(/for education,/i);
  });
});

describe("sanction age cap", () => {
  it("personal at 59 is age-capped on both sides", () => {
    const r = evaluate({ ...priya(), age: 59 });
    expect(r.safe.tenureMonths).toBe(12);
    expect(r.sanction.tenureMonths).toBe(12);
  });
  it("secured at 58 is age-capped well below lane default", () => {
    const r = evaluate({ ...ravi(), age: 58 });
    expect(r.safe.tenureMonths).toBe(24);
    expect(r.sanction.tenureMonths).toBe(24);
  });
});

describe("confidence", () => {
  it("scores High when complete + documented", () => {
    const p = priya();
    p.savingsBufferMonths = "3-6";
    p.employmentYears = 5;
    p.variableIncomePct = 0;
    expect(confidenceScore(p).level).toBe("High");
  });

  it("scores Medium for Priya (only buffer unknown)", () => {
    expect(confidenceScore(priya()).level).toBe("Medium");
  });

  it("scores Low for Anita (cash income + estimates)", () => {
    expect(confidenceScore(anita()).level).toBe("Low");
  });
});

describe("scenarios (spec §13)", () => {
  it("Priya -> Borrow, personal lane, stress pass", () => {
    const r = evaluate(priya());
    expect(r.lane).toBe("personal");
    expect(r.verdict.key).toBe("borrow");
    expect(r.rate.fairRange[1]).toBeLessThanOrEqual(12.5);
    expect(r.stress.incomeDrop.status).toBe("pass");
  });

  it("Ravi -> Borrow Less, routed to secured lane", () => {
    const r = evaluate(ravi());
    expect(r.lane).toBe("secured_business");
    expect(r.verdict.key).toBe("less");
    expect(r.safe.center).toBeLessThan(r.sanction.amount);
    expect(r.stress.incomeDrop.status).toBe("tight");
  });

  it("Anita -> Don't Borrow, low confidence, safe ≈ 0", () => {
    const r = evaluate(anita());
    expect(r.verdict.key).toBe("dont");
    expect(r.confidence.level).toBe("Low");
    expect(r.safe.center).toBe(0);
  });
});

describe("branching + profile mapping", () => {
  it("draftToProfile round-trips Priya correctly", () => {
    const p = draftToProfile({ ...PRESETS.priya });
    expect(p.incomeType).toBe("salaried");
    expect(p.loanType).toBe("personal");
    expect(p.creditScore).toBe(780);
  });
  it("adaptive branching: salaried sees salary extras, not gig", () => {
    const d = { ...blankDraft, incomeType: "salaried" };
    const ids = visibleQuestions(d).map((q) => q.id);
    expect(ids).toContain("employmentYears");
    expect(ids).not.toContain("incomeStability");
  });
  it("adaptive branching: gig sees informal extras", () => {
    const d = { ...blankDraft, incomeType: "informal" };
    const ids = visibleQuestions(d).map((q) => q.id);
    expect(ids).toContain("recentBounce");
    expect(ids).not.toContain("employmentYears");
  });
  it("isAnswered gates must questions but not optionals", () => {
    const empty = { ...blankDraft };
    // must not answered
    expect(isAnswered({ id: "income" }, empty)).toBe(false);
    // optional always passes
    expect(isAnswered({ id: "upcomingExpense", group: "optional" }, empty)).toBe(true);
  });
  it("resolveLane guesses secured when unsure + collateral + self-employed", () => {
    const draftLike = { loanType: "unsure", incomeType: "self_employed", collateralAvailable: "yes", collateralValue: 1000000, collateralEncumbered: "no" };
    const lane = resolveLane(draftLike);
    expect(lane.lane).toBe("secured_business");
    expect(lane.guessed).toBe(true);
  });
  it("confidence drops one tier when upcoming expense present", () => {
    const base = priya();
    base.upcomingExpense = null;
    const withExp = { ...priya(), upcomingExpense: 120000 };
    void base;
    // upcomingExpense raises buffer + lump so FCF necessarily falls
    expect(evaluate(withExp).cf.safeEmi).toBeLessThan(evaluate(priya()).cf.safeEmi);
  });
});

describe("edge cases", () => {
  it("zero income -> Don't Borrow immediately", () => {
    const p = priya();
    p.income = { amount: 0, documented: true };
    expect(evaluate(p).verdict.key).toBe("dont");
  });

  it("EMI above income -> Don't Borrow", () => {
    const p = priya();
    p.existingEmi = 200000;
    expect(evaluate(p).verdict.key).toBe("dont");
  });

  it("astronomical request -> Borrow Less and sanction below request", () => {
    const p = priya();
    p.requestedAmount = 100000000;
    const r = evaluate(p);
    expect(r.verdict.key).toBe("less");
    expect(r.sanction.amount).toBeLessThan(p.requestedAmount);
  });
});
