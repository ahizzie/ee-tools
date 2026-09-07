"use client";

import { useMemo, useState } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { ohmsLaw } from "@/lib/calc/ohms-law";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  powerUnits,
  resistanceUnits,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function OhmsLawCalculator() {
  const [voltage, setVoltage] = useState("12");
  const [current, setCurrent] = useState("2");
  const [resistance, setResistance] = useState("");
  const [power, setPower] = useState("");
  const [vUnit, setVUnit] = useState("V");
  const [iUnit, setIUnit] = useState("A");
  const [rUnit, setRUnit] = useState("Ω");
  const [pUnit, setPUnit] = useState("W");

  const vf = voltageUnits.find((u) => u.value === vUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === iUnit)?.factor ?? 1;
  const rf = resistanceUnits.find((u) => u.value === rUnit)?.factor ?? 1;
  const pf = powerUnits.find((u) => u.value === pUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const v = parseOptionalNumber(voltage);
    const i = parseOptionalNumber(current);
    const r = parseOptionalNumber(resistance);
    const p = parseOptionalNumber(power);
    try {
      return {
        ok: true as const,
        value: ohmsLaw({
          voltage: v === null ? null : toBase(v, vf),
          current: i === null ? null : toBase(i, iff),
          resistance: r === null ? null : toBase(r, rf),
          power: p === null ? null : toBase(p, pf),
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [voltage, current, resistance, power, vf, iff, rf, pf]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Leave unused fields empty. Provide any two of V, I, and R, or power
          plus one of those.
        </p>
        <NumericInput
          id="ohms-v"
          label="Voltage"
          value={voltage}
          onChange={setVoltage}
          unit={vUnit}
          units={voltageUnits}
          onUnitChange={setVUnit}
        />
        <NumericInput
          id="ohms-i"
          label="Current"
          value={current}
          onChange={setCurrent}
          unit={iUnit}
          units={currentUnits}
          onUnitChange={setIUnit}
        />
        <NumericInput
          id="ohms-r"
          label="Resistance"
          value={resistance}
          onChange={setResistance}
          unit={rUnit}
          units={resistanceUnits}
          onUnitChange={setRUnit}
        />
        <NumericInput
          id="ohms-p"
          label="Power"
          value={power}
          onChange={setPower}
          unit={pUnit}
          units={powerUnits}
          onUnitChange={setPUnit}
        />
      </div>
      {result.ok ? (
        <ResultCard equation={result.value.equation}>
          <ResultRow
            label={`Voltage (${vUnit})`}
            value={formatNumber(result.value.voltage / vf)}
          />
          <ResultRow
            label={`Current (${iUnit})`}
            value={formatNumber(result.value.current / iff)}
          />
          <ResultRow
            label={`Resistance (${rUnit})`}
            value={formatNumber(result.value.resistance / rf)}
          />
          <ResultRow
            label={`Power (${pUnit})`}
            value={formatNumber(result.value.power / pf)}
          />
        </ResultCard>
      ) : (
        <ResultCard equation="V = I × R,  P = V × I">
          <p className="text-sm text-destructive">{result.message}</p>
        </ResultCard>
      )}
    </div>
  );
}
