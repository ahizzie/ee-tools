import type { ReactNode } from "react";
import { AppToaster } from "@/components/layout/app-toaster";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { ToolSearchProvider } from "@/components/layout/tool-search-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToolSearchProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 gap-4 px-4 py-6 md:gap-8">
          <SiteSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        <SiteFooter />
        <AppToaster />
      </div>
    </ToolSearchProvider>
  );
}
