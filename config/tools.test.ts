import { describe, expect, it } from "vitest";
import { searchTools, tools } from "./tools";

describe("searchTools", () => {
  it("returns every tool when the query is empty or whitespace", () => {
    expect(searchTools("")).toEqual([...tools]);
    expect(searchTools("   ")).toEqual([...tools]);
  });

  it("matches name, slug, category, and description case-insensitively", () => {
    expect(searchTools("battery").map((tool) => tool.slug)).toEqual(["battery-sizing"]);
    expect(searchTools("VOLTAGE-DROP").map((tool) => tool.slug)).toEqual(["voltage-drop"]);
    expect(searchTools("cable sizing").map((tool) => tool.slug)).toEqual([
      "voltage-drop",
      "adiabatic",
    ]);
    expect(searchTools("accuracy limit factor").map((tool) => tool.slug)).toEqual([
      "protection-ct-alf",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchTools("nec awg ampacity")).toEqual([]);
  });
});
