/**
 * Substation DC backup / tripping-battery capacity.
 *
 * Ampere-hour method used in IEC/metric switchgear practice: standing load over
 * the stated autonomy, plus the ampere-seconds of a defined number of
 * open/close (and optional spring-charge) operations, then ageing, temperature,
 * and design-margin factors.
 *
 * Discharge-rate (IEEE 485 Kt / Peukert) tables are not applied — the result is
 * a 10-hour-equivalent Ah with those three factors only.
 */

import {
  assertInRange,
  assertNonNegative,
  assertNonNegativeInteger,
  assertPositive,
  assertPositiveInteger,
} from "./assert";

/** Common 10-hour (C10) Ah ratings used to suggest the next commercial size. */
export const COMMON_AH_RATINGS = [
  10, 16, 24, 28, 30, 38, 40, 50, 65, 80, 100, 120, 150, 160, 180, 200, 250, 300,
  400, 500, 600, 800, 1000,
] as const;

export const AGEING_FACTOR_MIN = 1;
export const AGEING_FACTOR_MAX = 3;
export const TEMPERATURE_FACTOR_MIN = 0.5;
export const TEMPERATURE_FACTOR_MAX = 2.5;
export const DESIGN_MARGIN_MIN = 1;
export const DESIGN_MARGIN_MAX = 3;
export const AUTONOMY_MAX_H = 720;

export type StandingLoad = {
  name: string;
  /** Continuous current, A. Used for Ah when provided. */
  currentA?: number | null;
  /** Continuous power, W. Used when current is omitted (I = P / V). */
  powerW?: number | null;
};

export type SwitchgearDuty = {
  name: string;
  /** Number of identical devices. */
  quantity: number;
  tripCurrentA: number;
  tripDurationS: number;
  tripOperations: number;
  closeCurrentA: number;
  closeDurationS: number;
  closeOperations: number;
  /** Spring-charge or other motor; use 0 to omit. */
  motorCurrentA: number;
  motorDurationS: number;
  motorOperations: number;
};

export type BatterySizingInput = {
  /** Nominal DC system voltage, V. */
  voltageV: number;
  /** Autonomy / standing-load duration, hours. */
  autonomyH: number;
  standingLoads: StandingLoad[];
  switchgear: SwitchgearDuty[];
  /** Typically 1.25 (80 % remaining capacity at end of life). */
  ageingFactor: number;
  /** Capacity derating at the minimum electrolyte temperature (1.0 at 25 °C). */
  temperatureFactor: number;
  /** Design / contingency margin, typically 1.10. */
  designMargin: number;
};

export type StandingLoadResult = {
  name: string;
  powerW: number;
  currentA: number;
};

export type SwitchgearDutyResult = {
  name: string;
  quantity: number;
  chargeAh: number;
  tripCurrentA: number;
  closeCurrentA: number;
  motorCurrentA: number;
};

export type BatterySizingResult = {
  standingCurrentA: number;
  standingAh: number;
  operationsAh: number;
  uncorrectedAh: number;
  requiredAh: number;
  /** Smallest COMMON_AH_RATINGS value ≥ requiredAh, or null if none. */
  suggestedAh: number | null;
  peakCurrentA: number;
  standingLoads: StandingLoadResult[];
  switchgear: SwitchgearDutyResult[];
  equation: string;
};

export const BATTERY_SIZING_EQUATION =
  "C = (Σ(P/V)·T + Σ(N·I·t·n)/3600) · Kage · Kθ · Km";

export function nextStandardAh(requiredAh: number): number | null {
  if (!(requiredAh > 0) || !Number.isFinite(requiredAh)) return null;
  const match = COMMON_AH_RATINGS.find((size) => size >= requiredAh);
  return match ?? null;
}

/** Resolve a standing load entered as amps, watts, or both (amps win). */
export function resolveStandingLoad(
  load: StandingLoad,
  voltageV: number,
): StandingLoadResult {
  const label = load.name.trim() || "Standing load";
  const hasI = load.currentA != null && Number.isFinite(load.currentA);
  const hasP = load.powerW != null && Number.isFinite(load.powerW);
  if (hasI) {
    assertNonNegative(load.currentA!, `${label} current`);
    return { name: label, currentA: load.currentA!, powerW: load.currentA! * voltageV };
  }
  if (hasP) {
    assertNonNegative(load.powerW!, `${label} power`);
    return { name: label, currentA: load.powerW! / voltageV, powerW: load.powerW! };
  }
  throw new Error(`${label}: enter current or power.`);
}

export function batterySizing(input: BatterySizingInput): BatterySizingResult {
  const {
    voltageV,
    autonomyH,
    standingLoads,
    switchgear,
    ageingFactor,
    temperatureFactor,
    designMargin,
  } = input;

  assertPositive(voltageV, "DC voltage");
  assertPositive(autonomyH, "Autonomy");
  if (autonomyH > AUTONOMY_MAX_H) {
    throw new Error(`Autonomy must be ≤ ${AUTONOMY_MAX_H} h.`);
  }
  assertInRange(ageingFactor, AGEING_FACTOR_MIN, AGEING_FACTOR_MAX, "Ageing factor");
  assertInRange(
    temperatureFactor,
    TEMPERATURE_FACTOR_MIN,
    TEMPERATURE_FACTOR_MAX,
    "Temperature factor",
  );
  assertInRange(designMargin, DESIGN_MARGIN_MIN, DESIGN_MARGIN_MAX, "Design margin");
  if (standingLoads.length === 0 && switchgear.length === 0) {
    throw new Error("Add at least one standing load or switchgear duty.");
  }

  const standingResults: StandingLoadResult[] = standingLoads.map((load, index) =>
    resolveStandingLoad(
      { ...load, name: load.name.trim() || `Standing load ${index + 1}` },
      voltageV,
    ),
  );

  const standingCurrentA = standingResults.reduce((sum, load) => sum + load.currentA, 0);
  const standingAh = standingCurrentA * autonomyH;

  const switchgearResults: SwitchgearDutyResult[] = switchgear.map((duty, index) => {
    const label = duty.name.trim() || `Switchgear ${index + 1}`;
    assertPositiveInteger(duty.quantity, `${label} quantity`);
    assertNonNegative(duty.tripCurrentA, `${label} trip current`);
    assertNonNegative(duty.tripDurationS, `${label} trip duration`);
    assertNonNegativeInteger(duty.tripOperations, `${label} trip operations`);
    assertNonNegative(duty.closeCurrentA, `${label} close current`);
    assertNonNegative(duty.closeDurationS, `${label} close duration`);
    assertNonNegativeInteger(duty.closeOperations, `${label} close operations`);
    assertNonNegative(duty.motorCurrentA, `${label} motor current`);
    assertNonNegative(duty.motorDurationS, `${label} motor duration`);
    assertNonNegativeInteger(duty.motorOperations, `${label} motor operations`);

    const ampereSeconds =
      duty.quantity *
      (duty.tripCurrentA * duty.tripDurationS * duty.tripOperations +
        duty.closeCurrentA * duty.closeDurationS * duty.closeOperations +
        duty.motorCurrentA * duty.motorDurationS * duty.motorOperations);

    return {
      name: label,
      quantity: duty.quantity,
      chargeAh: ampereSeconds / 3600,
      tripCurrentA: duty.quantity * duty.tripCurrentA,
      closeCurrentA: duty.quantity * duty.closeCurrentA,
      motorCurrentA: duty.quantity * duty.motorCurrentA,
    };
  });

  const operationsAh = switchgearResults.reduce((sum, duty) => sum + duty.chargeAh, 0);
  const uncorrectedAh = standingAh + operationsAh;
  const requiredAh = uncorrectedAh * ageingFactor * temperatureFactor * designMargin;

  const tripPeak = switchgearResults.reduce((sum, duty) => sum + duty.tripCurrentA, 0);
  const closePeak = switchgearResults.reduce((sum, duty) => sum + duty.closeCurrentA, 0);
  const motorPeak = switchgearResults.reduce((sum, duty) => sum + duty.motorCurrentA, 0);
  const peakCurrentA = standingCurrentA + Math.max(tripPeak, closePeak, motorPeak, 0);

  return {
    standingCurrentA,
    standingAh,
    operationsAh,
    uncorrectedAh,
    requiredAh,
    suggestedAh: nextStandardAh(requiredAh),
    peakCurrentA,
    standingLoads: standingResults,
    switchgear: switchgearResults,
    equation: BATTERY_SIZING_EQUATION,
  };
}
