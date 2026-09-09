/**
 * Metering CT burden adequacy check.
 *
 * A metering CT is only tested to its rated accuracy class when the connected
 * ("circuit") burden sits between 25 % and 100 % of the CT's rated burden. Too
 * little burden (an oversized VA rating) or too much burden both risk falling
 * outside the class-guaranteed accuracy.
 *
 * Model follows the "Metering CT Burden" sheet of Powersystems UK's
 * "Calculate Protection and Metering CTs v1.2" workbook (ref. BS EN 61869-2).
 */

import { COPPER_RESISTIVITY_OHM_M } from "./protection-ct-alf";

/** Fractions of rated burden that bound the class-guaranteed accuracy range. */
export const MIN_BURDEN_FRACTION = 0.25;
export const MAX_BURDEN_FRACTION = 1;

export type MeteringCtInput = {
  /** Load capacity, VA (S). */
  loadCapacityVa: number;
  /** System voltage, V (V). Line-to-line for three-phase. */
  voltageV: number;
  /** Voltage deviation, per-unit (Vpu), e.g. 0.94. */
  voltageDeviationPu: number;
  /** CT primary rating, A (CTp). */
  ctPrimaryA: number;
  /** CT secondary rating, A (CTs) — typically 1 or 5. */
  ctSecondaryA: number;
  /** Wiring loop length, m (L). */
  wiringLengthM: number;
  /** Wiring cross-sectional area, mm² (CSA). */
  wiringCsaMm2: number;
  /** Meter / relay resistance, Ω (Rr). */
  meterResistanceOhm: number;
  /** Any additional series resistance, Ω (Rextra). */
  extraResistanceOhm: number;
  /** Chosen rated burden of the CT, VA (B). */
  ratedBurdenVa: number;
};

export type MeteringCtStatus = "ok" | "under" | "over";

export type MeteringCtResult = {
  /** Primary load current, A (Il). */
  loadCurrentA: number;
  /** Secondary current, A (Is). */
  secondaryCurrentA: number;
  /** Wiring resistance, Ω (Rw). */
  wiringResistanceOhm: number;
  /** Burden of the wiring, VA (Bw). */
  wiringBurdenVa: number;
  /** Burden of the meter / relay, VA (Br). */
  meterBurdenVa: number;
  /** Burden of any extra resistance, VA (Bextra). */
  extraBurdenVa: number;
  /** Total connected circuit burden, VA (Btot). */
  circuitBurdenVa: number;
  /** 25 % of rated burden, VA (Bmin). */
  minBurdenVa: number;
  /** 100 % of rated burden, VA (Bmax). */
  maxBurdenVa: number;
  /** Circuit burden as a percentage of rated burden. */
  percentOfRated: number;
  /** "under" (< 25 %), "ok" (25–100 %), or "over" (> 100 %). */
  status: MeteringCtStatus;
  /** True when the circuit burden is within 25–100 % of rated. */
  adequate: boolean;
  equation: string;
};

export function meteringCtBurden(input: MeteringCtInput): MeteringCtResult {
  const {
    loadCapacityVa,
    voltageV,
    voltageDeviationPu,
    ctPrimaryA,
    ctSecondaryA,
    wiringLengthM,
    wiringCsaMm2,
    meterResistanceOhm,
    extraResistanceOhm,
    ratedBurdenVa,
  } = input;

  if (!(loadCapacityVa > 0)) throw new Error("Load capacity must be greater than zero.");
  if (!(voltageV > 0)) throw new Error("Voltage must be greater than zero.");
  if (!(voltageDeviationPu > 0)) throw new Error("Voltage deviation must be greater than zero.");
  if (!(ctPrimaryA > 0)) throw new Error("CT primary must be greater than zero.");
  if (!(ctSecondaryA > 0)) throw new Error("CT secondary must be greater than zero.");
  if (!(wiringLengthM >= 0)) throw new Error("Wiring length must be ≥ 0.");
  if (!(wiringCsaMm2 > 0)) throw new Error("Wiring cross-section must be greater than zero.");
  if (!(meterResistanceOhm >= 0)) throw new Error("Meter resistance must be ≥ 0.");
  if (!(extraResistanceOhm >= 0)) throw new Error("Extra resistance must be ≥ 0.");
  if (!(ratedBurdenVa > 0)) throw new Error("Rated burden must be greater than zero.");

  const loadCurrentA = loadCapacityVa / (Math.sqrt(3) * voltageV * voltageDeviationPu);
  const secondaryCurrentA = loadCurrentA / (ctPrimaryA / ctSecondaryA);

  // Rw = ρ · L / A. CSA is mm², so convert to m² (×1e-6).
  const wiringResistanceOhm =
    (wiringLengthM * COPPER_RESISTIVITY_OHM_M) / (wiringCsaMm2 * 1e-6);

  const is2 = secondaryCurrentA * secondaryCurrentA;
  const wiringBurdenVa = is2 * wiringResistanceOhm;
  const meterBurdenVa = is2 * meterResistanceOhm;
  const extraBurdenVa = is2 * extraResistanceOhm;
  const circuitBurdenVa = wiringBurdenVa + meterBurdenVa + extraBurdenVa;

  const minBurdenVa = ratedBurdenVa * MIN_BURDEN_FRACTION;
  const maxBurdenVa = ratedBurdenVa * MAX_BURDEN_FRACTION;
  const percentOfRated = (circuitBurdenVa / ratedBurdenVa) * 100;

  const status: MeteringCtStatus =
    circuitBurdenVa < minBurdenVa ? "under" : circuitBurdenVa > maxBurdenVa ? "over" : "ok";

  return {
    loadCurrentA,
    secondaryCurrentA,
    wiringResistanceOhm,
    wiringBurdenVa,
    meterBurdenVa,
    extraBurdenVa,
    circuitBurdenVa,
    minBurdenVa,
    maxBurdenVa,
    percentOfRated,
    status,
    adequate: status === "ok",
    equation:
      "Is = Il / (CTp/CTs),  Btot = Is²·(Rw + Rr + Rextra),  need 25 % ≤ Btot/B ≤ 100 %",
  };
}
