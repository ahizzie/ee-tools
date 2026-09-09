export const CATEGORIES = [
  "Electronics",
  "Power Systems",
  "Cable Sizing",
] as const;

export type ToolCategory = (typeof CATEGORIES)[number];

export type ToolDefinition = {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: "zap" | "activity" | "cable" | "shield" | "shield-check" | "gauge";
};

export const tools: ToolDefinition[] = [
  {
    slug: "ohms-law",
    name: "Ohm's Law & Power",
    category: "Electronics",
    description:
      "Solve V = I × R and DC power P = V × I. Enter any two values among voltage, current, and resistance (or power plus one other).",
    icon: "zap",
  },
  {
    slug: "three-phase",
    name: "3-Phase Power & Current",
    category: "Power Systems",
    description:
      "Balanced three-phase active, reactive, and apparent power from line voltage, current, and power factor (IEC, 400 V default).",
    icon: "activity",
  },
  {
    slug: "voltage-drop",
    name: "AC Voltage Drop",
    category: "Cable Sizing",
    description:
      "Simplified IEC voltage drop for copper or aluminium conductors, with temperature, power factor, and optional reactance.",
    icon: "cable",
  },
  {
    slug: "protection-curves",
    name: "IDMT Protection Curves",
    category: "Power Systems",
    description:
      "Plot IEC 60255-151 time–current curves for several devices: Standard, Very, Extremely, and Long-time Inverse, plus independent (definite) time, with I> pickup, TMS, and optional I>>.",
    icon: "shield",
  },
  {
    slug: "protection-ct-alf",
    name: "Protection CT Sizing (ALF)",
    category: "Power Systems",
    description:
      "Check that a protection CT's accuracy limit factor (the 20 in 5P20) stays adequate once lead and relay burden are included, so it does not saturate at the fault level. Effective ALF must exceed the required ALF.",
    icon: "shield-check",
  },
  {
    slug: "metering-ct-burden",
    name: "Metering CT Burden",
    category: "Power Systems",
    description:
      "Check that the connected circuit burden of a metering CT sits within 25–100 % of its rated VA burden (BS EN 61869-2), so it stays within its guaranteed accuracy class.",
    icon: "gauge",
  },
];

export function getTool(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
  return CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = tools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<ToolCategory, ToolDefinition[]>,
  );
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((tool) => {
    const hay = `${tool.name} ${tool.slug} ${tool.category} ${tool.description}`.toLowerCase();
    return hay.includes(q);
  });
}
