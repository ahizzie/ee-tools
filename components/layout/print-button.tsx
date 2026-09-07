"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer data-icon="inline-start" />
      Print / Save PDF
    </Button>
  );
}
