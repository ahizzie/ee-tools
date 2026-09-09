import { SiteNav } from "@/components/layout/site-nav";

export function SiteSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 print:hidden md:block">
      <nav className="sticky top-20">
        <SiteNav />
      </nav>
    </aside>
  );
}
