import Link from "next/link";
import { Activity, Battery, Cable, Gauge, Shield, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tools, type ToolDefinition } from "@/config/tools";

const ICONS: Record<ToolDefinition["icon"], LucideIcon> = {
  zap: Zap,
  activity: Activity,
  cable: Cable,
  shield: Shield,
  "shield-check": ShieldCheck,
  gauge: Gauge,
  battery: Battery,
};

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Electrical engineering calculators
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          IEC / SI tools for everyday design checks. Pick a calculator — new
          tools appear here automatically when they are registered.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = ICONS[tool.icon];
          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:bg-accent/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5" />
                    {tool.name}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                  <p className="text-xs text-muted-foreground">{tool.category}</p>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
