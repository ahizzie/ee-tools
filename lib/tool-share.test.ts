import { describe, expect, it } from "vitest";
import { tools } from "@/config/tools";
import {
  adiabaticCodec,
  adiabaticExamples,
  ampsKwCodec,
  ampsKwExamples,
  batterySizingCodec,
  batterySizingExamples,
  getToolExamples,
  meteringCtBurdenCodec,
  meteringCtBurdenExamples,
  protectionCtAlfCodec,
  protectionCtAlfExamples,
  protectionCurvesCodec,
  protectionCurvesExamples,
  threePhaseCodec,
  threePhaseExamples,
  toolShare,
  voltageDropCodec,
  voltageDropExamples,
} from "@/config/tool-share";
import { adiabaticKFactor, adiabaticMinSection } from "@/lib/calc/adiabatic";
import { threePhaseAmpsKw } from "@/lib/calc/amps-kw";
import { batterySizing } from "@/lib/calc/battery-sizing";
import { meteringCtBurden } from "@/lib/calc/metering-ct-burden";
import { protectionCtAlf } from "@/lib/calc/protection-ct-alf";
import { idmtTimeS, operatingTimeS } from "@/lib/calc/protection-curves";
import { threePhasePower } from "@/lib/calc/three-phase";
import { voltageDropIec } from "@/lib/calc/voltage-drop";
import { parseOptionalNumber, toBase } from "@/lib/units";

describe("toolShare registry", () => {
  it("covers every registered tool with 1–2 examples", () => {
    expect(Object.keys(toolShare).sort()).toEqual(tools.map((tool) => tool.slug).sort());
    for (const tool of tools) {
      const examples = getToolExamples(tool.slug);
      expect(examples.length, tool.slug).toBeGreaterThanOrEqual(1);
      expect(examples.length, tool.slug).toBeLessThanOrEqual(2);
      for (const example of examples) {
        expect(example.id.length).toBeGreaterThan(0);
        expect(example.label.length).toBeGreaterThan(3);
      }
    }
  });

  it("round-trips example state through the share codec", () => {
    for (const example of ampsKwExamples) {
      expect(ampsKwCodec.decode(ampsKwCodec.encode(example.state))).toEqual(example.state);
    }
    for (const example of threePhaseExamples) {
      expect(threePhaseCodec.decode(threePhaseCodec.encode(example.state))).toEqual(example.state);
    }
    for (const example of voltageDropExamples) {
      expect(voltageDropCodec.decode(voltageDropCodec.encode(example.state))).toEqual(
        example.state,
      );
    }
    for (const example of adiabaticExamples) {
      expect(adiabaticCodec.decode(adiabaticCodec.encode(example.state))).toEqual(example.state);
    }
    for (const example of protectionCurvesExamples) {
      expect(protectionCurvesCodec.decode(protectionCurvesCodec.encode(example.state))).toEqual(
        example.state,
      );
    }
    for (const example of protectionCtAlfExamples) {
      expect(protectionCtAlfCodec.decode(protectionCtAlfCodec.encode(example.state))).toEqual(
        example.state,
      );
    }
    for (const example of meteringCtBurdenExamples) {
      expect(meteringCtBurdenCodec.decode(meteringCtBurdenCodec.encode(example.state))).toEqual(
        example.state,
      );
    }
    for (const example of batterySizingExamples) {
      expect(batterySizingCodec.decode(batterySizingCodec.encode(example.state))).toEqual(
        example.state,
      );
    }
  });
});

describe("worked examples match textbook / Vitest cases", () => {
  it("amps-kw 400 V, 10 A, pf 0.8", () => {
    const example = ampsKwExamples[0]!;
    const result = threePhaseAmpsKw({
      lineVoltage: Number(example.state.voltage),
      current: Number(example.state.current),
      powerFactor: Number(example.state.pf),
    });
    expect(result.activePowerKw).toBeCloseTo((Math.sqrt(3) * 400 * 10 * 0.8) / 1000, 8);
  });

  it("three-phase 400 V, 10 A, pf 0.8", () => {
    const result = threePhasePower({
      lineVoltage: 400,
      current: 10,
      powerFactor: 0.8,
    });
    const s = Math.sqrt(3) * 400 * 10;
    expect(result.apparentPower).toBeCloseTo(s, 8);
    expect(result.activePower).toBeCloseTo(s * 0.8, 8);
  });

  it("voltage-drop copper 25 mm² at 20 °C, X = 0", () => {
    const example = voltageDropExamples[0]!;
    const result = voltageDropIec({
      material: "copper",
      circuit: "three-phase",
      lengthM: Number(example.state.length),
      currentA: Number(example.state.current),
      sectionMm2: Number(example.state.section),
      temperatureC: Number(example.state.temp),
      powerFactor: Number(example.state.pf),
      reactanceOhmPerKm: Number(example.state.xPerKm),
      nominalVoltageV: Number(example.state.nominal),
    });
    const expected = Math.sqrt(3) * 100 * ((0.017241 * 100) / 25);
    expect(result.voltageDropV).toBeCloseTo(expected, 8);
  });

  it("adiabatic copper PVC 10 kA, 1 s", () => {
    const k = adiabaticKFactor({ material: "copper", initialTempC: 70, finalTempC: 160 });
    const result = adiabaticMinSection({ currentA: 10_000, durationS: 1, k });
    expect(result.sectionMm2).toBeCloseTo(10_000 / k, 8);
  });

  it("protection SI at 10 × Iₛ, TMS = 1 is ≈ 2.97 s", () => {
    expect(idmtTimeS("iec-si", 100, 1, 1000)).toBeCloseTo(2.97, 2);
    const device = protectionCurvesExamples[0]!.state.devices[0]!;
    expect(
      operatingTimeS(
        {
          kind: "relay",
          id: device.id,
          name: device.name,
          characteristic: "iec-si",
          pickupA: Number(device.pickup),
          tms: Number(device.tms),
          definiteTimeS: 0.4,
        },
        1000,
      ),
    ).toBeCloseTo(2.97, 2);
  });

  it("protection CT ALF workbook default is not adequate", () => {
    const r = protectionCtAlf({
      ctPrimaryA: 600,
      ctSecondaryA: 1,
      ratedAlf: 20,
      minFaultCurrentA: 31500,
      ratedBurdenVa: 15,
      ctResistanceOhm: 3,
      relayResistanceOhm: 0.1,
      wiringLengthM: 40,
      wiringCsaMm2: 2.5,
      safetyFactor: 2,
    });
    expect(r.adequate).toBe(false);
    expect(protectionCtAlfExamples[1]!.state.ratedAlf).toBe("40");
  });

  it("metering CT workbook default is under-burdened; 0.5 VA is ok", () => {
    const input = {
      loadCapacityVa: 50e6,
      voltageV: 33e3,
      voltageDeviationPu: 0.94,
      ctPrimaryA: 1000,
      ctSecondaryA: 1,
      wiringLengthM: 40,
      wiringCsaMm2: 2.5,
      meterResistanceOhm: 0.1,
      extraResistanceOhm: 0,
      ratedBurdenVa: 10,
    };
    expect(meteringCtBurden(input).status).toBe("under");
    expect(meteringCtBurden({ ...input, ratedBurdenVa: 0.5 }).status).toBe("ok");
    expect(meteringCtBurdenExamples[1]!.state.burden).toBe("0.5");
  });

  it("battery textbook example is 70.125 Ah → 80 Ah C10", () => {
    const example = batterySizingExamples[0]!;
    const load = example.state.loads[0]!;
    const swg = example.state.switchgear[0]!;
    const r = batterySizing({
      voltageV: Number(example.state.voltage),
      autonomyH: Number(example.state.autonomy),
      standingLoads: [{ name: load.name, powerW: Number(load.power) }],
      switchgear: [
        {
          name: swg.name,
          quantity: Number(swg.quantity),
          tripCurrentA: Number(swg.tripCurrent),
          tripDurationS: Number(swg.tripDuration),
          tripOperations: Number(swg.tripOperations),
          closeCurrentA: Number(swg.closeCurrent),
          closeDurationS: Number(swg.closeDuration),
          closeOperations: Number(swg.closeOperations),
          motorCurrentA: Number(swg.motorCurrent),
          motorDurationS: Number(swg.motorDuration),
          motorOperations: Number(swg.motorOperations),
        },
      ],
      ageingFactor: Number(example.state.ageing),
      temperatureFactor: Number(example.state.temperature),
      designMargin: Number(example.state.margin),
    });
    expect(r.standingCurrentA).toBeCloseTo(10, 12);
    expect(r.requiredAh).toBeCloseTo(51 * 1.25 * 1.1, 12);
    expect(r.suggestedAh).toBe(80);
  });
});

describe("share decode ignores junk on a real tool codec", () => {
  it("amps-kw keeps defaults for unknown and invalid keys", () => {
    const params = new URLSearchParams("foo=bar&m=nope&v=415");
    const state = ampsKwCodec.decode(params);
    expect(state.mode).toBe("amps-to-kw");
    expect(state.voltage).toBe("415");
    expect(state.current).toBe("10");
  });
});

describe("parseOptionalNumber is used by tools (sanity)", () => {
  it("converts kA display to amps", () => {
    expect(toBase(parseOptionalNumber("10")!, 1e3)).toBe(10_000);
  });
});
