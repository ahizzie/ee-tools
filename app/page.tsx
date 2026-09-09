import { HomeToolGrid } from "@/components/layout/home-tool-grid";

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
      <HomeToolGrid />
    </div>
  );
}
