import Link from "next/link";
import { Activity, Cable, Gauge, Shield, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { CATEGORIES, getToolsByCategory, type ToolDefinition } from "@/config/tools";

const ICONS: Record<ToolDefinition["icon"], LucideIcon> = {
  zap: Zap,
  activity: Activity,
  cable: Cable,
  shield: Shield,
  "shield-check": ShieldCheck,
  gauge: Gauge,
};

export function SiteSidebar() {
  const grouped = getToolsByCategory();

  return (
    <aside className="hidden w-56 shrink-0 print:hidden md:block">
      <nav className="sticky top-20 grid gap-6 text-sm">
        {CATEGORIES.map((category) => {
          const categoryTools = grouped[category];
          return (
            <div key={category} className="grid gap-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {category}
              </p>
              {categoryTools.length === 0 ? (
                <p className="text-muted-foreground">Coming soon</p>
              ) : (
                <ul className="grid gap-1">
                  {categoryTools.map((tool) => {
                    const Icon = ICONS[tool.icon];
                    return (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                        >
                          <Icon className="size-4 shrink-0" />
                          {tool.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
