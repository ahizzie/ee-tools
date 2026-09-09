"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { SiteNav } from "@/components/layout/site-nav";
import { ToolSearch } from "@/components/layout/tool-search";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const navId = useId();

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navOpen]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-expanded={navOpen}
          aria-controls={navId}
          aria-label={navOpen ? "Close tool list" : "Open tool list"}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? <X /> : <Menu />}
        </Button>
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <Zap className="size-5" />
          <span>EE Tools</span>
        </Link>
        <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground sm:inline">
          IEC / metric
        </span>
        <div className="ml-auto min-w-0 w-full max-w-sm">
          <ToolSearch />
        </div>
      </div>
      {navOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-foreground/40"
            aria-label="Close tool list"
            onClick={() => setNavOpen(false)}
          />
          <aside
            id={navId}
            className="fixed inset-y-0 left-0 top-14 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto border-r bg-background p-4 shadow-lg"
          >
            <SiteNav onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      ) : null}
    </header>
  );
}
