import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ResultCardProps = {
  equation: string;
  children: ReactNode;
  title?: string;
};

export function ResultCard({
  equation,
  children,
  title = "Results",
}: ResultCardProps) {
  return (
    <Card className="print:ring-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="font-mono text-xs leading-relaxed">
          {equation}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">{children}</CardContent>
    </Card>
  );
}

type ResultRowProps = {
  label: string;
  value: string;
};

export function ResultRow({ label, value }: ResultRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}
