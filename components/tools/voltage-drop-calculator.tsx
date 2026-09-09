"use client";

import { useCallback, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { voltageDropCodec, voltageDropDefaults, voltageDropExamples } from "@/config/tool-share";
import {
  voltageDropIec,
  voltageDropVsLength,
  type CircuitType,
  type ConductorMaterial,
} from "@/lib/calc/voltage-drop";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  areaUnits,
  currentUnits,
  formatNumber,
  lengthUnits,
  parseOptionalNumber,
  toBase,
  voltageUnits,
} from "@/lib/units";

export function VoltageDropCalculator() {
  const [state, setState] = useShareableState(voltageDropDefaults, voltageDropCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const length = state.length;
  const lengthUnit = state.lengthUnit;
  const loadCurrent = state.current;
  const currentUnit = state.currentUnit;
  const section = state.section;
  const temp = state.temp;
  const pf = state.pf;
  const xPerKm = state.xPerKm;
  const nominal = state.nominal;
  const voltageUnit = state.voltageUnit;
  const material = state.material;
  const circuit = state.circuit;

  const lf = lengthUnits.find((u) => u.value === lengthUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === currentUnit)?.factor ?? 1;
  const vf = voltageUnits.find((u) => u.value === voltageUnit)?.factor ?? 1;

  const parsed = useMemo(() => {
    const lengthM = parseOptionalNumber(length);
    const currentA = parseOptionalNumber(loadCurrent);
    const sectionMm2 = parseOptionalNumber(section);
    const temperatureC = parseOptionalNumber(temp);
    const powerFactor = parseOptionalNumber(pf);
    const reactanceOhmPerKm = parseOptionalNumber(xPerKm);
    const nominalVoltageV = parseOptionalNumber(nominal);
    if (
      lengthM === null ||
      currentA === null ||
      sectionMm2 === null ||
      temperatureC === null ||
      powerFactor === null ||
      reactanceOhmPerKm === null ||
      nominalVoltageV === null
    ) {
      return { ok: false as const, message: "Fill in every field with a number." };
    }
    const input = {
      material: material as ConductorMaterial,
      circuit: circuit as CircuitType,
      lengthM: toBase(lengthM, lf),
      currentA: toBase(currentA, iff),
      sectionMm2,
      temperatureC,
      powerFactor,
      reactanceOhmPerKm,
      nominalVoltageV: toBase(nominalVoltageV, vf),
    };
    try {
      const value = voltageDropIec(input);
      const curve = voltageDropVsLength(
        {
          material: input.material,
          circuit: input.circuit,
          currentA: input.currentA,
          sectionMm2,
          temperatureC,
          powerFactor,
          reactanceOhmPerKm,
          nominalVoltageV: input.nominalVoltageV,
        },
        input.lengthM,
      );
      return { ok: true as const, value, curve, lengthBase: input.lengthM };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [
    material,
    circuit,
    length,
    loadCurrent,
    section,
    temp,
    pf,
    xPerKm,
    nominal,
    lf,
    iff,
    vf,
  ]);

  const snapshot: ToolSnapshot = (() => {
    const inputs = [
      { label: "Conductor", value: material },
      { label: "Circuit", value: circuit },
      { label: "Cable length", value: `${length} ${lengthUnit}` },
      { label: "Load current", value: `${loadCurrent} ${currentUnit}` },
      { label: "Conductor cross-section", value: `${section} mm²` },
      { label: "Conductor temperature", value: `${temp} °C` },
      { label: "Power factor (cos φ)", value: pf },
      { label: "Reactance (one conductor)", value: `${xPerKm} Ω/km` },
      { label: "Nominal voltage", value: `${nominal} ${voltageUnit}` },
    ];
    if (!parsed.ok) return { inputs, outputs: [], error: parsed.message };
    return {
      inputs,
      outputs: [
        { label: "Voltage drop", value: `${formatNumber(parsed.value.voltageDropV)} V` },
        { label: "Voltage drop", value: `${formatNumber(parsed.value.percentDrop, 3)} %` },
        { label: "Conductor R", value: `${formatNumber(parsed.value.resistanceOhm, 5)} Ω` },
        { label: "Conductor X", value: `${formatNumber(parsed.value.reactanceOhm, 5)} Ω` },
        {
          label: "ρ at temperature",
          value: `${formatNumber(parsed.value.resistivityOhmMm2PerM, 5)} Ω·mm²/m`,
        },
      ],
    };
  })();

  useToolChrome({
    state,
    codec: voltageDropCodec,
    examples: voltageDropExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
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
          <Label>Circuit</Label>
          <Select
            value={state.circuit}
            items={{
              "three-phase": "Three-phase",
              "single-phase": "Single-phase",
            }}
            onValueChange={(value) => value && setField("circuit", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="three-phase">Three-phase</SelectItem>
              <SelectItem value="single-phase">Single-phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumericInput
          id="vd-l"
          label="Cable length"
          value={state.length}
          onChange={(value) => setField("length", value)}
          unit={state.lengthUnit}
          units={lengthUnits}
          onUnitChange={(unit) => setField("lengthUnit", unit)}
        />
        <NumericInput
          id="vd-i"
          label="Load current"
          value={state.current}
          onChange={(value) => setField("current", value)}
          unit={state.currentUnit}
          units={currentUnits}
          onUnitChange={(unit) => setField("currentUnit", unit)}
        />
        <NumericInput
          id="vd-a"
          label="Conductor cross-section"
          value={state.section}
          onChange={(value) => setField("section", value)}
          unit="mm²"
          units={areaUnits}
          onUnitChange={() => undefined}
        />
        <NumericInput
          id="vd-t"
          label="Conductor temperature"
          value={state.temp}
          onChange={(value) => setField("temp", value)}
          unit="°C"
        />
        <NumericInput
          id="vd-pf"
          label="Power factor (cos φ)"
          value={state.pf}
          onChange={(value) => setField("pf", value)}
        />
        <NumericInput
          id="vd-x"
          label="Reactance (one conductor)"
          value={state.xPerKm}
          onChange={(value) => setField("xPerKm", value)}
          unit="Ω/km"
        />
        <NumericInput
          id="vd-vn"
          label="Nominal voltage"
          value={state.nominal}
          onChange={(value) => setField("nominal", value)}
          unit={state.voltageUnit}
          units={voltageUnits}
          onUnitChange={(unit) => setField("voltageUnit", unit)}
        />
      </div>
      <div className="grid gap-4">
        {parsed.ok ? (
          <>
            <ResultCard equation={parsed.value.equation}>
              <ResultRow
                label="Voltage drop"
                value={`${formatNumber(parsed.value.voltageDropV)} V`}
              />
              <ResultRow
                label="Voltage drop"
                value={`${formatNumber(parsed.value.percentDrop, 3)} %`}
              />
              <ResultRow
                label="Conductor R"
                value={`${formatNumber(parsed.value.resistanceOhm, 5)} Ω`}
              />
              <ResultRow
                label="Conductor X"
                value={`${formatNumber(parsed.value.reactanceOhm, 5)} Ω`}
              />
              <ResultRow
                label="ρ at temperature"
                value={`${formatNumber(parsed.value.resistivityOhmMm2PerM, 5)} Ω·mm²/m`}
              />
            </ResultCard>
            <div className="h-64 rounded-xl bg-card p-3 ring-1 ring-foreground/10 print:break-inside-avoid">
              <p className="mb-2 text-sm font-medium">% voltage drop vs length</p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={parsed.curve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="lengthM"
                    tickFormatter={(value: number) =>
                      `${formatNumber(value / lf, 0)} ${state.lengthUnit}`
                    }
                  />
                  <YAxis
                    dataKey="percentDrop"
                    tickFormatter={(value: number) => `${formatNumber(value, 2)}%`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${formatNumber(Number(value), 3)} %`,
                      "% drop",
                    ]}
                    labelFormatter={(label) =>
                      `${formatNumber(Number(label) / lf, 1)} ${state.lengthUnit}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="percentDrop"
                    stroke="var(--color-primary)"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <ResultCard equation="ΔU = √3 · I · (R cosφ + X sinφ)">
            <p className="text-sm text-destructive">{parsed.message}</p>
          </ResultCard>
        )}
      </div>
    </div>
  );
}
