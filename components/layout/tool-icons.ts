import { Activity, Battery, Cable, Gauge, Shield, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import type { ToolDefinition } from "@/config/tools";

export const TOOL_ICONS: Record<ToolDefinition["icon"], LucideIcon> = {
  zap: Zap,
  activity: Activity,
  cable: Cable,
  shield: Shield,
  "shield-check": ShieldCheck,
  gauge: Gauge,
  battery: Battery,
};
