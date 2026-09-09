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
        <CardDescription className="font-mono text-xs leading-relaxed break-words">
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
  valueClassName?: string;
  labelClassName?: string;
};

export function ResultRow({
  label,
  value,
  valueClassName,
  labelClassName,
}: ResultRowProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/60 py-1.5 last:border-0">
      <span className={`min-w-0 break-words ${labelClassName ?? "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`min-w-0 break-words text-right ${valueClassName ?? "font-mono font-medium tabular-nums"}`}
      >
        {value}
      </span>
    </div>
  );
}
