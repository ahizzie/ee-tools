import { describe, expect, it } from "vitest";
import { threePhaseAmpsKw } from "./amps-kw";

describe("threePhaseAmpsKw", () => {
  it("converts 400 V, 10 A, pf 0.8 to kW", () => {
    const result = threePhaseAmpsKw({
      lineVoltage: 400,
      current: 10,
      powerFactor: 0.8,
    });
    const expectedKw = (Math.sqrt(3) * 400 * 10 * 0.8) / 1000;
    expect(result.activePowerKw).toBeCloseTo(expectedKw, 8);
    expect(result.current).toBeCloseTo(10, 10);
    expect(result.equation).toContain("P(kW)");
  });

  it("converts 400 V, 5.54256 kW, pf 0.8 back to 10 A", () => {
    const kw = (Math.sqrt(3) * 400 * 10 * 0.8) / 1000;
    const result = threePhaseAmpsKw({
      lineVoltage: 400,
      activePowerKw: kw,
      powerFactor: 0.8,
    });
    expect(result.current).toBeCloseTo(10, 8);
    expect(result.activePowerKw).toBeCloseTo(kw, 8);
    expect(result.equation).toContain("I_L");
  });

  it("rejects missing or combined current and power", () => {
    expect(() =>
      threePhaseAmpsKw({ lineVoltage: 400, powerFactor: 0.8 }),
    ).toThrow(/Enter line current, or active power in kW\./);
    expect(() =>
      threePhaseAmpsKw({
        lineVoltage: 400,
        powerFactor: 0.8,
        current: 10,
        activePowerKw: 5,
      }),
    ).toThrow(/not both/);
  });

  it("rejects negative current, negative kW, and PF outside 0–1", () => {
    expect(() =>
      threePhaseAmpsKw({ lineVoltage: 400, current: -10, powerFactor: 0.8 }),
    ).toThrow(/Current must be ≥ 0/);
    expect(() =>
      threePhaseAmpsKw({
        lineVoltage: 400,
        activePowerKw: -5,
        powerFactor: 0.8,
      }),
    ).toThrow(/Active power must be ≥ 0/);
    expect(() =>
      threePhaseAmpsKw({ lineVoltage: 400, current: 10, powerFactor: 1.2 }),
    ).toThrow(/Power factor/);
  });
});
