import { describe, expect, it } from "vitest";
import {
  deviceCurvePoints,
  deviceTripsAt,
  fuseMeltingTimeS,
  getFuseClass,
  getIecCurve,
  gradingMargins,
  GRADING_MARGIN_S,
  idmtTimeS,
  operatingTimeS,
  overlayChartRows,
  overlayCurves,
  suggestedCurrentMaxA,
  type ProtectionDevice,
  type RelayProtectionDevice,
} from "./protection-curves";

const baseDevice = (
  overrides: Partial<RelayProtectionDevice> = {},
): RelayProtectionDevice => ({
  kind: "relay",
  id: "d1",
  name: "Relay 1",
  characteristic: "iec-si",
  pickupA: 100,
  tms: 1,
  definiteTimeS: 1,
  ...overrides,
});

const baseFuse = (
  overrides: Partial<Extract<ProtectionDevice, { kind: "fuse" }>> = {},
): Extract<ProtectionDevice, { kind: "fuse" }> => ({
  kind: "fuse",
  id: "f1",
  name: "Fuse 1",
  fuseClass: "gg",
  ratedCurrentA: 100,
  ...overrides,
});

describe("IEC 60255-151 IDMT times at 10 × Iₛ, TMS = 1", () => {
  it("matches the Standard Inverse [3 s / 10] characteristic", () => {
    const time = idmtTimeS("iec-si", 100, 1, 1000);
    expect(time).toBeCloseTo(0.14 / (10 ** 0.02 - 1), 10);
    expect(time).toBeCloseTo(2.97, 2);
  });

  it("matches Very Inverse [1.5 s / 10]", () => {
    expect(idmtTimeS("iec-vi", 100, 1, 1000)).toBeCloseTo(13.5 / 9, 10);
  });

  it("matches Extremely Inverse [0.8 s / 10]", () => {
    expect(idmtTimeS("iec-ei", 100, 1, 1000)).toBeCloseTo(80 / 99, 10);
  });

  it("matches Long-time Inverse [13.3 s / 10]", () => {
    expect(idmtTimeS("iec-lti", 100, 1, 1000)).toBeCloseTo(120 / 9, 10);
  });

  it("scales linearly with TMS", () => {
    const full = idmtTimeS("iec-si", 200, 1, 2000);
    const half = idmtTimeS("iec-si", 200, 0.5, 2000);
    expect(half).toBeCloseTo(full / 2, 10);
  });
});

describe("operatingTimeS", () => {
  it("returns t> for independent time above pickup", () => {
    const device = baseDevice({
      characteristic: "definite-time",
      definiteTimeS: 0.4,
    });
    expect(operatingTimeS(device, 150)).toBe(0.4);
  });

  it("uses t>> when current reaches I>>", () => {
    const device = baseDevice({
      instantaneousPickupA: 800,
      instantaneousTimeS: 0.05,
    });
    expect(operatingTimeS(device, 800)).toBe(0.05);
    expect(operatingTimeS(device, 2000)).toBe(0.05);
    expect(operatingTimeS(device, 400)).toBeCloseTo(idmtTimeS("iec-si", 100, 1, 400), 10);
  });

  it("rejects current below I>", () => {
    expect(() => operatingTimeS(baseDevice(), 99)).toThrow(/below I>/);
  });
});

describe("generic fuse melting curves", () => {
  it("exposes gG and aM classes", () => {
    expect(getFuseClass("gg").code).toBe("gG");
    expect(getFuseClass("am").code).toBe("aM");
  });

  it("matches near-enough gG times at 5× and 10× In", () => {
    expect(fuseMeltingTimeS("gg", 100, 500)).toBeCloseTo(2.5, 5);
    expect(fuseMeltingTimeS("gg", 100, 1000)).toBeCloseTo(0.15, 5);
  });

  it("rejects currents below the aM operating band", () => {
    expect(() => fuseMeltingTimeS("am", 100, 300)).toThrow(/operating range/);
  });

  it("makes aM slower than gG in the moderate overload region", () => {
    const gg = fuseMeltingTimeS("gg", 100, 500);
    const am = fuseMeltingTimeS("am", 100, 500);
    expect(am).toBeGreaterThan(gg);
  });

  it("plots a decreasing fuse curve", () => {
    const points = deviceCurvePoints(baseFuse(), 10_000, 24);
    expect(points.length).toBeGreaterThan(8);
    expect(points[0]!.timeS).toBeGreaterThan(points[points.length - 1]!.timeS);
  });
});

describe("deviceCurvePoints / overlay", () => {
  it("builds a decreasing IDMT curve then a horizontal I>> segment", () => {
    const points = deviceCurvePoints(
      baseDevice({
        instantaneousPickupA: 1000,
        instantaneousTimeS: 0.04,
      }),
      4000,
      20,
    );
    expect(points.length).toBeGreaterThan(10);
    const beforeInst = points.filter((p) => p.currentA < 1000);
    expect(beforeInst[0]!.timeS).toBeGreaterThan(beforeInst[beforeInst.length - 1]!.timeS);
    expect(points[points.length - 1]).toEqual({ currentA: 4000, timeS: 0.04 });
  });

  it("overlays relays and fuses and spans min/max fault currents", () => {
    const devices: ProtectionDevice[] = [
      baseFuse({ id: "fuse", name: "Outgoing fuse", ratedCurrentA: 63 }),
      baseDevice({ id: "up", name: "Upstream", pickupA: 250, tms: 0.3 }),
    ];
    const maxA = suggestedCurrentMaxA(devices, [800, 5000]);
    const curves = overlayCurves(devices, maxA, 16);
    expect(curves).toHaveLength(2);
    expect(curves[0]!.code).toBe("gG");
    expect(curves[1]!.code).toBe("IEC A");
    expect(getIecCurve("iec-vi").code).toBe("IEC B");
    expect(maxA).toBeGreaterThan(5000);
  });

  it("builds shared current rows so every series uses the same fault current", () => {
    const devices: ProtectionDevice[] = [
      baseDevice({ id: "dn", name: "Downstream", pickupA: 100, tms: 0.1 }),
      baseDevice({ id: "up", name: "Upstream", pickupA: 250, tms: 0.3 }),
    ];
    const rows = overlayChartRows(devices, 5000, 24);
    expect(rows.length).toBeGreaterThan(10);
    const mid = rows.find((row) => row.currentA > 400 && row.dn !== undefined && row.up !== undefined);
    expect(mid).toBeDefined();
    expect(mid!.dn).toBeCloseTo(operatingTimeS(devices[0]!, mid!.currentA), 10);
    expect(mid!.up).toBeCloseTo(operatingTimeS(devices[1]!, mid!.currentA), 10);
    expect(mid!.dn).toBeLessThan(mid!.up!);
  });
});

describe("gradingMargins", () => {
  it("inserts deltas between operating layers and flags < 50 ms", () => {
    const trips = deviceTripsAt(
      [
        baseDevice({ id: "dn", name: "Downstream", pickupA: 100, tms: 0.1 }),
        baseDevice({ id: "up", name: "Upstream", pickupA: 250, tms: 0.12 }),
      ],
      2000,
    );
    const margins = gradingMargins(trips);
    expect(margins).toHaveLength(1);
    expect(margins[0]!.fasterName).toBe("Downstream");
    expect(margins[0]!.slowerName).toBe("Upstream");
    expect(margins[0]!.deltaS).toBeGreaterThan(0);
    expect(GRADING_MARGIN_S).toBe(0.05);
  });

  it("marks tight grading in red threshold terms", () => {
    const margins = gradingMargins([
      { id: "a", name: "A", ok: true, timeS: 0.1 },
      { id: "b", name: "B", ok: true, timeS: 0.13 },
    ]);
    expect(margins[0]!.deltaS).toBeCloseTo(0.03, 10);
    expect(margins[0]!.belowMargin).toBe(true);
  });
});
