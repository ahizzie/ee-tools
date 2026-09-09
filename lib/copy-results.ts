export type CopyRow = {
  label: string;
  value: string;
};

export type ToolSnapshot = {
  inputs: CopyRow[];
  outputs: CopyRow[];
  error?: string;
};

export function formatTimestamp(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 19).replace("T", " ")} UTC`;
}

export function formatCopyResults(input: {
  toolName: string;
  snapshot: ToolSnapshot;
  assumptions: readonly string[];
  timestamp: Date;
}): string {
  const lines: string[] = [
    `EE Tools — ${input.toolName}`,
    formatTimestamp(input.timestamp),
    "",
    "Inputs",
  ];

  if (input.snapshot.inputs.length === 0) {
    lines.push("- (none)");
  } else {
    for (const row of input.snapshot.inputs) {
      lines.push(`- ${row.label}: ${row.value}`);
    }
  }

  lines.push("", "Results");
  if (input.snapshot.error) {
    lines.push(`- ${input.snapshot.error}`);
  } else if (input.snapshot.outputs.length === 0) {
    lines.push("- (none)");
  } else {
    for (const row of input.snapshot.outputs) {
      lines.push(`- ${row.label}: ${row.value}`);
    }
  }

  const assumptions = input.assumptions.filter((item) => item.trim().length > 0).slice(0, 3);
  if (assumptions.length > 0) {
    lines.push("", "Assumptions");
    for (const item of assumptions) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n");
}
