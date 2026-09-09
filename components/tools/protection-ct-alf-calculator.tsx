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
  protectionCtAlfCodec,
  protectionCtAlfDefaults,
  protectionCtAlfExamples,
} from "@/config/tool-share";
import { protectionCtAlf } from "@/lib/calc/protection-ct-alf";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  currentUnits,
  formatNumber,
  lengthUnits,
  parseOptionalNumber,
  resistanceUnits,
  toBase,
} from "@/lib/units";

export function ProtectionCtAlfCalculator() {
  const [state, setState] = useShareableState(protectionCtAlfDefaults, protectionCtAlfCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const ctpf = currentUnits.find((u) => u.value === state.ctPrimaryUnit)?.factor ?? 1;
  const ifaultf = currentUnits.find((u) => u.value === state.faultUnit)?.factor ?? 1;
  const rctf = resistanceUnits.find((u) => u.value === state.rctUnit)?.factor ?? 1;
  const rrf = resistanceUnits.find((u) => u.value === state.relayRUnit)?.factor ?? 1;
  const lf = lengthUnits.find((u) => u.value === state.lengthUnit)?.factor ?? 1;

  const values = {
    ctPrimaryA: parseOptionalNumber(state.ctPrimary),
    ctSecondaryA: parseOptionalNumber(state.ctSecondary),
    ratedAlf: parseOptionalNumber(state.ratedAlf),
    minFaultCurrentA: parseOptionalNumber(state.fault),
    ratedBurdenVa: parseOptionalNumber(state.burden),
    ctResistanceOhm: parseOptionalNumber(state.rct),
    relayResistanceOhm: parseOptionalNumber(state.relayR),
    wiringLengthM: parseOptionalNumber(state.length),
    wiringCsaMm2: parseOptionalNumber(state.csa),
    safetyFactor: parseOptionalNumber(state.safetyFactor),
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

  const snapshot = useMemo<ToolSnapshot>(() => {
    const inputs = [
      { label: "CT primary", value: `${state.ctPrimary} ${state.ctPrimaryUnit}` },
      { label: "CT secondary", value: `${state.ctSecondary} A` },
      { label: "Rated ALF (the 20 in 5P20)", value: state.ratedAlf },
      { label: "Min 3-phase fault current", value: `${state.fault} ${state.faultUnit}` },
      { label: "Rated burden", value: `${state.burden} VA` },
      { label: "CT internal resistance", value: `${state.rct} ${state.rctUnit}` },
      { label: "Relay / device burden", value: `${state.relayR} ${state.relayRUnit}` },
      { label: "Wiring length (one-way)", value: `${state.length} ${state.lengthUnit}` },
      { label: "CT wiring cross-section", value: `${state.csa} mm²` },
      { label: "Safety factor", value: state.safetyFactor },
    ];
    if (!result) return { inputs, outputs: [], error: message ?? "Invalid input" };
    return {
      inputs,
      outputs: [
        {
          label: "Adequacy",
          value: result.adequate
            ? "CT is adequate — effective ALF exceeds required ALF"
            : "CT is not adequate",
        },
        { label: "Effective ALF (ALFs)", value: formatNumber(result.alfSeen, 2) },
        { label: "Required ALF (ALFr)", value: formatNumber(result.alfRequired, 2) },
        { label: "Margin (ALFs − ALFr)", value: formatNumber(result.margin, 2) },
        {
          label: "CT wiring resistance (Rw)",
          value: `${formatNumber(result.wiringResistanceOhm, 4)} Ω`,
        },
      ],
    };
  }, [state, result, message]);

  useToolChrome({
    state,
    codec: protectionCtAlfCodec,
    examples: protectionCtAlfExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <NumericInput
          id="pct-ctp"
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
          id="pct-alfo"
          label="Rated ALF (the 20 in 5P20)"
          value={state.ratedAlf}
          onChange={(value) => setField("ratedAlf", value)}
        />
        <NumericInput
          id="pct-if"
          label="Min 3-phase fault current"
          value={state.fault}
          onChange={(value) => setField("fault", value)}
          unit={state.faultUnit}
          units={currentUnits}
          onUnitChange={(unit) => setField("faultUnit", unit)}
        />
        <NumericInput
          id="pct-s"
          label="Rated burden"
          value={state.burden}
          onChange={(value) => setField("burden", value)}
          unit="VA"
        />
        <NumericInput
          id="pct-rct"
          label="CT internal resistance"
          value={state.rct}
          onChange={(value) => setField("rct", value)}
          unit={state.rctUnit}
          units={resistanceUnits}
          onUnitChange={(unit) => setField("rctUnit", unit)}
        />
        <NumericInput
          id="pct-rr"
          label="Relay / device burden"
          value={state.relayR}
          onChange={(value) => setField("relayR", value)}
          unit={state.relayRUnit}
          units={resistanceUnits}
          onUnitChange={(unit) => setField("relayRUnit", unit)}
        />
        <NumericInput
          id="pct-l"
          label="Wiring length (one-way)"
          value={state.length}
          onChange={(value) => setField("length", value)}
          unit={state.lengthUnit}
          units={lengthUnits}
          onUnitChange={(unit) => setField("lengthUnit", unit)}
        />
        <NumericInput
          id="pct-csa"
          label="CT wiring cross-section"
          value={state.csa}
          onChange={(value) => setField("csa", value)}
          unit="mm²"
        />
        <NumericInput
          id="pct-sf"
          label="Safety factor"
          value={state.safetyFactor}
          onChange={(value) => setField("safetyFactor", value)}
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
