"use client";

import { useMemo, useState } from "react";
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
  adiabaticKFactor,
  adiabaticMinSection,
  INSULATION_LIMITS,
  type ConductorMaterial,
  type InsulationType,
} from "@/lib/calc/adiabatic";
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
  const [material, setMaterial] = useState<ConductorMaterial>("copper");
  const [kMode, setKMode] = useState<KMode>("pvc");
  const [initialTemp, setInitialTemp] = useState(String(INSULATION_LIMITS.pvc.initialC));
  const [finalTemp, setFinalTemp] = useState(String(INSULATION_LIMITS.pvc.finalC));
  const [customK, setCustomK] = useState("115");
  const [current, setCurrent] = useState("10");
  const [iUnit, setIUnit] = useState("kA");
  const [duration, setDuration] = useState("1");
  const [tUnit, setTUnit] = useState("s");

  const iff = currentUnits.find((u) => u.value === iUnit)?.factor ?? 1;
  const tf = timeUnits.find((u) => u.value === tUnit)?.factor ?? 1;

  const result = useMemo(() => {
    const currentA = parseOptionalNumber(current);
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
          material,
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
    current,
    duration,
    iff,
    tf,
  ]);

  function applyInsulation(next: KMode) {
    setKMode(next);
    if (next === "pvc" || next === "xlpe") {
      setInitialTemp(String(INSULATION_LIMITS[next].initialC));
      setFinalTemp(String(INSULATION_LIMITS[next].finalC));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          IEC 60364-4-43 / IEC 60949 adiabatic heating: minimum conductor CSA
          so the core stays within the insulation temperature limit for a
          short-circuit of duration typically ≤ 5 s.
        </p>
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
          <Label>Insulation / k</Label>
          <Select
            value={kMode}
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
        {kMode === "custom-k" ? (
          <NumericInput
            id="ad-k"
            label="k-factor"
            value={customK}
            onChange={setCustomK}
          />
        ) : (
          <>
            <NumericInput
              id="ad-ti"
              label="Initial temperature"
              value={initialTemp}
              onChange={setInitialTemp}
              unit="°C"
              units={temperatureUnits}
            />
            <NumericInput
              id="ad-tf"
              label="Final temperature limit"
              value={finalTemp}
              onChange={setFinalTemp}
              unit="°C"
              units={temperatureUnits}
            />
          </>
        )}
        <NumericInput
          id="ad-i"
          label="Short-circuit current (rms)"
          value={current}
          onChange={setCurrent}
          unit={iUnit}
          units={currentUnits}
          onUnitChange={setIUnit}
        />
        <NumericInput
          id="ad-t"
          label="Fault duration"
          value={duration}
          onChange={setDuration}
          unit={tUnit}
          units={timeUnits}
          onUnitChange={setTUnit}
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
