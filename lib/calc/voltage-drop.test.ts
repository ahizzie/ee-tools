import { describe, expect, it } from "vitest";
import { voltageDropIec, voltageDropVsLength } from "./voltage-drop";

describe("voltageDropIec", () => {
  it("matches a copper 3-phase worked example at 20 °C, X = 0", () => {
    const result = voltageDropIec({
      material: "copper",
      circuit: "three-phase",
      lengthM: 100,
      currentA: 100,
      sectionMm2: 25,
      temperatureC: 20,
      powerFactor: 1,
      reactanceOhmPerKm: 0,
      nominalVoltageV: 400,
    });
    const r = (0.017241 * 100) / 25;
    const expected = Math.sqrt(3) * 100 * r;
    expect(result.voltageDropV).toBeCloseTo(expected, 8);
    expect(result.percentDrop).toBeCloseTo((100 * expected) / 400, 8);
  });

  it("uses a factor of 2 for single-phase", () => {
    const three = voltageDropIec({
      material: "copper",
      circuit: "three-phase",
      lengthM: 50,
      currentA: 20,
      sectionMm2: 10,
      temperatureC: 20,
      powerFactor: 0.9,
      reactanceOhmPerKm: 0.08,
      nominalVoltageV: 400,
    });
    const single = voltageDropIec({
      material: "copper",
      circuit: "single-phase",
      lengthM: 50,
      currentA: 20,
      sectionMm2: 10,
      temperatureC: 20,
      powerFactor: 0.9,
      reactanceOhmPerKm: 0.08,
      nominalVoltageV: 230,
    });
    expect(single.voltageDropV / three.voltageDropV).toBeCloseTo(2 / Math.sqrt(3), 8);
  });

  it("builds a monotonic %VD vs length curve", () => {
    const curve = voltageDropVsLength(
      {
        material: "copper",
        circuit: "three-phase",
        currentA: 50,
        sectionMm2: 16,
        temperatureC: 70,
        powerFactor: 0.85,
        reactanceOhmPerKm: 0.08,
        nominalVoltageV: 400,
      },
      200,
      10,
    );
    expect(curve).toHaveLength(10);
    expect(curve[9]!.percentDrop).toBeGreaterThan(curve[0]!.percentDrop);
  });

  it("rejects power factor outside 0–1", () => {
    expect(() =>
      voltageDropIec({
        material: "copper",
        circuit: "three-phase",
        lengthM: 100,
        currentA: 80,
        sectionMm2: 25,
        temperatureC: 70,
        powerFactor: 1.2,
        reactanceOhmPerKm: 0,
        nominalVoltageV: 400,
      }),
    ).toThrow(/Power factor/);
  });

  it("rejects negative current, length, and reactance", () => {
    const base = {
      material: "copper" as const,
      circuit: "three-phase" as const,
      lengthM: 100,
      currentA: 80,
      sectionMm2: 25,
      temperatureC: 70,
      powerFactor: 0.85,
      reactanceOhmPerKm: 0.08,
      nominalVoltageV: 400,
    };
    expect(() => voltageDropIec({ ...base, currentA: -80 })).toThrow(/Current must be ≥ 0/);
    expect(() => voltageDropIec({ ...base, lengthM: 0 })).toThrow(/Length must be greater than zero/);
    expect(() => voltageDropIec({ ...base, reactanceOhmPerKm: -0.08 })).toThrow(
      /Reactance must be ≥ 0/,
    );
  });

  it("rejects conductor temperature outside −50 to 250 °C", () => {
    const base = {
      material: "copper" as const,
      circuit: "three-phase" as const,
      lengthM: 100,
      currentA: 80,
      sectionMm2: 25,
      powerFactor: 0.85,
      reactanceOhmPerKm: 0,
      nominalVoltageV: 400,
    };
    expect(() => voltageDropIec({ ...base, temperatureC: -80 })).toThrow(
      /Conductor temperature/,
    );
    expect(() => voltageDropIec({ ...base, temperatureC: 400 })).toThrow(
      /Conductor temperature/,
    );
  });

  it("rejects a non-positive cross-section", () => {
    expect(() =>
      voltageDropIec({
        material: "copper",
        circuit: "three-phase",
        lengthM: 100,
        currentA: 80,
        sectionMm2: 0,
        temperatureC: 70,
        powerFactor: 0.85,
        reactanceOhmPerKm: 0,
        nominalVoltageV: 400,
      }),
    ).toThrow(/cross-section/);
  });
});
