import { describe, expect, it } from "vitest";
import { meteringCtBurden } from "./metering-ct-burden";

/** Default worked example from the "Metering CT Burden" sheet (v1.2). */
const sheetExample = {
  loadCapacityVa: 50e6, // 50 MVA
  voltageV: 33e3, // 33 kV
  voltageDeviationPu: 0.94,
  ctPrimaryA: 1000,
  ctSecondaryA: 1,
  wiringLengthM: 40,
  wiringCsaMm2: 2.5,
  meterResistanceOhm: 0.1,
  extraResistanceOhm: 0,
  ratedBurdenVa: 10,
};

describe("meteringCtBurden", () => {
  it("matches the workbook worked example", () => {
    const r = meteringCtBurden(sheetExample);
    expect(r.loadCurrentA).toBeCloseTo(930.60971822957094, 5);
    expect(r.secondaryCurrentA).toBeCloseTo(0.93060971822957095, 8);
    expect(r.wiringResistanceOhm).toBeCloseTo(0.2752, 6);
    expect(r.wiringBurdenVa).toBeCloseTo(0.23833267999694605, 8);
    expect(r.meterBurdenVa).toBeCloseTo(0.086603444766332138, 8);
    expect(r.extraBurdenVa).toBeCloseTo(0, 8);
    expect(r.circuitBurdenVa).toBeCloseTo(0.32493612476327816, 8);
    expect(r.minBurdenVa).toBeCloseTo(2.5, 8);
    expect(r.maxBurdenVa).toBeCloseTo(10, 8);
  });

  it("flags the workbook default as under-burdened (< 25 % of rated)", () => {
    const r = meteringCtBurden(sheetExample);
    expect(r.status).toBe("under");
    expect(r.adequate).toBe(false);
    expect(r.percentOfRated).toBeLessThan(25);
  });

  it("is adequate when the rated burden matches the circuit burden", () => {
    // Circuit burden ≈ 0.325 VA; a 0.5 VA rated CT puts it in the 25–100 % band.
    const r = meteringCtBurden({ ...sheetExample, ratedBurdenVa: 0.5 });
    expect(r.status).toBe("ok");
    expect(r.adequate).toBe(true);
  });

  it("flags an over-burdened circuit", () => {
    const r = meteringCtBurden({ ...sheetExample, ratedBurdenVa: 0.1 });
    expect(r.status).toBe("over");
    expect(r.percentOfRated).toBeGreaterThan(100);
  });

  it("rejects a non-positive rated burden", () => {
    expect(() => meteringCtBurden({ ...sheetExample, ratedBurdenVa: 0 })).toThrow();
  });
});
