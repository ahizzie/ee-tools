import { describe, expect, it } from "vitest";
import { ohmsLaw } from "./ohms-law";

describe("ohmsLaw", () => {
  it("solves R and P from V and I (textbook: 12 V, 2 A)", () => {
    const result = ohmsLaw({ voltage: 12, current: 2 });
    expect(result.resistance).toBeCloseTo(6, 10);
    expect(result.power).toBeCloseTo(24, 10);
    expect(result.equation).toContain("V = I × R");
  });

  it("solves I and P from V and R", () => {
    const result = ohmsLaw({ voltage: 12, resistance: 6 });
    expect(result.current).toBeCloseTo(2, 10);
    expect(result.power).toBeCloseTo(24, 10);
  });

  it("solves V and P from I and R", () => {
    const result = ohmsLaw({ current: 2, resistance: 6 });
    expect(result.voltage).toBeCloseTo(12, 10);
    expect(result.power).toBeCloseTo(24, 10);
  });

  it("solves from P and V", () => {
    const result = ohmsLaw({ power: 24, voltage: 12 });
    expect(result.current).toBeCloseTo(2, 10);
    expect(result.resistance).toBeCloseTo(6, 10);
  });

  it("solves from P and R", () => {
    const result = ohmsLaw({ power: 24, resistance: 6 });
    expect(result.current).toBeCloseTo(2, 10);
    expect(result.voltage).toBeCloseTo(12, 10);
  });

  it("throws when fewer than two independent values are given", () => {
    expect(() => ohmsLaw({ voltage: 12 })).toThrow(/Enter any two/);
  });

  it("rejects negative current instead of returning negative R or P", () => {
    expect(() => ohmsLaw({ voltage: 12, current: -2 })).toThrow(/Current must be ≥ 0/);
  });

  it("rejects negative voltage, resistance, and power", () => {
    expect(() => ohmsLaw({ voltage: -12, current: 2 })).toThrow(/Voltage must be ≥ 0/);
    expect(() => ohmsLaw({ voltage: 12, resistance: -6 })).toThrow(
      /Resistance must be greater than zero/,
    );
    expect(() => ohmsLaw({ power: -24, voltage: 12 })).toThrow(/Power must be ≥ 0/);
  });

  it("rejects zero resistance", () => {
    expect(() => ohmsLaw({ voltage: 12, resistance: 0 })).toThrow(
      /Resistance must be greater than zero/,
    );
  });
});
