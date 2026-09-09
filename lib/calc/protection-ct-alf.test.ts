import { describe, expect, it } from "vitest";
import { protectionCtAlf } from "./protection-ct-alf";

/** Default worked example from the "Protection CT ALF" sheet (v1.2). */
const sheetExample = {
  ctPrimaryA: 600,
  ctSecondaryA: 1,
  ratedAlf: 20,
  minFaultCurrentA: 31500,
  ratedBurdenVa: 15,
  ctResistanceOhm: 3,
  relayResistanceOhm: 0.1,
  wiringLengthM: 40,
  wiringCsaMm2: 2.5,
  safetyFactor: 2,
};

describe("protectionCtAlf", () => {
  it("matches the workbook worked example", () => {
    const r = protectionCtAlf(sheetExample);
    expect(r.wiringResistanceOhm).toBeCloseTo(0.5504, 4);
    expect(r.alfRequired).toBeCloseTo(105, 6);
    expect(r.alfSeen).toBeCloseTo(98.619329388560161, 6);
    // ALFs (98.6) < ALFr (105): the sheet's default CT is NOT adequate.
    expect(r.adequate).toBe(false);
    expect(r.margin).toBeCloseTo(98.619329388560161 - 105, 6);
  });

  it("becomes adequate with a higher rated ALF (5P40)", () => {
    const r = protectionCtAlf({ ...sheetExample, ratedAlf: 40 });
    expect(r.alfSeen).toBeGreaterThan(r.alfRequired);
    expect(r.adequate).toBe(true);
  });

  it("required ALF scales with the safety factor and fault ratio", () => {
    const r = protectionCtAlf(sheetExample);
    expect(r.alfRequired).toBeCloseTo(2 * (31500 / 600), 6);
  });

  it("shorter, thicker leads raise the effective ALF", () => {
    const base = protectionCtAlf(sheetExample);
    const better = protectionCtAlf({
      ...sheetExample,
      wiringLengthM: 10,
      wiringCsaMm2: 4,
    });
    expect(better.wiringResistanceOhm).toBeLessThan(base.wiringResistanceOhm);
    expect(better.alfSeen).toBeGreaterThan(base.alfSeen);
  });

  it("rejects a non-positive CT primary", () => {
    expect(() => protectionCtAlf({ ...sheetExample, ctPrimaryA: 0 })).toThrow();
  });

  it("rejects rated ALF, safety factor, and CSA outside sensible ranges", () => {
    expect(() => protectionCtAlf({ ...sheetExample, ratedAlf: 0 })).toThrow(/Rated ALF/);
    expect(() => protectionCtAlf({ ...sheetExample, ratedAlf: 250 })).toThrow(/Rated ALF/);
    expect(() => protectionCtAlf({ ...sheetExample, safetyFactor: 0 })).toThrow(/Safety factor/);
    expect(() => protectionCtAlf({ ...sheetExample, safetyFactor: 20 })).toThrow(/Safety factor/);
    expect(() => protectionCtAlf({ ...sheetExample, wiringCsaMm2: 0 })).toThrow(
      /Wiring cross-section/,
    );
    expect(() => protectionCtAlf({ ...sheetExample, wiringCsaMm2: 2000 })).toThrow(
      /Wiring cross-section/,
    );
    expect(() => protectionCtAlf({ ...sheetExample, wiringLengthM: -1 })).toThrow(
      /Wiring length must be ≥ 0/,
    );
  });
});
