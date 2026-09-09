import { describe, expect, it } from "vitest";
import {
  assertInRange,
  assertNonNegative,
  assertNonNegativeInteger,
  assertPositive,
  assertPositiveInteger,
  assertPowerFactor,
} from "./assert";

describe("assert helpers", () => {
  it("rejects negatives when a value must be ≥ 0", () => {
    expect(() => assertNonNegative(-1, "Current")).toThrow(/Current must be ≥ 0/);
    expect(() => assertNonNegative(0, "Current")).not.toThrow();
  });

  it("rejects zero when a value must be > 0", () => {
    expect(() => assertPositive(0, "Length")).toThrow(/Length must be greater than zero/);
    expect(() => assertPositive(1, "Length")).not.toThrow();
  });

  it("rejects values outside an inclusive range", () => {
    expect(() => assertInRange(1.2, 0, 1, "Power factor")).toThrow(
      /Power factor must be between 0 and 1/,
    );
    expect(() => assertInRange(0.5, 0, 1, "Power factor")).not.toThrow();
  });

  it("rejects non-integers where a count is required", () => {
    expect(() => assertPositiveInteger(1.5, "Quantity")).toThrow(/whole number/);
    expect(() => assertPositiveInteger(0, "Quantity")).toThrow(/whole number greater than zero/);
    expect(() => assertNonNegativeInteger(-1, "Operations")).toThrow();
    expect(() => assertNonNegativeInteger(0, "Operations")).not.toThrow();
  });

  it("rejects power factor outside 0–1", () => {
    expect(() => assertPowerFactor(-0.1)).toThrow(/Power factor/);
    expect(() => assertPowerFactor(1.01)).toThrow(/Power factor/);
    expect(() => assertPowerFactor(0)).not.toThrow();
    expect(() => assertPowerFactor(1)).not.toThrow();
  });
});
