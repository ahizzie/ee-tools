const SQRT3 = Math.sqrt(3);

export type ThreePhaseInput = {
  /** Line-to-line voltage in volts. */
  lineVoltage: number;
  /** Line current in amperes (required unless activePower is set). */
  current?: number | null;
  /** Active power in watts (used to solve current when current is omitted). */
  activePower?: number | null;
  /** Displacement power factor, 0–1. */
  powerFactor: number;
};

export type ThreePhaseResult = {
  lineVoltage: number;
  current: number;
  powerFactor: number;
  activePower: number;
  reactivePower: number;
  apparentPower: number;
  equation: string;
};

export function threePhasePower(input: ThreePhaseInput): ThreePhaseResult {
  const { lineVoltage, powerFactor } = input;
  if (!(lineVoltage > 0)) {
    throw new Error("Line-to-line voltage must be greater than zero.");
  }
  if (powerFactor < 0 || powerFactor > 1) {
    throw new Error("Power factor must be between 0 and 1.");
  }

  const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
  const currentIn = input.current;
  const powerIn = input.activePower;

  let current: number;
  let equation: string;

  if (currentIn !== null && currentIn !== undefined && Number.isFinite(currentIn)) {
    if (currentIn < 0) {
      throw new Error("Current must be ≥ 0.");
    }
    current = currentIn;
    equation = "P = √3 · V_L · I_L · cosφ,  S = √3 · V_L · I_L,  Q = √3 · V_L · I_L · sinφ";
  } else if (powerIn !== null && powerIn !== undefined && Number.isFinite(powerIn)) {
    if (powerFactor === 0) {
      throw new Error("Cannot solve current from power when power factor is 0.");
    }
    current = powerIn / (SQRT3 * lineVoltage * powerFactor);
    equation = "I_L = P / (√3 · V_L · cosφ),  S = √3 · V_L · I_L";
  } else {
    throw new Error("Enter line current, or active power to solve for current.");
  }

  const apparentPower = SQRT3 * lineVoltage * current;
  const activePower = apparentPower * powerFactor;
  const reactivePower = apparentPower * sinPhi;

  return {
    lineVoltage,
    current,
    powerFactor,
    activePower,
    reactivePower,
    apparentPower,
    equation,
  };
}
