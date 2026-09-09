"use client";

import { useCallback, useMemo } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { useToolChrome } from "@/components/tools/use-tool-chrome";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adiabaticCodec, adiabaticDefaults, adiabaticExamples } from "@/config/tool-share";
import {
  adiabaticKFactor,
  adiabaticMinSection,
  INSULATION_LIMITS,
  type ConductorMaterial,
  type InsulationType,
} from "@/lib/calc/adiabatic";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  temperatureUnits,
  timeUnits,
  toBase,
} from "@/lib/units";

type KMode = InsulationType | "custom-k";

export function AdiabaticCalculator() {
  const [state, setState] = useShareableState(adiabaticDefaults, adiabaticCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const material = state.material;
  const kMode = state.kMode;
  const initialTemp = state.initialTemp;
  const finalTemp = state.finalTemp;
  const customK = state.customK;
  const faultCurrent = state.current;
  const currentUnit = state.currentUnit;
  const duration = state.duration;
  const timeUnit = state.timeUnit;

  const iff = currentUnits.find((u) => u.value === currentUnit)?.factor ?? 1;
  const tf = timeUnits.find((u) => u.value === timeUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const currentA = parseOptionalNumber(faultCurrent);
    const durationVal = parseOptionalNumber(duration);
    if (currentA === null || durationVal === null) {
      return { ok: false as const, message: "Enter fault current and duration." };
    }

    try {
      let k: number;
      if (kMode === "custom-k") {
        const kIn = parseOptionalNumber(customK);
        if (kIn === null) {
          return { ok: false as const, message: "Enter a k-factor." };
        }
        k = kIn;
      } else {
        const thetaI = parseOptionalNumber(initialTemp);
        const thetaF = parseOptionalNumber(finalTemp);
        if (thetaI === null || thetaF === null) {
          return {
            ok: false as const,
            message: "Enter initial and final conductor temperatures.",
          };
        }
        k = adiabaticKFactor({
          material: material as ConductorMaterial,
          initialTempC: thetaI,
          finalTempC: thetaF,
        });
      }

      return {
        ok: true as const,
        value: adiabaticMinSection({
          currentA: toBase(currentA, iff),
          durationS: toBase(durationVal, tf),
          k,
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [
    kMode,
    material,
    initialTemp,
    finalTemp,
    customK,
    faultCurrent,
    duration,
    iff,
    tf,
  ]);

  function applyInsulation(next: KMode) {
    if (next === "pvc" || next === "xlpe") {
      setState((current) => ({
        ...current,
        kMode: next,
        initialTemp: String(INSULATION_LIMITS[next].initialC),
        finalTemp: String(INSULATION_LIMITS[next].finalC),
      }));
      return;
    }
    setField("kMode", next);
  }

  const snapshot: ToolSnapshot = (() => {
    const inputs = [
      { label: "Conductor", value: material },
      { label: "Insulation / k", value: kMode },
      ...(kMode === "custom-k"
        ? [{ label: "k-factor", value: customK }]
        : [
            { label: "Initial temperature", value: `${initialTemp} °C` },
            { label: "Final temperature limit", value: `${finalTemp} °C` },
          ]),
      { label: "Short-circuit current (rms)", value: `${faultCurrent} ${currentUnit}` },
      { label: "Fault duration", value: `${duration} ${timeUnit}` },
    ];
    if (!result.ok) return { inputs, outputs: [], error: result.message };
    const outputs = [
      { label: "Minimum CSA S (mm²)", value: formatNumber(result.value.sectionMm2) },
      { label: "k-factor", value: formatNumber(result.value.k) },
      { label: "Let-through I²t (A²s)", value: formatNumber(result.value.energyLetThroughA2s) },
    ];
    if (result.value.durationExceedsAdiabaticLimit) {
      outputs.push({
        label: "Note",
        value: "Duration is over 5 s; adiabatic heating no longer applies without a non-adiabatic correction.",
      });
    }
    return { inputs, outputs };
  })();

  useToolChrome({
    state,
    codec: adiabaticCodec,
    examples: adiabaticExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          IEC 60364-4-43 / IEC 60949 adiabatic heating: minimum conductor CSA
          so the core stays within the insulation temperature limit for a
          short-circuit of duration typically ≤ 5 s.
        </p>
        <div className="grid gap-1.5">
          <Label>Conductor</Label>
          <Select
            value={state.material}
            items={{ copper: "Copper", aluminium: "Aluminium" }}
            onValueChange={(value) => value && setField("material", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="copper">Copper</SelectItem>
              <SelectItem value="aluminium">Aluminium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Insulation / k</Label>
          <Select
            value={state.kMode}
            items={{
              pvc: "PVC (70 → 160 °C)",
              xlpe: "XLPE / EPR (90 → 250 °C)",
              "custom-k": "Enter k",
            }}
            onValueChange={(value) => value && applyInsulation(value as KMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pvc">PVC (70 → 160 °C)</SelectItem>
              <SelectItem value="xlpe">XLPE / EPR (90 → 250 °C)</SelectItem>
              <SelectItem value="custom-k">Enter k</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {state.kMode === "custom-k" ? (
          <NumericInput
            id="ad-k"
            label="k-factor"
            value={state.customK}
            onChange={(value) => setField("customK", value)}
          />
        ) : (
          <>
            <NumericInput
              id="ad-ti"
              label="Initial temperature"
              value={state.initialTemp}
              onChange={(value) => setField("initialTemp", value)}
              unit="°C"
              units={temperatureUnits}
            />
            <NumericInput
              id="ad-tf"
              label="Final temperature limit"
              value={state.finalTemp}
              onChange={(value) => setField("finalTemp", value)}
              unit="°C"
              units={temperatureUnits}
            />
          </>
        )}
        <NumericInput
          id="ad-i"
          label="Short-circuit current (rms)"
          value={state.current}
          onChange={(value) => setField("current", value)}
          unit={state.currentUnit}
          units={currentUnits}
          onUnitChange={(unit) => setField("currentUnit", unit)}
        />
        <NumericInput
          id="ad-t"
          label="Fault duration"
          value={state.duration}
          onChange={(value) => setField("duration", value)}
          unit={state.timeUnit}
          units={timeUnits}
          onUnitChange={(unit) => setField("timeUnit", unit)}
        />
      </div>
      {result.ok ? (
        <ResultCard equation={result.value.equation}>
          <ResultRow
            label="Minimum CSA S (mm²)"
            value={formatNumber(result.value.sectionMm2)}
          />
          <ResultRow label="k-factor" value={formatNumber(result.value.k)} />
          <ResultRow
            label="Let-through I²t (A²s)"
            value={formatNumber(result.value.energyLetThroughA2s)}
          />
          {result.value.durationExceedsAdiabaticLimit ? (
            <p className="pt-2 text-sm text-destructive">
              Duration is over 5 s; IEC 60364-4-43 adiabatic heating no longer
              applies without a non-adiabatic correction.
            </p>
          ) : null}
        </ResultCard>
      ) : (
        <ResultCard equation="S = I · √t / k">
          <p className="text-sm text-destructive">{result.message}</p>
        </ResultCard>
      )}
    </div>
  );
}
