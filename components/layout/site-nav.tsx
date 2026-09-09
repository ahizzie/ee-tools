"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TOOL_ICONS } from "@/components/layout/tool-icons";
import { useToolSearch } from "@/components/layout/tool-search-context";
import { CATEGORIES, getToolsByCategory, searchTools } from "@/config/tools";

type SiteNavProps = {
  onNavigate?: () => void;
};

export function SiteNav({ onNavigate }: SiteNavProps) {
  const { query } = useToolSearch();
  const grouped = getToolsByCategory();
  const results = useMemo(() => searchTools(query), [query]);
  const filtering = query.trim().length > 0;

  return (
    <div className="grid gap-6 text-sm">
      {CATEGORIES.map((category) => {
        const categoryTools = filtering
          ? results.filter((tool) => tool.category === category)
          : grouped[category];
        if (filtering && categoryTools.length === 0) return null;
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
                  const Icon = TOOL_ICONS[tool.icon];
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        onClick={onNavigate}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0">{tool.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      {filtering && results.length === 0 ? (
        <p className="text-muted-foreground">No tools match “{query.trim()}”</p>
      ) : null}
    </div>
  );
}
