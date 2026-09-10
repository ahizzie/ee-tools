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
import {
  meteringCtBurdenCodec,
  meteringCtBurdenDefaults,
  meteringCtBurdenExamples,
} from "@/config/tool-share";
import { meteringCtBurden } from "@/lib/calc/metering-ct-burden";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
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
  const [state, setState] = useShareableState(meteringCtBurdenDefaults, meteringCtBurdenCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const loadf = apparentPowerUnits.find((u) => u.value === state.loadUnit)?.factor ?? 1;
  const vf = voltageUnits.find((u) => u.value === state.voltageUnit)?.factor ?? 1;
  const ctpf = currentUnits.find((u) => u.value === state.ctPrimaryUnit)?.factor ?? 1;
  const lf = lengthUnits.find((u) => u.value === state.lengthUnit)?.factor ?? 1;
  const rrf = resistanceUnits.find((u) => u.value === state.meterRUnit)?.factor ?? 1;
  const rextraf = resistanceUnits.find((u) => u.value === state.extraRUnit)?.factor ?? 1;

  const values = {
    loadCapacityVa: parseOptionalNumber(state.load),
    voltageV: parseOptionalNumber(state.voltage),
    voltageDeviationPu: parseOptionalNumber(state.vpu),
    ctPrimaryA: parseOptionalNumber(state.ctPrimary),
    ctSecondaryA: parseOptionalNumber(state.ctSecondary),
    wiringLengthM: parseOptionalNumber(state.length),
    wiringCsaMm2: parseOptionalNumber(state.csa),
    meterResistanceOhm: parseOptionalNumber(state.meterR),
    extraResistanceOhm: parseOptionalNumber(state.extraR),
    ratedBurdenVa: parseOptionalNumber(state.burden),
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

  const snapshot = useMemo<ToolSnapshot>(() => {
    const inputs = [
      { label: "Load capacity", value: `${state.load} ${state.loadUnit}` },
      { label: "System voltage (line-to-line)", value: `${state.voltage} ${state.voltageUnit}` },
      { label: "Voltage deviation", value: `${state.vpu} p.u.` },
      { label: "CT primary", value: `${state.ctPrimary} ${state.ctPrimaryUnit}` },
      { label: "CT secondary", value: `${state.ctSecondary} A` },
      { label: "Wiring loop length", value: `${state.length} ${state.lengthUnit}` },
      { label: "Wiring cross-section", value: `${state.csa} mm²` },
      { label: "Meter / relay resistance", value: `${state.meterR} ${state.meterRUnit}` },
      { label: "Extra resistance", value: `${state.extraR} ${state.extraRUnit}` },
      { label: "Chosen CT rated burden", value: `${state.burden} VA` },
    ];
    if (!result || !verdict) return { inputs, outputs: [], error: message ?? "Invalid input" };
    return {
      inputs,
      outputs: [
        { label: "Status", value: verdict.text },
        { label: "Circuit burden (Btot)", value: `${formatNumber(result.circuitBurdenVa, 4)} VA` },
        { label: "Circuit burden vs rated", value: `${formatNumber(result.percentOfRated, 2)} %` },
        {
          label: "Accuracy band (25–100 %)",
          value: `${formatNumber(result.minBurdenVa, 3)} – ${formatNumber(result.maxBurdenVa, 3)} VA`,
        },
        { label: "Load current (Il)", value: `${formatNumber(result.loadCurrentA, 2)} A` },
        { label: "Secondary current (Is)", value: `${formatNumber(result.secondaryCurrentA, 4)} A` },
        { label: "Wiring resistance (Rw)", value: `${formatNumber(result.wiringResistanceOhm, 4)} Ω` },
      ],
    };
  }, [state, result, verdict, message]);

  useToolChrome({
    state,
    codec: meteringCtBurdenCodec,
    examples: meteringCtBurdenExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <NumericInput
          id="mct-load"
          label="Load capacity"
          value={state.load}
          onChange={(value) => setField("load", value)}
          unit={state.loadUnit}
          units={apparentPowerUnits}
          onUnitChange={(unit) => setField("loadUnit", unit)}
        />
        <NumericInput
          id="mct-v"
          label="System voltage (line-to-line)"
          value={state.voltage}
          onChange={(value) => setField("voltage", value)}
          unit={state.voltageUnit}
          units={voltageUnits}
          onUnitChange={(unit) => setField("voltageUnit", unit)}
        />
        <NumericInput
          id="mct-vpu"
          label="Voltage deviation"
          value={state.vpu}
          onChange={(value) => setField("vpu", value)}
          unit="p.u."
        />
        <NumericInput
          id="mct-ctp"
          label="CT primary"
          value={state.ctPrimary}
          onChange={(value) => setField("ctPrimary", value)}
          unit={state.ctPrimaryUnit}
          units={currentUnits}
          onUnitChange={(unit) => setField("ctPrimaryUnit", unit)}
        />
        <div className="grid gap-1.5">
          <Label>CT secondary</Label>
          <Select value={state.ctSecondary} onValueChange={(v) => v && setField("ctSecondary", String(v))}>
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
          value={state.length}
          onChange={(value) => setField("length", value)}
          unit={state.lengthUnit}
          units={lengthUnits}
          onUnitChange={(unit) => setField("lengthUnit", unit)}
        />
        <NumericInput
          id="mct-csa"
          label="Wiring cross-section"
          value={state.csa}
          onChange={(value) => setField("csa", value)}
          unit="mm²"
        />
        <NumericInput
          id="mct-rr"
          label="Meter / relay resistance"
          value={state.meterR}
          onChange={(value) => setField("meterR", value)}
          unit={state.meterRUnit}
          units={resistanceUnits}
          onUnitChange={(unit) => setField("meterRUnit", unit)}
        />
        <NumericInput
          id="mct-rextra"
          label="Extra resistance"
          value={state.extraR}
          onChange={(value) => setField("extraR", value)}
          unit={state.extraRUnit}
          units={resistanceUnits}
          onUnitChange={(unit) => setField("extraRUnit", unit)}
        />
        <NumericInput
          id="mct-b"
          label="Chosen CT rated burden"
          value={state.burden}
          onChange={(value) => setField("burden", value)}
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
