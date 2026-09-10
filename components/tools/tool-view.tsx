"use client";

import { AdiabaticCalculator } from "@/components/tools/adiabatic-calculator";
import { AmpsKwCalculator } from "@/components/tools/amps-kw-calculator";
import { BatterySizingCalculator } from "@/components/tools/battery-sizing-calculator";
import { MeteringCtBurdenCalculator } from "@/components/tools/metering-ct-burden-calculator";
import { ProtectionCtAlfCalculator } from "@/components/tools/protection-ct-alf-calculator";
import { ProtectionCurvesCalculator } from "@/components/tools/protection-curves-calculator";
import { ThreePhaseCalculator } from "@/components/tools/three-phase-calculator";
import { CableCccAsnzsCalculator } from "@/components/tools/cable-ccc-asnzs-calculator";
import { VoltageDropCalculator } from "@/components/tools/voltage-drop-calculator";

const calculators = {
  "amps-kw": AmpsKwCalculator,
  "three-phase": ThreePhaseCalculator,
  "voltage-drop": VoltageDropCalculator,
  "cable-ccc-asnzs": CableCccAsnzsCalculator,
  adiabatic: AdiabaticCalculator,
  "protection-curves": ProtectionCurvesCalculator,
  "protection-ct-alf": ProtectionCtAlfCalculator,
  "metering-ct-burden": MeteringCtBurdenCalculator,
  "battery-sizing": BatterySizingCalculator,
} as const;

export function ToolView({ slug }: { slug: string }) {
  const Calculator = calculators[slug as keyof typeof calculators];
  if (!Calculator) return null;
  return <Calculator />;
}

export function hasCalculator(slug: string): boolean {
  return slug in calculators;
}
