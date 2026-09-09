import { assertNonNegative, assertPositive } from "./assert";

/**
 * IEC 60255-151 inverse-time (IDMT) and independent-time characteristics,
 * plus generic IEC 60269-style fuse melting curves for coordination overlays.
 *
 * Relay operating time:
 *   t = TMS · (k / ((I / Iₛ)^α − 1) + c)
 *
 * IEC A/B/C and long-time inverse use c = 0. Independent (definite) time uses
 * a constant t> for I ≥ I>. Instantaneous (I>>, t>>) is a 50-element: if set
 * and I ≥ I>>, t = t>>.
 *
 * Fuse curves are mid-band approximations of typical gG / aM melting times
 * (I/In multiples → log–log interpolation). Always confirm against the
 * manufacturer’s published melting and total-clearing data.
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

export type FuseClassId = "gg" | "am";

export type FuseClassDefinition = {
  id: FuseClassId;
  code: string;
  name: string;
  description: string;
};

export const FUSE_CLASSES: readonly FuseClassDefinition[] = [
  {
    id: "gg",
    code: "gG",
    name: "gG — general purpose",
    description: "Full-range cable / general protection (IEC 60269).",
  },
  {
    id: "am",
    code: "aM",
    name: "aM — motor circuit (partial range)",
    description: "Short-circuit only; rides through motor starting (IEC 60269).",
  },
] as const;

export function getFuseClass(id: FuseClassId): FuseClassDefinition {
  const fuseClass = FUSE_CLASSES.find((item) => item.id === id);
  if (!fuseClass) throw new Error(`Unknown fuse class: ${id}`);
  return fuseClass;
}

/** Minimum recommended grading margin between successive layers (s). */
export const GRADING_MARGIN_S = 0.05;

/** Practical upper bound for TMS (typical IEC relays are 0.025–1.5). */
export const TMS_MAX = 10;

export type RelayProtectionDevice = {
  kind: "relay";
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

export type FuseProtectionDevice = {
  kind: "fuse";
  id: string;
  name: string;
  fuseClass: FuseClassId;
  /** Fuse rated current In (A). */
  ratedCurrentA: number;
};

export type ProtectionDevice = RelayProtectionDevice | FuseProtectionDevice;

export type CurvePoint = {
  currentA: number;
  timeS: number;
};

export type DeviceCurve = {
  id: string;
  name: string;
  kind: ProtectionDevice["kind"];
  code: string;
  curveName: string;
  points: CurvePoint[];
  equation: string;
};

export type TripResult =
  | { id: string; name: string; ok: true; timeS: number }
  | { id: string; name: string; ok: false; message: string };

export type GradingMargin = {
  fasterId: string;
  fasterName: string;
  slowerId: string;
  slowerName: string;
  deltaS: number;
  belowMargin: boolean;
};

type FuseCurvePoint = { multiple: number; timeS: number };

/**
 * Mid-band melting approximations (I/In → t). Composite of IEC 60269 gates and
 * typical published gG curves — not manufacturer-specific.
 */
const GG_MELTING_POINTS: readonly FuseCurvePoint[] = [
  { multiple: 1.6, timeS: 3600 },
  { multiple: 2.0, timeS: 200 },
  { multiple: 3.0, timeS: 12 },
  { multiple: 4.0, timeS: 4 },
  { multiple: 5.0, timeS: 2.5 },
  { multiple: 8.0, timeS: 0.4 },
  { multiple: 10.0, timeS: 0.15 },
  { multiple: 20.0, timeS: 0.03 },
  { multiple: 50.0, timeS: 0.008 },
  { multiple: 100.0, timeS: 0.003 },
];

/** Mid-band aM melting approximations — partial-range, starts ~4× In. */
const AM_MELTING_POINTS: readonly FuseCurvePoint[] = [
  { multiple: 4.0, timeS: 100 },
  { multiple: 5.0, timeS: 18 },
  { multiple: 6.3, timeS: 8 },
  { multiple: 8.0, timeS: 1.5 },
  { multiple: 10.0, timeS: 0.55 },
  { multiple: 12.5, timeS: 0.22 },
  { multiple: 19.0, timeS: 0.05 },
  { multiple: 50.0, timeS: 0.01 },
  { multiple: 100.0, timeS: 0.004 },
];

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

export function fuseEquation(fuseClass: FuseClassId): string {
  const def = getFuseClass(fuseClass);
  return `Generic ${def.code} melting curve (log–log mid-band vs I/In)`;
}

function formatConst(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

export function operatingTimeS(device: ProtectionDevice, currentA: number): number {
  if (!(currentA > 0)) throw new Error("Current must be greater than zero.");
  if (device.kind === "fuse") {
    return fuseMeltingTimeS(device.fuseClass, device.ratedCurrentA, currentA);
  }
  return relayOperatingTimeS(device, currentA);
}

function relayOperatingTimeS(device: RelayProtectionDevice, currentA: number): number {
  validateRelay(device);
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

export function fuseMeltingTimeS(
  fuseClass: FuseClassId,
  ratedCurrentA: number,
  currentA: number,
): number {
  if (!(ratedCurrentA > 0)) throw new Error("Fuse rated current must be greater than zero.");
  if (!(currentA > 0)) throw new Error("Current must be greater than zero.");
  const points = fuseClass === "gg" ? GG_MELTING_POINTS : AM_MELTING_POINTS;
  const multiple = currentA / ratedCurrentA;
  const first = points[0]!;
  if (multiple < first.multiple) {
    throw new Error(
      `Current is below the generic ${getFuseClass(fuseClass).code} operating range (~${first.multiple}× In).`,
    );
  }
  return interpolateLogLog(points, multiple);
}

function interpolateLogLog(points: readonly FuseCurvePoint[], multiple: number): number {
  const last = points[points.length - 1]!;
  if (multiple >= last.multiple) {
    // Mild I²t-style extrapolation beyond the last tabulated point.
    return last.timeS * (last.multiple / multiple) ** 2;
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (multiple >= a.multiple && multiple <= b.multiple) {
      const logM = Math.log(multiple);
      const logMa = Math.log(a.multiple);
      const logMb = Math.log(b.multiple);
      const ratio = (logM - logMa) / (logMb - logMa);
      const logT = Math.log(a.timeS) + ratio * (Math.log(b.timeS) - Math.log(a.timeS));
      return Math.exp(logT);
    }
  }
  throw new Error("Unable to interpolate fuse melting time.");
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
  if (tms > TMS_MAX) throw new Error(`TMS must be ≤ ${TMS_MAX}.`);
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
  if (device.kind === "fuse") {
    return fuseCurvePoints(device, currentMaxA, steps);
  }
  return relayCurvePoints(device, currentMaxA, steps);
}

function fuseCurvePoints(
  device: FuseProtectionDevice,
  currentMaxA: number,
  steps: number,
): CurvePoint[] {
  validateFuse(device);
  const pointsTable = device.fuseClass === "gg" ? GG_MELTING_POINTS : AM_MELTING_POINTS;
  const start = device.ratedCurrentA * pointsTable[0]!.multiple;
  const end = Math.max(currentMaxA, start * 1.01);
  if (!(end > start)) return [];

  const count = Math.max(8, steps);
  const points: CurvePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1);
    const currentA = start * (end / start) ** ratio;
    try {
      const timeS = fuseMeltingTimeS(device.fuseClass, device.ratedCurrentA, currentA);
      if (timeS >= PLOT_TIME_MIN_S && timeS <= PLOT_TIME_MAX_S) {
        points.push({ currentA, timeS });
      }
    } catch {
      // Skip currents outside the modelled range.
    }
  }
  return points;
}

function relayCurvePoints(
  device: RelayProtectionDevice,
  currentMaxA: number,
  steps: number,
): CurvePoint[] {
  validateRelay(device);
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
    if (device.kind === "fuse") {
      const fuseClass = getFuseClass(device.fuseClass);
      return {
        id: device.id,
        name: device.name,
        kind: "fuse",
        code: fuseClass.code,
        curveName: fuseClass.name,
        points: deviceCurvePoints(device, currentMaxA, steps),
        equation: fuseEquation(device.fuseClass),
      };
    }
    const curve = getIecCurve(device.characteristic);
    return {
      id: device.id,
      name: device.name,
      kind: "relay",
      code: curve.code,
      curveName: curve.name,
      points: deviceCurvePoints(device, currentMaxA, steps),
      equation: curveEquation(device.characteristic),
    };
  });
}

/**
 * Shared log-spaced current rows for multi-series Recharts overlays.
 * Each row is one fault current with a column per device id, so tooltip /
 * active dots stay locked to the hovered current instead of mixing by index.
 */
export type OverlayChartRow = { currentA: number } & Record<string, number>;

export function overlayChartRows(
  devices: ProtectionDevice[],
  currentMaxA: number,
  steps = DEFAULT_PLOT_POINTS,
): OverlayChartRow[] {
  if (!(currentMaxA > 0)) throw new Error("Chart maximum current must be greater than zero.");
  if (devices.length === 0) return [];

  const starts = devices.map(deviceStartCurrentA);
  const currentMinA = Math.min(...starts);
  if (!(currentMaxA > currentMinA)) {
    return buildChartRows(devices, [currentMaxA]);
  }

  const currents = new Set<number>();
  const count = Math.max(8, steps);
  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1);
    currents.add(currentMinA * (currentMaxA / currentMinA) ** ratio);
  }
  for (const device of devices) {
    const start = deviceStartCurrentA(device);
    if (start <= currentMaxA) currents.add(start);
    if (device.kind === "relay") {
      const inst = optionalPositive(device.instantaneousPickupA);
      if (inst !== null && inst <= currentMaxA) {
        currents.add(Math.max(start, inst * 0.999));
        currents.add(inst);
      }
    }
  }

  const sorted = [...currents]
    .filter((currentA) => currentA >= currentMinA && currentA <= currentMaxA)
    .sort((a, b) => a - b);
  return buildChartRows(devices, sorted);
}

function deviceStartCurrentA(device: ProtectionDevice): number {
  if (device.kind === "fuse") {
    const points = device.fuseClass === "gg" ? GG_MELTING_POINTS : AM_MELTING_POINTS;
    return device.ratedCurrentA * points[0]!.multiple;
  }
  return device.pickupA * MIN_CURRENT_MULTIPLE;
}

function buildChartRows(
  devices: ProtectionDevice[],
  currents: number[],
): OverlayChartRow[] {
  return currents.map((currentA) => {
    const row: OverlayChartRow = { currentA };
    for (const device of devices) {
      try {
        const timeS = operatingTimeS(device, currentA);
        if (timeS >= PLOT_TIME_MIN_S && timeS <= PLOT_TIME_MAX_S) {
          row[device.id] = timeS;
        }
      } catch {
        // Device does not operate at this current — omit so the series gaps.
      }
    }
    return row;
  });
}

export function suggestedCurrentMaxA(
  devices: ProtectionDevice[],
  faultCurrentsA: number | number[] | null | undefined = null,
): number {
  const faults = Array.isArray(faultCurrentsA)
    ? faultCurrentsA
    : faultCurrentsA && faultCurrentsA > 0
      ? [faultCurrentsA]
      : [];

  const candidates = devices.flatMap((device) => {
    if (device.kind === "fuse") {
      return [device.ratedCurrentA * 100];
    }
    const inst = optionalPositive(device.instantaneousPickupA);
    return [device.pickupA * 50, inst === null ? 0 : inst * 2];
  });
  for (const fault of faults) {
    if (fault > 0) candidates.push(fault * 1.2);
  }
  return Math.max(1, ...candidates);
}

export function deviceTripsAt(
  devices: ProtectionDevice[],
  faultCurrentA: number,
): TripResult[] {
  return devices.map((device) => {
    try {
      return {
        id: device.id,
        name: device.name,
        ok: true as const,
        timeS: operatingTimeS(device, faultCurrentA),
      };
    } catch (error) {
      return {
        id: device.id,
        name: device.name,
        ok: false as const,
        message: error instanceof Error ? error.message : "No trip",
      };
    }
  });
}

/**
 * Grading margins between devices that operate, ordered fastest → slowest
 * (typical downstream → upstream layering).
 */
export function gradingMargins(
  trips: TripResult[],
  marginS: number = GRADING_MARGIN_S,
): GradingMargin[] {
  const operating = trips
    .filter((trip): trip is Extract<TripResult, { ok: true }> => trip.ok)
    .slice()
    .sort((a, b) => a.timeS - b.timeS || a.name.localeCompare(b.name));

  const margins: GradingMargin[] = [];
  for (let i = 0; i < operating.length - 1; i += 1) {
    const faster = operating[i]!;
    const slower = operating[i + 1]!;
    const deltaS = slower.timeS - faster.timeS;
    margins.push({
      fasterId: faster.id,
      fasterName: faster.name,
      slowerId: slower.id,
      slowerName: slower.name,
      deltaS,
      belowMargin: deltaS < marginS,
    });
  }
  return margins;
}

function validateRelay(device: RelayProtectionDevice): void {
  assertPositive(device.pickupA, "I> pickup");
  if (device.characteristic !== "definite-time") {
    assertPositive(device.tms, "TMS");
    if (device.tms > TMS_MAX) throw new Error(`TMS must be ≤ ${TMS_MAX}.`);
  } else {
    assertNonNegative(device.definiteTimeS, "t>");
  }
  const instPickup = optionalPositive(device.instantaneousPickupA);
  if (instPickup !== null && instPickup <= device.pickupA) {
    throw new Error("I>> must be greater than I>.");
  }
  if (instPickup !== null) {
    if (
      device.instantaneousTimeS === null ||
      device.instantaneousTimeS === undefined
    ) {
      throw new Error("t>> must be ≥ 0 when I>> is set.");
    }
    assertNonNegative(device.instantaneousTimeS, "t>>");
  }
}

function validateFuse(device: FuseProtectionDevice): void {
  if (!(device.ratedCurrentA > 0)) {
    throw new Error("Fuse rated current must be greater than zero.");
  }
  getFuseClass(device.fuseClass);
}

function optionalPositive(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!(value > 0)) return null;
  return value;
}
