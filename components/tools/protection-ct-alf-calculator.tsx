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
import { protectionCtAlf } from "@/lib/calc/protection-ct-alf";
import {
  currentUnits,
  formatNumber,
  lengthUnits,
  parseOptionalNumber,
  resistanceUnits,
  toBase,
} from "@/lib/units";

export function ProtectionCtAlfCalculator() {
  const [ctp, setCtp] = useState("600");
  const [ctpUnit, setCtpUnit] = useState("A");
  const [cts, setCts] = useState("1");
  const [alfo, setAlfo] = useState("20");
  const [ifault, setIfault] = useState("31500");
  const [ifaultUnit, setIfaultUnit] = useState("A");
  const [burden, setBurden] = useState("15");
  const [rct, setRct] = useState("3");
  const [rctUnit, setRctUnit] = useState("Ω");
  const [rr, setRr] = useState("0.1");
  const [rrUnit, setRrUnit] = useState("Ω");
  const [length, setLength] = useState("40");
  const [lengthUnit, setLengthUnit] = useState("m");
  const [csa, setCsa] = useState("2.5");
  const [sf, setSf] = useState("2");

  const ctpf = currentUnits.find((u) => u.value === ctpUnit)?.factor ?? 1;
  const ifaultf = currentUnits.find((u) => u.value === ifaultUnit)?.factor ?? 1;
  const rctf = resistanceUnits.find((u) => u.value === rctUnit)?.factor ?? 1;
  const rrf = resistanceUnits.find((u) => u.value === rrUnit)?.factor ?? 1;
  const lf = lengthUnits.find((u) => u.value === lengthUnit)?.factor ?? 1;

  const values = {
    ctPrimaryA: parseOptionalNumber(ctp),
    ctSecondaryA: parseOptionalNumber(cts),
    ratedAlf: parseOptionalNumber(alfo),
    minFaultCurrentA: parseOptionalNumber(ifault),
    ratedBurdenVa: parseOptionalNumber(burden),
    ctResistanceOhm: parseOptionalNumber(rct),
    relayResistanceOhm: parseOptionalNumber(rr),
    wiringLengthM: parseOptionalNumber(length),
    wiringCsaMm2: parseOptionalNumber(csa),
    safetyFactor: parseOptionalNumber(sf),
  };

  const equationFallback =
    "ALFs = ALFo · (Is²·Rct + S) / (Is²·Rct + Is²·(Rw + Rr)),  need ALFs > ALFr";

  let result: ReturnType<typeof protectionCtAlf> | null = null;
  let message: string | null = null;
  if (Object.values(values).some((v) => v === null)) {
    message = "Fill in every field with a number.";
  } else {
    try {
      result = protectionCtAlf({
        ctPrimaryA: toBase(values.ctPrimaryA!, ctpf),
        ctSecondaryA: values.ctSecondaryA!,
        ratedAlf: values.ratedAlf!,
        minFaultCurrentA: toBase(values.minFaultCurrentA!, ifaultf),
        ratedBurdenVa: values.ratedBurdenVa!,
        ctResistanceOhm: toBase(values.ctResistanceOhm!, rctf),
        relayResistanceOhm: toBase(values.relayResistanceOhm!, rrf),
        wiringLengthM: toBase(values.wiringLengthM!, lf),
        wiringCsaMm2: values.wiringCsaMm2!,
        safetyFactor: values.safetyFactor!,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : "Invalid input";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <NumericInput
          id="pct-ctp"
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
          id="pct-alfo"
          label="Rated ALF (the 20 in 5P20)"
          value={alfo}
          onChange={setAlfo}
        />
        <NumericInput
          id="pct-if"
          label="Min 3-phase fault current"
          value={ifault}
          onChange={setIfault}
          unit={ifaultUnit}
          units={currentUnits}
          onUnitChange={setIfaultUnit}
        />
        <NumericInput
          id="pct-s"
          label="Rated burden"
          value={burden}
          onChange={setBurden}
          unit="VA"
        />
        <NumericInput
          id="pct-rct"
          label="CT internal resistance"
          value={rct}
          onChange={setRct}
          unit={rctUnit}
          units={resistanceUnits}
          onUnitChange={setRctUnit}
        />
        <NumericInput
          id="pct-rr"
          label="Relay / device burden"
          value={rr}
          onChange={setRr}
          unit={rrUnit}
          units={resistanceUnits}
          onUnitChange={setRrUnit}
        />
        <NumericInput
          id="pct-l"
          label="Wiring length (one-way)"
          value={length}
          onChange={setLength}
          unit={lengthUnit}
          units={lengthUnits}
          onUnitChange={setLengthUnit}
        />
        <NumericInput
          id="pct-csa"
          label="CT wiring cross-section"
          value={csa}
          onChange={setCsa}
          unit="mm²"
        />
        <NumericInput
          id="pct-sf"
          label="Safety factor"
          value={sf}
          onChange={setSf}
        />
      </div>
      <div className="grid gap-4">
        {result ? (
          <>
            <div
              className={`rounded-xl p-4 text-sm font-medium ring-1 print:break-inside-avoid ${
                result.adequate
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300"
                  : "bg-destructive/10 text-destructive ring-destructive/30"
              }`}
            >
              {result.adequate
                ? "CT is adequate — the effective ALF exceeds the required ALF."
                : "CT is not adequate — increase the CT's rated ALF, enlarge the CT wiring, or reduce the burden."}
            </div>
            <ResultCard equation={result.equation}>
              <ResultRow
                label="Effective ALF (ALFs)"
                value={formatNumber(result.alfSeen, 2)}
              />
              <ResultRow
                label="Required ALF (ALFr)"
                value={formatNumber(result.alfRequired, 2)}
              />
              <ResultRow label="Margin (ALFs − ALFr)" value={formatNumber(result.margin, 2)} />
              <ResultRow
                label="CT wiring resistance (Rw)"
                value={`${formatNumber(result.wiringResistanceOhm, 4)} Ω`}
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
