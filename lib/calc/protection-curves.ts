/**
 * IEC 60255-151 inverse-time (IDMT) and independent-time characteristics.
 *
 * Operating time:
 *   t = TMS · (k / ((I / Iₛ)^α − 1) + c)
 *
 * IEC A/B/C and long-time inverse use c = 0. Independent (definite) time uses
 * a constant t> for I ≥ I>.
 *
 * Instantaneous (I>>, t>>) is a 50-element: if set and I ≥ I>>, t = t>>.
 */

export type IecCurveId = "iec-si" | "iec-vi" | "iec-ei" | "iec-lti" | "definite-time";

export type IecCurveDefinition = {
  id: IecCurveId;
  /** Short code used on settings lists (IEC A, IEC B, …). */
  code: string;
  name: string;
  /** IEC 60255-151 k (s). Null for independent time. */
  k: number | null;
  alpha: number | null;
  c: number;
};

export const IEC_CURVES: readonly IecCurveDefinition[] = [
  {
    id: "iec-si",
    code: "IEC A",
    name: "Standard Inverse (SI)",
    k: 0.14,
    alpha: 0.02,
    c: 0,
  },
  {
    id: "iec-vi",
    code: "IEC B",
    name: "Very Inverse (VI)",
    k: 13.5,
    alpha: 1,
    c: 0,
  },
  {
    id: "iec-ei",
    code: "IEC C",
    name: "Extremely Inverse (EI)",
    k: 80,
    alpha: 2,
    c: 0,
  },
  {
    id: "iec-lti",
    code: "IEC LTI",
    name: "Long-time Inverse (LTI)",
    k: 120,
    alpha: 1,
    c: 0,
  },
  {
    id: "definite-time",
    code: "DT",
    name: "Independent time (definite time)",
    k: null,
    alpha: null,
    c: 0,
  },
] as const;

export function getIecCurve(id: IecCurveId): IecCurveDefinition {
  const curve = IEC_CURVES.find((item) => item.id === id);
  if (!curve) throw new Error(`Unknown IEC characteristic: ${id}`);
  return curve;
}

export type ProtectionDevice = {
  id: string;
  name: string;
  characteristic: IecCurveId;
  /** I> pickup / Iₛ (A, primary). */
  pickupA: number;
  /** Time multiplier setting (IDMT). Ignored for definite time. */
  tms: number;
  /** t> operating time (s) for independent-time characteristic. */
  definiteTimeS: number;
  /** I>> instantaneous pickup (A). Omit or null to disable the 50 element. */
  instantaneousPickupA?: number | null;
  /** t>> instantaneous delay (s). Used when I ≥ I>>. */
  instantaneousTimeS?: number | null;
};

export type CurvePoint = {
  currentA: number;
  timeS: number;
};

export type DeviceCurve = {
  id: string;
  name: string;
  characteristic: IecCurveId;
  code: string;
  curveName: string;
  points: CurvePoint[];
  equation: string;
};

const MIN_CURRENT_MULTIPLE = 1.05;
const PLOT_TIME_MIN_S = 0.01;
const PLOT_TIME_MAX_S = 1e3;
const DEFAULT_PLOT_POINTS = 64;

export function curveEquation(characteristic: IecCurveId): string {
  const curve = getIecCurve(characteristic);
  if (curve.k === null || curve.alpha === null) {
    return "t = t>  (I ≥ I>)";
  }
  if (curve.c === 0) {
    return `t = TMS · ${formatConst(curve.k)} / ((I/Iₛ)^${formatConst(curve.alpha)} − 1)`;
  }
  return `t = TMS · (${formatConst(curve.k)} / ((I/Iₛ)^${formatConst(curve.alpha)} − 1) + ${formatConst(curve.c)})`;
}

function formatConst(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

export function operatingTimeS(device: ProtectionDevice, currentA: number): number {
  validateDevice(device);
  if (!(currentA > 0)) throw new Error("Current must be greater than zero.");
  if (currentA < device.pickupA) {
    throw new Error("Current is below I> pickup; the element does not operate.");
  }

  const instPickup = optionalPositive(device.instantaneousPickupA);
  const instTime = device.instantaneousTimeS;
  if (instPickup !== null) {
    if (instPickup <= device.pickupA) {
      throw new Error("I>> must be greater than I>.");
    }
    if (currentA >= instPickup) {
      if (instTime === null || instTime === undefined || !(instTime >= 0)) {
        throw new Error("t>> must be ≥ 0 when I>> is set.");
      }
      return instTime;
    }
  }

  if (device.characteristic === "definite-time") {
    if (!(device.definiteTimeS >= 0)) {
      throw new Error("t> must be ≥ 0.");
    }
    return device.definiteTimeS;
  }

  return idmtTimeS(device.characteristic, device.pickupA, device.tms, currentA);
}

export function idmtTimeS(
  characteristic: IecCurveId,
  pickupA: number,
  tms: number,
  currentA: number,
): number {
  const curve = getIecCurve(characteristic);
  if (curve.k === null || curve.alpha === null) {
    throw new Error("IDMT equation does not apply to independent time.");
  }
  if (!(pickupA > 0)) throw new Error("I> pickup must be greater than zero.");
  if (!(tms > 0)) throw new Error("TMS must be greater than zero.");
  if (!(currentA > pickupA)) {
    throw new Error("IDMT current must be greater than I>.");
  }
  const m = currentA / pickupA;
  const denom = m ** curve.alpha - 1;
  if (!(denom > 0)) {
    throw new Error("Current is too close to pickup for a finite IDMT time.");
  }
  return tms * (curve.k / denom + curve.c);
}

export function deviceCurvePoints(
  device: ProtectionDevice,
  currentMaxA: number,
  steps = DEFAULT_PLOT_POINTS,
): CurvePoint[] {
  validateDevice(device);
  const instPickup = optionalPositive(device.instantaneousPickupA);
  const idmtMax = instPickup !== null ? Math.min(currentMaxA, instPickup) : currentMaxA;
  const start = device.pickupA * MIN_CURRENT_MULTIPLE;
  const points: CurvePoint[] = [];

  if (idmtMax > start) {
    const count = Math.max(8, steps);
    for (let i = 0; i < count; i += 1) {
      const ratio = i / (count - 1);
      const currentA = start * (idmtMax / start) ** ratio;
      if (instPickup !== null && currentA >= instPickup) break;
      const timeS = operatingTimeS(device, currentA);
      if (timeS >= PLOT_TIME_MIN_S && timeS <= PLOT_TIME_MAX_S) {
        points.push({ currentA, timeS });
      }
    }
  }

  if (instPickup !== null && currentMaxA >= instPickup) {
    const instTime = operatingTimeS(device, instPickup);
    const plotTime = Math.max(instTime, PLOT_TIME_MIN_S);
    if (points.length > 0) {
      const last = points[points.length - 1]!;
      if (last.currentA < instPickup) {
        points.push({ currentA: instPickup, timeS: last.timeS });
      }
    }
    points.push({ currentA: instPickup, timeS: plotTime });
    points.push({ currentA: currentMaxA, timeS: plotTime });
  }

  return points;
}

export function overlayCurves(
  devices: ProtectionDevice[],
  currentMaxA: number,
  steps = DEFAULT_PLOT_POINTS,
): DeviceCurve[] {
  if (!(currentMaxA > 0)) throw new Error("Chart maximum current must be greater than zero.");
  return devices.map((device) => {
    const curve = getIecCurve(device.characteristic);
    return {
      id: device.id,
      name: device.name,
      characteristic: device.characteristic,
      code: curve.code,
      curveName: curve.name,
      points: deviceCurvePoints(device, currentMaxA, steps),
      equation: curveEquation(device.characteristic),
    };
  });
}

export function suggestedCurrentMaxA(
  devices: ProtectionDevice[],
  faultCurrentA?: number | null,
): number {
  const candidates = devices.flatMap((device) => {
    const inst = optionalPositive(device.instantaneousPickupA);
    return [device.pickupA * 50, inst === null ? 0 : inst * 2];
  });
  if (faultCurrentA && faultCurrentA > 0) candidates.push(faultCurrentA * 1.2);
  const max = Math.max(1, ...candidates);
  return max;
}

function validateDevice(device: ProtectionDevice): void {
  if (!(device.pickupA > 0)) throw new Error("I> pickup must be greater than zero.");
  if (device.characteristic !== "definite-time" && !(device.tms > 0)) {
    throw new Error("TMS must be greater than zero.");
  }
  const instPickup = optionalPositive(device.instantaneousPickupA);
  if (instPickup !== null && instPickup <= device.pickupA) {
    throw new Error("I>> must be greater than I>.");
  }
}

function optionalPositive(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!(value > 0)) return null;
  return value;
}
