"use client";

import { useCallback, useMemo } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { useToolChrome } from "@/components/tools/use-tool-chrome";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ampsKwCodec, ampsKwDefaults, ampsKwExamples } from "@/config/tool-share";
import { threePhaseAmpsKw } from "@/lib/calc/amps-kw";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function AmpsKwCalculator() {
  const [state, setState] = useShareableState(ampsKwDefaults, ampsKwCodec);
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
  const powerKw = state.powerKw;
  const pf = state.pf;

  const vf = voltageUnits.find((u) => u.value === voltageUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === currentUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const v = parseOptionalNumber(voltage);
    const i = parseOptionalNumber(lineCurrent);
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
          current: mode === "amps-to-kw" ? (i === null ? null : toBase(i, iff)) : null,
          activePowerKw: mode === "kw-to-amps" ? p : null,
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, voltage, lineCurrent, powerKw, pf, vf, iff]);

  const snapshot: ToolSnapshot = (() => {
    const inputs = [
      { label: "Convert", value: mode === "amps-to-kw" ? "Amps → kW" : "kW → amps" },
      { label: "Line-to-line voltage", value: `${voltage} ${voltageUnit}` },
      mode === "amps-to-kw"
        ? { label: "Line current", value: `${lineCurrent} ${currentUnit}` }
        : { label: "Active power", value: `${powerKw} kW` },
      { label: "Power factor (cos φ)", value: pf },
    ];
    if (!result.ok) return { inputs, outputs: [], error: result.message };
    return {
      inputs,
      outputs: [
        {
          label: `Line current (${currentUnit})`,
          value: formatNumber(result.value.current / iff),
        },
        { label: "Active power P (kW)", value: formatNumber(result.value.activePowerKw) },
        { label: "Power factor", value: formatNumber(result.value.powerFactor, 3) },
      ],
    };
  })();

  useToolChrome({
    state,
    codec: ampsKwCodec,
    examples: ampsKwExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Balanced three-phase line current ↔ active power. For reactive and
          apparent power use the 3-phase power tool.
        </p>
        <div className="grid gap-1.5">
          <Label>Convert</Label>
          <Tabs value={mode} onValueChange={(value) => value && setField("mode", String(value))}>
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
          onChange={(value) => setField("voltage", value)}
          unit={voltageUnit}
          units={voltageUnits}
          onUnitChange={(unit) => setField("voltageUnit", unit)}
        />
        {mode === "amps-to-kw" ? (
          <NumericInput
            id="ak-i"
            label="Line current"
            value={lineCurrent}
            onChange={(value) => setField("current", value)}
            unit={currentUnit}
            units={currentUnits}
            onUnitChange={(unit) => setField("currentUnit", unit)}
          />
        ) : (
          <NumericInput
            id="ak-p"
            label="Active power"
            value={powerKw}
            onChange={(value) => setField("powerKw", value)}
            unit="kW"
          />
        )}
        <NumericInput
          id="ak-pf"
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
