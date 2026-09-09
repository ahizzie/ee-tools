import { assertNonNegative, assertPositive } from "./assert";

export type OhmsLawInput = {
  voltage?: number | null;
  current?: number | null;
  resistance?: number | null;
  power?: number | null;
};

export type OhmsLawResult = {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  equation: string;
};

function isPresent(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function ohmsLaw(input: OhmsLawInput): OhmsLawResult {
  const v = isPresent(input.voltage) ? input.voltage : null;
  const i = isPresent(input.current) ? input.current : null;
  const r = isPresent(input.resistance) ? input.resistance : null;
  const p = isPresent(input.power) ? input.power : null;

  if (v !== null) assertNonNegative(v, "Voltage");
  if (i !== null) assertNonNegative(i, "Current");
  if (r !== null) assertPositive(r, "Resistance");
  if (p !== null) assertNonNegative(p, "Power");

  if (v !== null && i !== null) {
    if (i === 0) {
      throw new Error("Current must be non-zero when solving from V and I.");
    }
    const resistance = v / i;
    const power = v * i;
    return {
      voltage: v,
      current: i,
      resistance,
      power,
      equation: "V = I × R,  P = V × I",
    };
  }

  if (v !== null && r !== null) {
    const current = v / r;
    const power = v * current;
    return {
      voltage: v,
      current,
      resistance: r,
      power,
      equation: "I = V / R,  P = V × I",
    };
  }

  if (i !== null && r !== null) {
    const voltage = i * r;
    const power = voltage * i;
    return {
      voltage,
      current: i,
      resistance: r,
      power,
      equation: "V = I × R,  P = V × I",
    };
  }

  if (p !== null && v !== null) {
    if (v === 0) {
      throw new Error("Voltage must be non-zero when solving from P and V.");
    }
    const current = p / v;
    if (current === 0) {
      throw new Error("Power and voltage imply zero current; resistance is undefined.");
    }
    const resistance = v / current;
    return {
      voltage: v,
      current,
      resistance,
      power: p,
      equation: "I = P / V,  R = V / I",
    };
  }

  if (p !== null && i !== null) {
    if (i === 0) {
      throw new Error("Current must be non-zero when solving from P and I.");
    }
    const voltage = p / i;
    const resistance = voltage / i;
    return {
      voltage,
      current: i,
      resistance,
      power: p,
      equation: "V = P / I,  R = V / I",
    };
  }

  if (p !== null && r !== null) {
    const current = Math.sqrt(p / r);
    const voltage = current * r;
    return {
      voltage,
      current,
      resistance: r,
      power: p,
      equation: "I = √(P / R),  V = I × R",
    };
  }

  throw new Error(
    "Enter any two of V, I, and R, or power plus one of V, I, or R.",
  );
}
