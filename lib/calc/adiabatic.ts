import { assertInRange, assertPositive } from "./assert";

/** IEC 60949 / IEC 60364-4-43 Annex A material constants for the adiabatic k-factor. */
export type ConductorMaterial = "copper" | "aluminium";

export const ADIABATIC_CONSTANTS: Record<
  ConductorMaterial,
  { beta: number; k0: number }
> = {
  copper: { beta: 234.5, k0: 226 },
  aluminium: { beta: 228, k0: 148 },
};

/** Typical IEC 60364-4-43 short-circuit temperature limits (°C). */
export const INSULATION_LIMITS = {
  pvc: { initialC: 70, finalC: 160, label: "PVC" },
  xlpe: { initialC: 90, finalC: 250, label: "XLPE / EPR" },
} as const;

export type InsulationType = keyof typeof INSULATION_LIMITS;

/** Duration (s) above which IEC 60364-4-43 treats heating as non-adiabatic. */
export const ADIABATIC_DURATION_LIMIT_S = 5;

/** Practical window for θ_i / θ_f in the k-factor logarithm. */
export const ADIABATIC_TEMP_MIN_C = -50;
export const ADIABATIC_TEMP_MAX_C = 400;

export type AdiabaticKInput = {
  material: ConductorMaterial;
  initialTempC: number;
  finalTempC: number;
};

export function adiabaticKFactor(input: AdiabaticKInput): number {
  const { material, initialTempC, finalTempC } = input;
  assertInRange(
    initialTempC,
    ADIABATIC_TEMP_MIN_C,
    ADIABATIC_TEMP_MAX_C,
    "Initial temperature (°C)",
  );
  assertInRange(
    finalTempC,
    ADIABATIC_TEMP_MIN_C,
    ADIABATIC_TEMP_MAX_C,
    "Final temperature (°C)",
  );
  if (!(finalTempC > initialTempC)) {
    throw new Error("Final temperature must be greater than initial temperature.");
  }
  const constants = ADIABATIC_CONSTANTS[material];
  if (!constants) {
    throw new Error("Conductor must be copper or aluminium.");
  }
  const { beta, k0 } = constants;
  const ratio = (finalTempC + beta) / (initialTempC + beta);
  return k0 * Math.sqrt(Math.log(ratio));
}

export type AdiabaticMinSectionInput = {
  /** RMS short-circuit current, A. */
  currentA: number;
  /** Fault duration, s. */
  durationS: number;
  /** IEC k-factor, A·s½ / mm². */
  k: number;
};

export type AdiabaticMinSectionResult = {
  sectionMm2: number;
  energyLetThroughA2s: number;
  k: number;
  durationExceedsAdiabaticLimit: boolean;
  equation: string;
};

export function adiabaticMinSection(
  input: AdiabaticMinSectionInput,
): AdiabaticMinSectionResult {
  const { currentA, durationS, k } = input;
  assertPositive(currentA, "Short-circuit current");
  assertPositive(durationS, "Fault duration");
  assertPositive(k, "k-factor");

  const sectionMm2 = (currentA * Math.sqrt(durationS)) / k;
  return {
    sectionMm2,
    energyLetThroughA2s: currentA * currentA * durationS,
    k,
    durationExceedsAdiabaticLimit: durationS > ADIABATIC_DURATION_LIMIT_S,
    equation: "S = I · √t / k",
  };
}
