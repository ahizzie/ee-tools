"use client";

import { useMemo, useState } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { threePhaseAmpsKw } from "@/lib/calc/amps-kw";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function AmpsKwCalculator() {
  const [mode, setMode] = useState("amps-to-kw");
  const [voltage, setVoltage] = useState("400");
  const [current, setCurrent] = useState("10");
  const [powerKw, setPowerKw] = useState("5.543");
  const [pf, setPf] = useState("0.8");
  const [vUnit, setVUnit] = useState("V");
  const [iUnit, setIUnit] = useState("A");

  const vf = voltageUnits.find((u) => u.value === vUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === iUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const v = parseOptionalNumber(voltage);
    const i = parseOptionalNumber(current);
    const p = parseOptionalNumber(powerKw);
    const powerFactor = parseOptionalNumber(pf);
    if (v === null || powerFactor === null) {
      return { ok: false as const, message: "Enter line voltage and power factor." };
    }
    try {
      return {
        ok: true as const,
        value: threePhaseAmpsKw({
          lineVoltage: toBase(v, vf),
          powerFactor,
          current:
            mode === "amps-to-kw" ? (i === null ? null : toBase(i, iff)) : null,
          activePowerKw: mode === "kw-to-amps" ? p : null,
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, voltage, current, powerKw, pf, vf, iff]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Balanced three-phase line current ↔ active power. For reactive and
          apparent power use the 3-phase power tool.
        </p>
        <div className="grid gap-1.5">
          <Label>Convert</Label>
          <Tabs value={mode} onValueChange={(value) => value && setMode(String(value))}>
            <TabsList>
              <TabsTrigger value="amps-to-kw">Amps → kW</TabsTrigger>
              <TabsTrigger value="kw-to-amps">kW → amps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <NumericInput
          id="ak-v"
          label="Line-to-line voltage"
          value={voltage}
          onChange={setVoltage}
          unit={vUnit}
          units={voltageUnits}
          onUnitChange={setVUnit}
        />
        {mode === "amps-to-kw" ? (
          <NumericInput
            id="ak-i"
            label="Line current"
            value={current}
            onChange={setCurrent}
            unit={iUnit}
            units={currentUnits}
            onUnitChange={setIUnit}
          />
        ) : (
          <NumericInput
            id="ak-p"
            label="Active power"
            value={powerKw}
            onChange={setPowerKw}
            unit="kW"
          />
        )}
        <NumericInput
          id="ak-pf"
          label="Power factor (cos φ)"
          value={pf}
          onChange={setPf}
        />
      </div>
      {result.ok ? (
        <ResultCard equation={result.value.equation}>
          <ResultRow
            label={`Line current (${iUnit})`}
            value={formatNumber(result.value.current / iff)}
          />
          <ResultRow
            label="Active power P (kW)"
            value={formatNumber(result.value.activePowerKw)}
          />
          <ResultRow label="Power factor" value={formatNumber(result.value.powerFactor, 3)} />
        </ResultCard>
      ) : (
        <ResultCard equation="P(kW) = √3 · V_L · I_L · cosφ / 1000">
          <p className="text-sm text-destructive">{result.message}</p>
        </ResultCard>
      )}
    </div>
  );
}
