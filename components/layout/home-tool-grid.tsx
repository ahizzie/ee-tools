"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TOOL_ICONS } from "@/components/layout/tool-icons";
import { useToolSearch } from "@/components/layout/tool-search-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { searchTools } from "@/config/tools";

export function HomeToolGrid() {
  const { query, setQuery } = useToolSearch();
  const matches = useMemo(() => searchTools(query), [query]);
  const trimmed = query.trim();

  return (
    <div className="grid gap-4">
      {trimmed ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {matches.length === 0
            ? `No tools match “${trimmed}”`
            : `${matches.length} ${matches.length === 1 ? "tool" : "tools"} matching “${trimmed}”`}
        </p>
      ) : null}
      {matches.length === 0 ? (
        <div className="grid gap-3 rounded-xl bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Try a different search, or clear the query to see every calculator.
          </p>
          <div>
            <Button type="button" variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((tool) => {
            const Icon = TOOL_ICONS[tool.icon];
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group min-w-0">
                <Card className="h-full transition-colors group-hover:bg-accent/40">
                  <CardHeader>
                    <CardTitle className="flex min-w-0 items-center gap-2">
                      <Icon className="size-5 shrink-0" />
                      <span className="min-w-0">{tool.name}</span>
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                    <p className="text-xs text-muted-foreground">{tool.category}</p>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
