import { threePhasePower } from "./three-phase";

export type AmpsKwInput = {
  /** Line-to-line voltage in volts. */
  lineVoltage: number;
  /** Displacement power factor, 0–1. */
  powerFactor: number;
  /** Line current in amperes (amps → kW). */
  current?: number | null;
  /** Active power in kilowatts (kW → amps). */
  activePowerKw?: number | null;
};

export type AmpsKwResult = {
  lineVoltage: number;
  current: number;
  powerFactor: number;
  activePowerKw: number;
  equation: string;
};

export function threePhaseAmpsKw(input: AmpsKwInput): AmpsKwResult {
  const hasCurrent =
    input.current !== null &&
    input.current !== undefined &&
    Number.isFinite(input.current);
  const hasPower =
    input.activePowerKw !== null &&
    input.activePowerKw !== undefined &&
    Number.isFinite(input.activePowerKw);

  if (hasCurrent && hasPower) {
    throw new Error("Enter line current, or active power in kW — not both.");
  }
  if (!hasCurrent && !hasPower) {
    throw new Error("Enter line current, or active power in kW.");
  }

  const result = threePhasePower({
    lineVoltage: input.lineVoltage,
    powerFactor: input.powerFactor,
    current: hasCurrent ? input.current : null,
    activePower: hasPower ? (input.activePowerKw as number) * 1000 : null,
  });

  return {
    lineVoltage: result.lineVoltage,
    current: result.current,
    powerFactor: result.powerFactor,
    activePowerKw: result.activePower / 1000,
    equation: hasCurrent
      ? "P(kW) = √3 · V_L · I_L · cosφ / 1000"
      : "I_L = 1000 · P(kW) / (√3 · V_L · cosφ)",
  };
}
