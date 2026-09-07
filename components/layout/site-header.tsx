import Link from "next/link";
import { Zap } from "lucide-react";
import { ToolSearch } from "@/components/layout/tool-search";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Zap className="size-5" />
          EE Tools
        </Link>
        <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground sm:inline">
          IEC / metric
        </span>
        <div className="ml-auto w-full max-w-sm">
          <ToolSearch />
        </div>
      </div>
    </header>
  );
}
