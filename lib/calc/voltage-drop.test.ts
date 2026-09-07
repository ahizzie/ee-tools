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
});
