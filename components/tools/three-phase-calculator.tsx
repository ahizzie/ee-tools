"use client";

import { useCallback, useMemo } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { useToolChrome } from "@/components/tools/use-tool-chrome";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { threePhaseCodec, threePhaseDefaults, threePhaseExamples } from "@/config/tool-share";
import { threePhasePower } from "@/lib/calc/three-phase";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  powerUnits,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function ThreePhaseCalculator() {
  const [state, setState] = useShareableState(threePhaseDefaults, threePhaseCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const mode = state.mode;
  const voltage = state.voltage;
  const voltageUnit = state.voltageUnit;
  const lineCurrent = state.current;
  const currentUnit = state.currentUnit;
  const power = state.power;
  const powerUnit = state.powerUnit;
  const pf = state.pf;

  const vf = voltageUnits.find((u) => u.value === voltageUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === currentUnit)?.factor ?? 1;
  const pwf = powerUnits.find((u) => u.value === powerUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const v = parseOptionalNumber(voltage);
    const i = parseOptionalNumber(lineCurrent);
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
          activePower: mode === "from-power" ? (p === null ? null : toBase(p, pwf)) : null,
          powerFactor,
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, voltage, lineCurrent, power, pf, vf, iff, pwf]);

  const snapshot: ToolSnapshot = (() => {
    const inputs = [
      { label: "Solve", value: mode === "from-current" ? "From current" : "From power" },
      { label: "Line-to-line voltage", value: `${voltage} ${voltageUnit}` },
      mode === "from-current"
        ? { label: "Line current", value: `${lineCurrent} ${currentUnit}` }
        : { label: "Active power", value: `${power} ${powerUnit}` },
      { label: "Power factor (cos φ)", value: pf },
    ];
    if (!result.ok) return { inputs, outputs: [], error: result.message };
    const qUnit = powerUnit === "W" ? "var" : powerUnit.replace("W", "var");
    const sUnit = powerUnit === "W" ? "VA" : powerUnit.replace("W", "VA");
    return {
      inputs,
      outputs: [
        {
          label: `Line current (${currentUnit})`,
          value: formatNumber(result.value.current / iff),
        },
        {
          label: `Active power P (${powerUnit})`,
          value: formatNumber(result.value.activePower / pwf),
        },
        {
          label: `Reactive power Q (${qUnit})`,
          value: formatNumber(result.value.reactivePower / pwf),
        },
        {
          label: `Apparent power S (${sUnit})`,
          value: formatNumber(result.value.apparentPower / pwf),
        },
        { label: "Power factor", value: formatNumber(result.value.powerFactor, 3) },
      ],
    };
  })();

  useToolChrome({
    state,
    codec: threePhaseCodec,
    examples: threePhaseExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Solve</Label>
          <Tabs value={mode} onValueChange={(value) => value && setField("mode", String(value))}>
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
          onChange={(value) => setField("voltage", value)}
          unit={voltageUnit}
          units={voltageUnits}
          onUnitChange={(unit) => setField("voltageUnit", unit)}
        />
        {mode === "from-current" ? (
          <NumericInput
            id="tp-i"
            label="Line current"
            value={lineCurrent}
            onChange={(value) => setField("current", value)}
            unit={currentUnit}
            units={currentUnits}
            onUnitChange={(unit) => setField("currentUnit", unit)}
          />
        ) : (
          <NumericInput
            id="tp-p"
            label="Active power"
            value={power}
            onChange={(value) => setField("power", value)}
            unit={powerUnit}
            units={powerUnits}
            onUnitChange={(unit) => setField("powerUnit", unit)}
          />
        )}
        <NumericInput
          id="tp-pf"
          label="Power factor (cos φ)"
          value={pf}
          onChange={(value) => setField("pf", value)}
        />
      </div>
      {result.ok ? (
        <ResultCard equation={result.value.equation}>
          <ResultRow
            label={`Line current (${currentUnit})`}
            value={formatNumber(result.value.current / iff)}
          />
          <ResultRow
            label={`Active power P (${powerUnit})`}
            value={formatNumber(result.value.activePower / pwf)}
          />
          <ResultRow
            label={`Reactive power Q (${powerUnit === "W" ? "var" : powerUnit.replace("W", "var")})`}
            value={formatNumber(result.value.reactivePower / pwf)}
          />
          <ResultRow
            label={`Apparent power S (${powerUnit === "W" ? "VA" : powerUnit.replace("W", "VA")})`}
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
