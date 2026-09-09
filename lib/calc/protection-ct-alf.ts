/**
 * Protection CT accuracy-limit-factor (ALF) adequacy check.
 *
 * A protection CT (e.g. 5P20) must keep its rated error at the maximum fault
 * current it is asked to reproduce. The connected burden (leads + relay) lowers
 * the effective ALF, so the CT is only suitable when the effective ("seen") ALF
 * still exceeds the ALF required by the fault level.
 *
 * Model follows the "Protection CT ALF" sheet of Powersystems UK's
 * "Calculate Protection and Metering CTs v1.2" workbook
 * (ref. Cahier Technique No. 194).
 */

/** Resistivity of copper in Ω·m (matches the source workbook's 1.72e-8). */
export const COPPER_RESISTIVITY_OHM_M = 1.72e-8;

export type ProtectionCtInput = {
  /** CT primary rating, A (CTp). */
  ctPrimaryA: number;
  /** CT secondary rating, A (CTs) — typically 1 or 5. */
  ctSecondaryA: number;
  /** Rated accuracy limit factor, the "20" of 5P20 (ALFo). */
  ratedAlf: number;
  /** Minimum three-phase RMS fault current, A (If). */
  minFaultCurrentA: number;
  /** Rated burden of the CT, VA (S). */
  ratedBurdenVa: number;
  /** CT internal secondary winding resistance, Ω (Rct). */
  ctResistanceOhm: number;
  /** Relay / device burden resistance, Ω (Rr). */
  relayResistanceOhm: number;
  /** One-way length of the CT wiring, m (L). The loop length is 2·L. */
  wiringLengthM: number;
  /** Cross-sectional area of the CT wiring, mm² (CSA). */
  wiringCsaMm2: number;
  /** Safety factor applied to the required ALF (SF). */
  safetyFactor: number;
};

export type ProtectionCtResult = {
  /** Resistance of the CT wiring loop, Ω (Rw). */
  wiringResistanceOhm: number;
  /** ALF required at the fault level, ALFr = SF · (If / CTp). */
  alfRequired: number;
  /** Effective ALF seen through the connected burden (ALFs). */
  alfSeen: number;
  /** ALFs − ALFr. Positive when the CT is adequate. */
  margin: number;
  /** True when ALFs > ALFr (CT specification is appropriate). */
  adequate: boolean;
  equation: string;
};

export function protectionCtAlf(input: ProtectionCtInput): ProtectionCtResult {
  const {
    ctPrimaryA,
    ctSecondaryA,
    ratedAlf,
    minFaultCurrentA,
    ratedBurdenVa,
    ctResistanceOhm,
    relayResistanceOhm,
    wiringLengthM,
    wiringCsaMm2,
    safetyFactor,
  } = input;

  if (!(ctPrimaryA > 0)) throw new Error("CT primary must be greater than zero.");
  if (!(ctSecondaryA > 0)) throw new Error("CT secondary must be greater than zero.");
  if (!(ratedAlf > 0)) throw new Error("Rated ALF must be greater than zero.");
  if (!(minFaultCurrentA >= 0)) throw new Error("Fault current must be ≥ 0.");
  if (!(ratedBurdenVa > 0)) throw new Error("Rated burden must be greater than zero.");
  if (!(ctResistanceOhm >= 0)) throw new Error("CT resistance must be ≥ 0.");
  if (!(relayResistanceOhm >= 0)) throw new Error("Relay burden must be ≥ 0.");
  if (!(wiringLengthM >= 0)) throw new Error("Wiring length must be ≥ 0.");
  if (!(wiringCsaMm2 > 0)) throw new Error("Wiring cross-section must be greater than zero.");
  if (!(safetyFactor > 0)) throw new Error("Safety factor must be greater than zero.");

  // Rw = ρ / A · (2·L). CSA is mm², so convert to m² (×1e-6).
  const wiringResistanceOhm =
    (COPPER_RESISTIVITY_OHM_M / (wiringCsaMm2 * 1e-6)) * (wiringLengthM * 2);

  const alfRequired = safetyFactor * (minFaultCurrentA / ctPrimaryA);

  const internalVa = ctSecondaryA * ctSecondaryA * ctResistanceOhm;
  const connectedVa =
    ctSecondaryA * ctSecondaryA * (wiringResistanceOhm + relayResistanceOhm);
  const alfSeen = ratedAlf * ((internalVa + ratedBurdenVa) / (internalVa + connectedVa));

  const margin = alfSeen - alfRequired;

  return {
    wiringResistanceOhm,
    alfRequired,
    alfSeen,
    margin,
    adequate: alfSeen > alfRequired,
    equation:
      "ALFs = ALFo · (Is²·Rct + S) / (Is²·Rct + Is²·(Rw + Rr)),  ALFr = SF · If / CTp,  need ALFs > ALFr",
  };
}
