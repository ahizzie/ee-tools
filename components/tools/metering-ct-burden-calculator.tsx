"use client";

import { useState } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { meteringCtBurden } from "@/lib/calc/metering-ct-burden";
import {
  apparentPowerUnits,
  currentUnits,
  formatNumber,
  lengthUnits,
  parseOptionalNumber,
  resistanceUnits,
  toBase,
  voltageUnits,
} from "@/lib/units";

const VERDICT = {
  ok: {
    className:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
    text: "CT burden is appropriate — the circuit burden sits within 25–100 % of the CT's rated burden.",
  },
  under: {
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300",
    text: "CT is over-rated — the circuit burden is below 25 % of rated. Choose a lower VA rating to stay within class accuracy.",
  },
  over: {
    className: "bg-destructive/10 text-destructive ring-destructive/30",
    text: "CT is under-rated — the circuit burden exceeds 100 % of rated. Choose a higher VA rating or reduce the lead burden.",
  },
} as const;

export function MeteringCtBurdenCalculator() {
  const [load, setLoad] = useState("50");
  const [loadUnit, setLoadUnit] = useState("MVA");
  const [voltage, setVoltage] = useState("33");
  const [voltageUnit, setVoltageUnit] = useState("kV");
  const [vpu, setVpu] = useState("0.94");
  const [ctp, setCtp] = useState("1000");
  const [ctpUnit, setCtpUnit] = useState("A");
  const [cts, setCts] = useState("1");
  const [length, setLength] = useState("40");
  const [lengthUnit, setLengthUnit] = useState("m");
  const [csa, setCsa] = useState("2.5");
  const [rr, setRr] = useState("0.1");
  const [rrUnit, setRrUnit] = useState("Ω");
  const [rextra, setRextra] = useState("0");
  const [rextraUnit, setRextraUnit] = useState("Ω");
  const [burden, setBurden] = useState("10");

  const loadf = apparentPowerUnits.find((u) => u.value === loadUnit)?.factor ?? 1;
  const vf = voltageUnits.find((u) => u.value === voltageUnit)?.factor ?? 1;
  const ctpf = currentUnits.find((u) => u.value === ctpUnit)?.factor ?? 1;
  const lf = lengthUnits.find((u) => u.value === lengthUnit)?.factor ?? 1;
  const rrf = resistanceUnits.find((u) => u.value === rrUnit)?.factor ?? 1;
  const rextraf = resistanceUnits.find((u) => u.value === rextraUnit)?.factor ?? 1;

  const values = {
    loadCapacityVa: parseOptionalNumber(load),
    voltageV: parseOptionalNumber(voltage),
    voltageDeviationPu: parseOptionalNumber(vpu),
    ctPrimaryA: parseOptionalNumber(ctp),
    ctSecondaryA: parseOptionalNumber(cts),
    wiringLengthM: parseOptionalNumber(length),
    wiringCsaMm2: parseOptionalNumber(csa),
    meterResistanceOhm: parseOptionalNumber(rr),
    extraResistanceOhm: parseOptionalNumber(rextra),
    ratedBurdenVa: parseOptionalNumber(burden),
  };

  const equationFallback =
    "Btot = Is²·(Rw + Rr + Rextra),  need 25 % ≤ Btot/B ≤ 100 %";

  let result: ReturnType<typeof meteringCtBurden> | null = null;
  let message: string | null = null;
  if (Object.values(values).some((v) => v === null)) {
    message = "Fill in every field with a number.";
  } else {
    try {
      result = meteringCtBurden({
        loadCapacityVa: toBase(values.loadCapacityVa!, loadf),
        voltageV: toBase(values.voltageV!, vf),
        voltageDeviationPu: values.voltageDeviationPu!,
        ctPrimaryA: toBase(values.ctPrimaryA!, ctpf),
        ctSecondaryA: values.ctSecondaryA!,
        wiringLengthM: toBase(values.wiringLengthM!, lf),
        wiringCsaMm2: values.wiringCsaMm2!,
        meterResistanceOhm: toBase(values.meterResistanceOhm!, rrf),
        extraResistanceOhm: toBase(values.extraResistanceOhm!, rextraf),
        ratedBurdenVa: values.ratedBurdenVa!,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : "Invalid input";
    }
  }

  const verdict = result ? VERDICT[result.status] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <NumericInput
          id="mct-load"
          label="Load capacity"
          value={load}
          onChange={setLoad}
          unit={loadUnit}
          units={apparentPowerUnits}
          onUnitChange={setLoadUnit}
        />
        <NumericInput
          id="mct-v"
          label="System voltage (line-to-line)"
          value={voltage}
          onChange={setVoltage}
          unit={voltageUnit}
          units={voltageUnits}
          onUnitChange={setVoltageUnit}
        />
        <NumericInput
          id="mct-vpu"
          label="Voltage deviation"
          value={vpu}
          onChange={setVpu}
          unit="p.u."
        />
        <NumericInput
          id="mct-ctp"
          label="CT primary"
          value={ctp}
          onChange={setCtp}
          unit={ctpUnit}
          units={currentUnits}
          onUnitChange={setCtpUnit}
        />
        <div className="grid gap-1.5">
          <Label>CT secondary</Label>
          <Select value={cts} onValueChange={(v) => v && setCts(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 A</SelectItem>
              <SelectItem value="5">5 A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumericInput
          id="mct-l"
          label="Wiring loop length"
          value={length}
          onChange={setLength}
          unit={lengthUnit}
          units={lengthUnits}
          onUnitChange={setLengthUnit}
        />
        <NumericInput
          id="mct-csa"
          label="Wiring cross-section"
          value={csa}
          onChange={setCsa}
          unit="mm²"
        />
        <NumericInput
          id="mct-rr"
          label="Meter / relay resistance"
          value={rr}
          onChange={setRr}
          unit={rrUnit}
          units={resistanceUnits}
          onUnitChange={setRrUnit}
        />
        <NumericInput
          id="mct-rextra"
          label="Extra resistance"
          value={rextra}
          onChange={setRextra}
          unit={rextraUnit}
          units={resistanceUnits}
          onUnitChange={setRextraUnit}
        />
        <NumericInput
          id="mct-b"
          label="Chosen CT rated burden"
          value={burden}
          onChange={setBurden}
          unit="VA"
        />
      </div>
      <div className="grid gap-4">
        {result && verdict ? (
          <>
            <div
              className={`rounded-xl p-4 text-sm font-medium ring-1 print:break-inside-avoid ${verdict.className}`}
            >
              {verdict.text}
            </div>
            <ResultCard equation={result.equation}>
              <ResultRow
                label="Circuit burden (Btot)"
                value={`${formatNumber(result.circuitBurdenVa, 4)} VA`}
              />
              <ResultRow
                label="Circuit burden vs rated"
                value={`${formatNumber(result.percentOfRated, 2)} %`}
              />
              <ResultRow
                label="Accuracy band (25–100 %)"
                value={`${formatNumber(result.minBurdenVa, 3)} – ${formatNumber(result.maxBurdenVa, 3)} VA`}
              />
              <ResultRow
                label="Load current (Il)"
                value={`${formatNumber(result.loadCurrentA, 2)} A`}
              />
              <ResultRow
                label="Secondary current (Is)"
                value={`${formatNumber(result.secondaryCurrentA, 4)} A`}
              />
              <ResultRow
                label="Wiring resistance (Rw)"
                value={`${formatNumber(result.wiringResistanceOhm, 4)} Ω`}
              />
              <ResultRow
                label="Wiring / meter burden"
                value={`${formatNumber(result.wiringBurdenVa, 4)} / ${formatNumber(result.meterBurdenVa, 4)} VA`}
              />
            </ResultCard>
          </>
        ) : (
          <ResultCard equation={equationFallback}>
            <p className="text-sm text-destructive">{message}</p>
          </ResultCard>
        )}
      </div>
    </div>
  );
}
