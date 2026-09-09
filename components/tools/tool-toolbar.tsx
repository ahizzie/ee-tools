"use client";

import { Copy, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PrintButton } from "@/components/layout/print-button";
import { Button } from "@/components/ui/button";
import { useToolSession } from "@/components/tools/tool-session";
import { getToolAssumptions } from "@/config/tool-assumptions";
import { getToolExamples } from "@/config/tool-share";
import { formatCopyResults } from "@/lib/copy-results";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to execCommand
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function ToolToolbar() {
  const session = useToolSession();
  const [busy, setBusy] = useState<"results" | "link" | null>(null);
  const examples = getToolExamples(session.slug);

  async function copyResults() {
    const snapshot = session.getSnapshot();
    if (!snapshot) {
      toast.error("Nothing to copy yet.");
      return;
    }
    setBusy("results");
    const assumptions = getToolAssumptions(session.slug)?.assumes ?? [];
    const text = formatCopyResults({
      toolName: session.name,
      snapshot,
      assumptions,
      timestamp: new Date(),
    });
    const ok = await copyToClipboard(text);
    setBusy(null);
    if (ok) toast.success("Results copied");
    else toast.error("Could not copy results");
  }

  async function copyLink() {
    setBusy("link");
    const href = session.getShareHref() || window.location.href;
    const ok = await copyToClipboard(href);
    setBusy(null);
    if (ok) toast.success("Link copied");
    else toast.error("Could not copy link");
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      {examples.map((example) => (
        <Button
          key={example.id}
          type="button"
          variant="outline"
          title={`Load example: ${example.label}`}
          onClick={() => session.requestExample(example.id)}
        >
          {example.label}
        </Button>
      ))}
      <Button type="button" variant="outline" onClick={copyResults} disabled={busy !== null}>
        {busy === "results" ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        Copy results
      </Button>
      <Button type="button" variant="outline" onClick={copyLink} disabled={busy !== null}>
        {busy === "link" ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Link2 data-icon="inline-start" />
        )}
        Copy link
      </Button>
      <PrintButton />
    </div>
  );
}
