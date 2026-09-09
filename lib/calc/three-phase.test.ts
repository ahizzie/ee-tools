import { describe, expect, it } from "vitest";
import { threePhasePower } from "./three-phase";

describe("threePhasePower", () => {
  it("computes P, Q, S for 400 V, 10 A, pf 0.8", () => {
    const result = threePhasePower({
      lineVoltage: 400,
      current: 10,
      powerFactor: 0.8,
    });
    const expectedS = Math.sqrt(3) * 400 * 10;
    expect(result.apparentPower).toBeCloseTo(expectedS, 8);
    expect(result.activePower).toBeCloseTo(expectedS * 0.8, 8);
    expect(result.reactivePower).toBeCloseTo(expectedS * 0.6, 8);
  });

  it("solves current from 400 V, 5542.56 W, pf 0.8", () => {
    const p = Math.sqrt(3) * 400 * 10 * 0.8;
    const result = threePhasePower({
      lineVoltage: 400,
      activePower: p,
      powerFactor: 0.8,
    });
    expect(result.current).toBeCloseTo(10, 8);
  });

  it("rejects power factor outside 0–1", () => {
    expect(() =>
      threePhasePower({ lineVoltage: 400, current: 10, powerFactor: 1.2 }),
    ).toThrow(/Power factor/);
  });

  it("rejects negative current and active power", () => {
    expect(() =>
      threePhasePower({ lineVoltage: 400, current: -10, powerFactor: 0.8 }),
    ).toThrow(/Current must be ≥ 0/);
    expect(() =>
      threePhasePower({ lineVoltage: 400, activePower: -1000, powerFactor: 0.8 }),
    ).toThrow(/Active power must be ≥ 0/);
  });

  it("rejects non-positive line voltage", () => {
    expect(() =>
      threePhasePower({ lineVoltage: 0, current: 10, powerFactor: 0.8 }),
    ).toThrow(/Line-to-line voltage must be greater than zero/);
  });
});
