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
  icon: "zap" | "activity" | "cable" | "shield";
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
