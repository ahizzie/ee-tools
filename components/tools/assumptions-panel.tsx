import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="print:break-inside-avoid" id="assumptions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="size-4" aria-hidden />
          Assumptions & applicability
        </CardTitle>
        <CardDescription>
          What this calculator models, when not to use it, and the ranges it
          will reject.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <AssumptionList title="Assumes" items={assumptions.assumes} />
        <AssumptionList title="Do not use for" items={assumptions.notFor} />
        <AssumptionList title="Standards & clauses" items={assumptions.standards} />
        <AssumptionList
          title="Signs, rounding, and display"
          items={assumptions.conventions}
        />
        <AssumptionList title="Validation ranges" items={assumptions.ranges} />
      </CardContent>
    </Card>
  );
}
