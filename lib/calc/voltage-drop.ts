export type ConductorMaterial = "copper" | "aluminium";
export type CircuitType = "single-phase" | "three-phase";

/** Resistivity at 20 °C in Ω·mm²/m (IEC-style copper/aluminium). */
const RESISTIVITY_20: Record<ConductorMaterial, number> = {
  copper: 0.017241,
  aluminium: 0.028264,
};

const ALPHA: Record<ConductorMaterial, number> = {
  copper: 0.00393,
  aluminium: 0.00403,
};

/** Typical cable reactance if the user does not override (Ω/km). */
export const DEFAULT_REACTANCE_OHM_PER_KM = 0.08;

export type VoltageDropInput = {
  material: ConductorMaterial;
  circuit: CircuitType;
  lengthM: number;
  currentA: number;
  sectionMm2: number;
  temperatureC: number;
  powerFactor: number;
  /** Series reactance of one conductor, Ω/km. Use 0 to ignore X. */
  reactanceOhmPerKm?: number;
  /** Nominal voltage for percent drop (V). Line-to-line for 3-phase, line-to-neutral for 1-phase. */
  nominalVoltageV: number;
};

export type VoltageDropResult = {
  voltageDropV: number;
  percentDrop: number;
  resistanceOhm: number;
  reactanceOhm: number;
  resistivityOhmMm2PerM: number;
  equation: string;
};

export function conductorResistivity(
  material: ConductorMaterial,
  temperatureC: number,
): number {
  const rho20 = RESISTIVITY_20[material];
  return rho20 * (1 + ALPHA[material] * (temperatureC - 20));
}

export function voltageDropIec(input: VoltageDropInput): VoltageDropResult {
  const {
    material,
    circuit,
    lengthM,
    currentA,
    sectionMm2,
    temperatureC,
    powerFactor,
    nominalVoltageV,
  } = input;

  if (!(lengthM > 0)) throw new Error("Length must be greater than zero.");
  if (!(currentA >= 0)) throw new Error("Current must be ≥ 0.");
  if (!(sectionMm2 > 0)) throw new Error("Conductor cross-section must be greater than zero.");
  if (powerFactor < 0 || powerFactor > 1) {
    throw new Error("Power factor must be between 0 and 1.");
  }
  if (!(nominalVoltageV > 0)) throw new Error("Nominal voltage must be greater than zero.");

  const resistivity = conductorResistivity(material, temperatureC);
  const rOhm = (resistivity * lengthM) / sectionMm2;
  const xPerKm = input.reactanceOhmPerKm ?? DEFAULT_REACTANCE_OHM_PER_KM;
  const xOhm = (xPerKm * lengthM) / 1000;
  const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
  const zDrop = rOhm * powerFactor + xOhm * sinPhi;

  const multiplier = circuit === "three-phase" ? Math.sqrt(3) : 2;
  const voltageDropV = multiplier * currentA * zDrop;
  const percentDrop = (100 * voltageDropV) / nominalVoltageV;

  const equation =
    circuit === "three-phase"
      ? "ΔU = √3 · I · (R cosφ + X sinφ),  R = ρ_θ · L / A"
      : "ΔU = 2 · I · (R cosφ + X sinφ),  R = ρ_θ · L / A";

  return {
    voltageDropV,
    percentDrop,
    resistanceOhm: rOhm,
    reactanceOhm: xOhm,
    resistivityOhmMm2PerM: resistivity,
    equation,
  };
}

export type VoltageDropCurvePoint = {
  lengthM: number;
  voltageDropV: number;
  percentDrop: number;
};

export function voltageDropVsLength(
  input: Omit<VoltageDropInput, "lengthM">,
  maxLengthM: number,
  steps = 25,
): VoltageDropCurvePoint[] {
  if (!(maxLengthM > 0)) return [];
  const points: VoltageDropCurvePoint[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const lengthM = (maxLengthM * i) / steps;
    const result = voltageDropIec({ ...input, lengthM });
    points.push({
      lengthM,
      voltageDropV: result.voltageDropV,
      percentDrop: result.percentDrop,
    });
  }
  return points;
}
