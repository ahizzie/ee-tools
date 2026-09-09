import { describe, expect, it } from "vitest";
import { tools } from "@/config/tools";
import { getToolAssumptions, toolAssumptions } from "@/config/tool-assumptions";

const PLACEHOLDER = /TODO|TBD|placeholder|lorem ipsum|coming soon/i;

describe("toolAssumptions", () => {
  it("covers every registered tool with real, non-empty sections", () => {
    expect(Object.keys(toolAssumptions).sort()).toEqual(
      tools.map((tool) => tool.slug).sort(),
    );

    for (const tool of tools) {
      const assumptions = getToolAssumptions(tool.slug);
      expect(assumptions, tool.slug).toBeDefined();
      const sections = [
        assumptions!.assumes,
        assumptions!.notFor,
        assumptions!.standards,
        assumptions!.conventions,
        assumptions!.ranges,
      ];
      for (const items of sections) {
        expect(items.length, tool.slug).toBeGreaterThan(0);
        for (const item of items) {
          expect(item.trim().length, item).toBeGreaterThan(20);
          expect(item).not.toMatch(PLACEHOLDER);
        }
      }
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getToolAssumptions("not-a-tool")).toBeUndefined();
  });
});
