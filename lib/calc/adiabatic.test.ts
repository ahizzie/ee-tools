import { describe, expect, it } from "vitest";
import {
  adiabaticKFactor,
  adiabaticMinSection,
} from "./adiabatic";

describe("adiabaticKFactor", () => {
  it("gives IEC copper PVC k ≈ 115 (70 → 160 °C)", () => {
    const k = adiabaticKFactor({
      material: "copper",
      initialTempC: 70,
      finalTempC: 160,
    });
    expect(k).toBeCloseTo(115, 0);
  });

  it("gives IEC copper XLPE k ≈ 143 (90 → 250 °C)", () => {
    const k = adiabaticKFactor({
      material: "copper",
      initialTempC: 90,
      finalTempC: 250,
    });
    expect(k).toBeCloseTo(143, 0);
  });

  it("gives IEC aluminium PVC k ≈ 76 (70 → 160 °C)", () => {
    const k = adiabaticKFactor({
      material: "aluminium",
      initialTempC: 70,
      finalTempC: 160,
    });
    expect(k).toBeCloseTo(76, 0);
  });

  it("gives IEC aluminium XLPE k ≈ 94 (90 → 250 °C)", () => {
    const k = adiabaticKFactor({
      material: "aluminium",
      initialTempC: 90,
      finalTempC: 250,
    });
    expect(k).toBeCloseTo(94, 0);
  });

  it("rejects a final temperature not above the initial", () => {
    expect(() =>
      adiabaticKFactor({
        material: "copper",
        initialTempC: 160,
        finalTempC: 160,
      }),
    ).toThrow(/Final temperature/);
  });
});

describe("adiabaticMinSection", () => {
  it("sizes copper PVC for 10 kA, 1 s (S = I√t / k)", () => {
    const k = adiabaticKFactor({
      material: "copper",
      initialTempC: 70,
      finalTempC: 160,
    });
    const result = adiabaticMinSection({
      currentA: 10_000,
      durationS: 1,
      k,
    });
    expect(result.sectionMm2).toBeCloseTo(10_000 / k, 8);
    expect(result.energyLetThroughA2s).toBeCloseTo(1e8, 4);
    expect(result.durationExceedsAdiabaticLimit).toBe(false);
    expect(result.equation).toBe("S = I · √t / k");
  });

  it("sizes copper XLPE for 20 kA, 0.2 s", () => {
    const k = adiabaticKFactor({
      material: "copper",
      initialTempC: 90,
      finalTempC: 250,
    });
    const result = adiabaticMinSection({
      currentA: 20_000,
      durationS: 0.2,
      k,
    });
    expect(result.sectionMm2).toBeCloseTo((20_000 * Math.sqrt(0.2)) / k, 8);
  });

  it("flags durations longer than 5 s", () => {
    const result = adiabaticMinSection({
      currentA: 1000,
      durationS: 6,
      k: 115,
    });
    expect(result.durationExceedsAdiabaticLimit).toBe(true);
    expect(result.sectionMm2).toBeCloseTo((1000 * Math.sqrt(6)) / 115, 8);
  });

  it("rejects non-positive current, time, or k", () => {
    expect(() =>
      adiabaticMinSection({ currentA: 0, durationS: 1, k: 115 }),
    ).toThrow(/current/);
    expect(() =>
      adiabaticMinSection({ currentA: 1000, durationS: 0, k: 115 }),
    ).toThrow(/duration/);
    expect(() =>
      adiabaticMinSection({ currentA: 1000, durationS: 1, k: 0 }),
    ).toThrow(/k-factor/);
  });
});
