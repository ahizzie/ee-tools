"use client";

import { useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_REACTANCE_OHM_PER_KM,
  voltageDropIec,
  voltageDropVsLength,
  type CircuitType,
  type ConductorMaterial,
} from "@/lib/calc/voltage-drop";
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
  const [material, setMaterial] = useState<ConductorMaterial>("copper");
  const [circuit, setCircuit] = useState<CircuitType>("three-phase");
  const [length, setLength] = useState("100");
  const [lengthUnit, setLengthUnit] = useState("m");
  const [current, setCurrent] = useState("80");
  const [iUnit, setIUnit] = useState("A");
  const [section, setSection] = useState("25");
  const [temp, setTemp] = useState("70");
  const [pf, setPf] = useState("0.85");
  const [xPerKm, setXPerKm] = useState(String(DEFAULT_REACTANCE_OHM_PER_KM));
  const [nominal, setNominal] = useState("400");
  const [vUnit, setVUnit] = useState("V");

  const lf = lengthUnits.find((u) => u.value === lengthUnit)?.factor ?? 1;
  const iff = currentUnits.find((u) => u.value === iUnit)?.factor ?? 1;
  const vf = voltageUnits.find((u) => u.value === vUnit)?.factor ?? 1;

  const parsed = useMemo(() => {
    const lengthM = parseOptionalNumber(length);
    const currentA = parseOptionalNumber(current);
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
      material,
      circuit,
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
          material,
          circuit,
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
    current,
    section,
    temp,
    pf,
    xPerKm,
    nominal,
    lf,
    iff,
    vf,
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Conductor</Label>
          <Select
            value={material}
            items={{ copper: "Copper", aluminium: "Aluminium" }}
            onValueChange={(value) => value && setMaterial(value as ConductorMaterial)}
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
            value={circuit}
            items={{
              "three-phase": "Three-phase",
              "single-phase": "Single-phase",
            }}
            onValueChange={(value) => value && setCircuit(value as CircuitType)}
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
          value={length}
          onChange={setLength}
          unit={lengthUnit}
          units={lengthUnits}
          onUnitChange={setLengthUnit}
        />
        <NumericInput
          id="vd-i"
          label="Load current"
          value={current}
          onChange={setCurrent}
          unit={iUnit}
          units={currentUnits}
          onUnitChange={setIUnit}
        />
        <NumericInput
          id="vd-a"
          label="Conductor cross-section"
          value={section}
          onChange={setSection}
          unit="mm²"
          units={areaUnits}
          onUnitChange={() => undefined}
        />
        <NumericInput
          id="vd-t"
          label="Conductor temperature"
          value={temp}
          onChange={setTemp}
          unit="°C"
        />
        <NumericInput
          id="vd-pf"
          label="Power factor (cos φ)"
          value={pf}
          onChange={setPf}
        />
        <NumericInput
          id="vd-x"
          label="Reactance (one conductor)"
          value={xPerKm}
          onChange={setXPerKm}
          unit="Ω/km"
        />
        <NumericInput
          id="vd-vn"
          label="Nominal voltage"
          value={nominal}
          onChange={setNominal}
          unit={vUnit}
          units={voltageUnits}
          onUnitChange={setVUnit}
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
                      `${formatNumber(value / lf, 0)} ${lengthUnit}`
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
                      `${formatNumber(Number(label) / lf, 1)} ${lengthUnit}`
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
