import { describe, expect, it } from "vitest";
import { formatCopyResults, formatTimestamp } from "./copy-results";

describe("formatCopyResults", () => {
  const timestamp = new Date("2026-09-09T19:51:00.000Z");

  it("formats tool name, inputs, outputs, assumptions, and UTC timestamp", () => {
    const text = formatCopyResults({
      toolName: "3-Phase Amps ↔ kW",
      snapshot: {
        inputs: [
          { label: "Line-to-line voltage", value: "400 V" },
          { label: "Line current", value: "10 A" },
        ],
        outputs: [{ label: "Active power P (kW)", value: "5.543" }],
      },
      assumptions: [
        "Balanced three-phase sinusoidal quantities with a displacement power factor (cos φ).",
        "Line-to-line voltage.",
        "Enter either line current or active power in kW — not both.",
        "This fourth line is omitted.",
      ],
      timestamp,
    });

    expect(text).toContain("EE Tools — 3-Phase Amps ↔ kW");
    expect(text).toContain(formatTimestamp(timestamp));
    expect(text).toContain("- Line-to-line voltage: 400 V");
    expect(text).toContain("- Active power P (kW): 5.543");
    expect(text).toContain("Assumptions");
    expect(text).not.toContain("This fourth line is omitted.");
    expect(text.split("\n").filter((line) => line.startsWith("- ")).length).toBe(6);
  });

  it("puts a calculation error in the results section", () => {
    const text = formatCopyResults({
      toolName: "AC Voltage Drop",
      snapshot: {
        inputs: [{ label: "Power factor", value: "1.2" }],
        outputs: [],
        error: "Power factor must be between 0 and 1.",
      },
      assumptions: [],
      timestamp,
    });
    expect(text).toContain("- Power factor must be between 0 and 1.");
    expect(text).not.toContain("Assumptions");
  });
});
