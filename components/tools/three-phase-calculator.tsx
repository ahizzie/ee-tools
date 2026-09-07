"use client";

import { useMemo, useState } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { threePhasePower } from "@/lib/calc/three-phase";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  powerUnits,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function ThreePhaseCalculator() {
  const [mode, setMode] = useState("from-current");
  const [voltage, setVoltage] = useState("400");
  const [current, setCurrent] = useState("10");
  const [power, setPower] = useState("5543");
  const [pf, setPf] = useState("0.8");
  const [vUnit, setVUnit] = useState("V");
  const [iUnit, setIUnit] = useState("A");
  const [pUnit, setPUnit] = useState("W");

  const vf = voltageUnits.find((u) => u.value === vUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === iUnit)?.factor ?? 1;
  const pwf = powerUnits.find((u) => u.value === pUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const v = parseOptionalNumber(voltage);
    const i = parseOptionalNumber(current);
    const p = parseOptionalNumber(power);
    const powerFactor = parseOptionalNumber(pf);
    if (v === null || powerFactor === null) {
      return { ok: false as const, message: "Enter line voltage and power factor." };
    }
    try {
      return {
        ok: true as const,
        value: threePhasePower({
          lineVoltage: toBase(v, vf),
          current: mode === "from-current" ? (i === null ? null : toBase(i, iff)) : null,
          activePower:
            mode === "from-power" ? (p === null ? null : toBase(p, pwf)) : null,
          powerFactor,
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, voltage, current, power, pf, vf, iff, pwf]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Solve</Label>
          <Tabs value={mode} onValueChange={(value) => value && setMode(String(value))}>
            <TabsList>
              <TabsTrigger value="from-current">From current</TabsTrigger>
              <TabsTrigger value="from-power">From power</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <NumericInput
          id="tp-v"
          label="Line-to-line voltage"
          value={voltage}
          onChange={setVoltage}
          unit={vUnit}
          units={voltageUnits}
          onUnitChange={setVUnit}
        />
        {mode === "from-current" ? (
          <NumericInput
            id="tp-i"
            label="Line current"
            value={current}
            onChange={setCurrent}
            unit={iUnit}
            units={currentUnits}
            onUnitChange={setIUnit}
          />
        ) : (
          <NumericInput
            id="tp-p"
            label="Active power"
            value={power}
            onChange={setPower}
            unit={pUnit}
            units={powerUnits}
            onUnitChange={setPUnit}
          />
        )}
        <NumericInput
          id="tp-pf"
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
            label={`Active power P (${pUnit})`}
            value={formatNumber(result.value.activePower / pwf)}
          />
          <ResultRow
            label={`Reactive power Q (${pUnit === "W" ? "var" : pUnit.replace("W", "var")})`}
            value={formatNumber(result.value.reactivePower / pwf)}
          />
          <ResultRow
            label={`Apparent power S (${pUnit === "W" ? "VA" : pUnit.replace("W", "VA")})`}
            value={formatNumber(result.value.apparentPower / pwf)}
          />
          <ResultRow label="Power factor" value={formatNumber(result.value.powerFactor, 3)} />
        </ResultCard>
      ) : (
        <ResultCard equation="P = √3 · V_L · I_L · cosφ">
          <p className="text-sm text-destructive">{result.message}</p>
        </ResultCard>
      )}
    </div>
  );
}
