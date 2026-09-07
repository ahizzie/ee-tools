import { describe, expect, it } from "vitest";
import {
  deviceCurvePoints,
  getIecCurve,
  idmtTimeS,
  operatingTimeS,
  overlayCurves,
  suggestedCurrentMaxA,
  type ProtectionDevice,
} from "./protection-curves";

const baseDevice = (overrides: Partial<ProtectionDevice> = {}): ProtectionDevice => ({
  id: "d1",
  name: "Relay 1",
  characteristic: "iec-si",
  pickupA: 100,
  tms: 1,
  definiteTimeS: 1,
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

  it("overlays several devices and suggests a chart current span", () => {
    const devices = [
      baseDevice({ id: "dn", name: "Downstream", pickupA: 100, tms: 0.1 }),
      baseDevice({ id: "up", name: "Upstream", pickupA: 250, tms: 0.3 }),
    ];
    const curves = overlayCurves(devices, suggestedCurrentMaxA(devices, 2000), 16);
    expect(curves).toHaveLength(2);
    expect(curves[0]!.code).toBe("IEC A");
    expect(getIecCurve("iec-vi").code).toBe("IEC B");
    expect(suggestedCurrentMaxA(devices, 2000)).toBeGreaterThan(2000);
  });
});
