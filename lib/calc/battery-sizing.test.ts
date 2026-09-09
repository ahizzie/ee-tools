import { describe, expect, it } from "vitest";
import { batterySizing, nextStandardAh } from "./battery-sizing";

/** Textbook example: 10 A standing for 5 h plus 1 Ah of operations, then 1.25 × 1.1. */
const textbook = {
  voltageV: 110,
  autonomyH: 5,
  standingLoads: [{ name: "Control & indication", powerW: 1100 }],
  switchgear: [
    {
      name: "110 kV CB",
      quantity: 1,
      tripCurrentA: 100,
      tripDurationS: 36,
      tripOperations: 1,
      closeCurrentA: 0,
      closeDurationS: 0,
      closeOperations: 0,
      motorCurrentA: 0,
      motorDurationS: 0,
      motorOperations: 0,
    },
  ],
  ageingFactor: 1.25,
  temperatureFactor: 1,
  designMargin: 1.1,
};

describe("batterySizing", () => {
  it("matches the standing-plus-operations worked example", () => {
    const r = batterySizing(textbook);
    expect(r.standingCurrentA).toBeCloseTo(10, 12);
    expect(r.standingAh).toBeCloseTo(50, 12);
    expect(r.operationsAh).toBeCloseTo(1, 12);
    expect(r.uncorrectedAh).toBeCloseTo(51, 12);
    expect(r.requiredAh).toBeCloseTo(51 * 1.25 * 1.1, 12);
    expect(r.suggestedAh).toBe(80);
    expect(r.peakCurrentA).toBeCloseTo(110, 12);
  });

  it("sums several standing loads as P / V", () => {
    const r = batterySizing({
      ...textbook,
      standingLoads: [
        { name: "Relays", powerW: 220 },
        { name: "Lamps", powerW: 330 },
      ],
      switchgear: [],
    });
    expect(r.standingCurrentA).toBeCloseTo(5, 12);
    expect(r.standingAh).toBeCloseTo(25, 12);
    expect(r.operationsAh).toBe(0);
    expect(r.peakCurrentA).toBeCloseTo(5, 12);
  });

  it("multiplies identical switchgear by quantity", () => {
    const one = batterySizing(textbook);
    const two = batterySizing({
      ...textbook,
      switchgear: [{ ...textbook.switchgear[0], quantity: 2 }],
    });
    expect(two.operationsAh).toBeCloseTo(one.operationsAh * 2, 12);
    expect(two.peakCurrentA).toBeCloseTo(10 + 200, 12);
  });

  it("includes close and motor ampere-seconds", () => {
    const r = batterySizing({
      voltageV: 110,
      autonomyH: 3,
      standingLoads: [{ name: "Standing", powerW: 110 }],
      switchgear: [
        {
          name: "11 kV CB",
          quantity: 4,
          tripCurrentA: 10,
          tripDurationS: 0.1,
          tripOperations: 2,
          closeCurrentA: 20,
          closeDurationS: 0.3,
          closeOperations: 1,
          motorCurrentA: 5,
          motorDurationS: 20,
          motorOperations: 1,
        },
      ],
      ageingFactor: 1,
      temperatureFactor: 1,
      designMargin: 1,
    });
    // Per CB: (10·0.1·2 + 20·0.3·1 + 5·20·1) / 3600 = 108 / 3600 Ah
    expect(r.operationsAh).toBeCloseTo((4 * 108) / 3600, 12);
    expect(r.standingAh).toBeCloseTo(3, 12);
    expect(r.peakCurrentA).toBeCloseTo(1 + 4 * 20, 12);
  });

  it("rejects a non-positive voltage", () => {
    expect(() => batterySizing({ ...textbook, voltageV: 0 })).toThrow(/voltage/i);
  });

  it("rejects negative standing load current", () => {
    expect(() =>
      batterySizing({
        ...textbook,
        standingLoads: [{ name: "Bad", currentA: -2 }],
      }),
    ).toThrow(/current must be ≥ 0/i);
  });

  it("rejects fractional switchgear quantity and factor ranges", () => {
    expect(() =>
      batterySizing({
        ...textbook,
        switchgear: [{ ...textbook.switchgear[0], quantity: 1.5 }],
      }),
    ).toThrow(/whole number/);
    expect(() => batterySizing({ ...textbook, ageingFactor: 0.5 })).toThrow(/Ageing factor/);
    expect(() => batterySizing({ ...textbook, temperatureFactor: 0 })).toThrow(
      /Temperature factor/,
    );
    expect(() => batterySizing({ ...textbook, designMargin: 0.5 })).toThrow(/Design margin/);
    expect(() => batterySizing({ ...textbook, autonomyH: 800 })).toThrow(/Autonomy must be ≤ 720/);
  });

  it("rejects an empty duty", () => {
    expect(() =>
      batterySizing({ ...textbook, standingLoads: [], switchgear: [] }),
    ).toThrow(/standing load or switchgear/i);
  });

  it("accepts standing load as amps instead of watts", () => {
    const r = batterySizing({
      ...textbook,
      standingLoads: [{ name: "Control & indication", currentA: 10 }],
    });
    expect(r.standingCurrentA).toBeCloseTo(10, 12);
    expect(r.standingLoads[0].powerW).toBeCloseTo(1100, 12);
  });

  it("prefers amps when both current and power are given", () => {
    const r = batterySizing({
      ...textbook,
      standingLoads: [{ name: "Mixed", currentA: 4, powerW: 9999 }],
    });
    expect(r.standingCurrentA).toBeCloseTo(4, 12);
    expect(r.standingLoads[0].powerW).toBeCloseTo(440, 12);
  });
});

describe("nextStandardAh", () => {
  it("rounds up to the next common C10 rating", () => {
    expect(nextStandardAh(70.125)).toBe(80);
    expect(nextStandardAh(80)).toBe(80);
    expect(nextStandardAh(1001)).toBeNull();
  });
});
