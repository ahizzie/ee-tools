"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTools } from "@/config/tools";

export function ToolSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchTools(query), [query]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Search tools…"
        className="pl-8"
        aria-label="Search tools"
      />
      {open && query.trim() ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {results.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No tools found</p>
          ) : (
            results.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="font-medium">{tool.name}</span>
                <span className="ml-2 text-muted-foreground">{tool.category}</span>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
