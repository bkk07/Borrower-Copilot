// Engine tests — mirrors Final Spec §17 test plan (rules only, no UI).
import { describe, it, expect } from "vitest";
import { cashFlow } from "./cashFlow.js";
import { sanctionCalc } from "./sanction.js";
import { rateBand, narrowedBand, aprEstimate } from "./rate.js";
import { confidenceScore } from "./confidence.js";
import { evaluate } from "./verdict.js";
import { draftToProfile } from "../data/questions.js";
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
