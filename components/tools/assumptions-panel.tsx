import { ChevronDown, Info } from "lucide-react";
import { getToolAssumptions } from "@/config/tool-assumptions";

function AssumptionList({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="grid gap-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function AssumptionsPanel({ slug }: { slug: string }) {
  const assumptions = getToolAssumptions(slug);
  if (!assumptions) return null;

  return (
    <details
      className="group rounded-xl bg-card ring-1 ring-foreground/10 print:break-inside-avoid"
      id="assumptions"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium outline-none [&::-webkit-details-marker]:hidden focus-visible:ring-3 focus-visible:ring-ring/50">
        <Info className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">Assumptions & applicability</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="grid gap-4 px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          What this calculator models, when not to use it, and the ranges it
          will reject.
        </p>
        <AssumptionList title="Assumes" items={assumptions.assumes} />
        <AssumptionList title="Do not use for" items={assumptions.notFor} />
        <AssumptionList title="Standards & clauses" items={assumptions.standards} />
        <AssumptionList
          title="Signs, rounding, and display"
          items={assumptions.conventions}
        />
        <AssumptionList title="Validation ranges" items={assumptions.ranges} />
      </div>
    </details>
  );
}
