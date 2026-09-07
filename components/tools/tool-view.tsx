"use client";

import { OhmsLawCalculator } from "@/components/tools/ohms-law-calculator";
import { ProtectionCurvesCalculator } from "@/components/tools/protection-curves-calculator";
import { ThreePhaseCalculator } from "@/components/tools/three-phase-calculator";
import { VoltageDropCalculator } from "@/components/tools/voltage-drop-calculator";

const calculators = {
  "ohms-law": OhmsLawCalculator,
  "three-phase": ThreePhaseCalculator,
  "voltage-drop": VoltageDropCalculator,
  "protection-curves": ProtectionCurvesCalculator,
} as const;

export function ToolView({ slug }: { slug: string }) {
  const Calculator = calculators[slug as keyof typeof calculators];
  if (!Calculator) return null;
  return <Calculator />;
}

export function hasCalculator(slug: string): boolean {
  return slug in calculators;
}
