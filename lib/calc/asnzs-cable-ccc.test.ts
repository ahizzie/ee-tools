import { describe, expect, it } from "vitest";
import rawBaseTable from "@/data/asnzs3008/ccc-base.json";
import rawCorrectionFactors from "@/data/asnzs3008/correction-factors.json";
import {
  CableCccLookupError,
  lookupCableCcc,
  parseCableCccCorrectionDataset,
  parseCableCccDataset,
  pathKey,
  shippedCableCccDataset,
  shippedCorrectionFactors,
  uniqueOptions,
  type CableCccDataset,
  type CableCccPath,
} from "./asnzs-cable-ccc";

function fixturePath(overrides: Partial<CableCccPath> = {}): CableCccPath {
  return {
    id: "test-cu-x90-mc-unenclosed-air",
    label: "Test copper X-90 multicore, unenclosed in air",
    material: "copper",
    insulation: "X-90",
    arrangement: "multicore",
    installation: "unenclosed-air",
    tableId: "TEST-T",
    columnId: "TEST-C",
    conditions: "Test fixture only — not a standard table cell.",
    ratings: [
      { sizeMm2: 16, currentA: 1 },
      { sizeMm2: 25, currentA: 2 },
    ],
    ...overrides,
  };
}

function fixtureDataset(paths: CableCccPath[] = [fixturePath()]): CableCccDataset {
  return parseCableCccDataset({
    standard: "AS/NZS 3008.1.1",
    edition: "2017",
    title: "Test fixture dataset",
    sourceNote: "Synthetic ratings for unit tests. Values 1 A and 2 A are not from AS/NZS 3008.",
    copyrightNote: "Do not treat fixture amperes as tabulated CCC.",
    referenceConditionsNote: "Fixture has no licensed reference conditions.",
    paths,
  });
}

describe("shipped AS/NZS 3008 CCC data", () => {
  it("parses the empty base table and has no ratings", () => {
    expect(shippedCableCccDataset.standard).toBe("AS/NZS 3008.1.1");
    expect(shippedCableCccDataset.edition).toBe("2017");
    expect(shippedCableCccDataset.paths.length).toBe(8);
    expect(shippedCableCccDataset.paths.every((path) => path.ratings.length === 0)).toBe(true);
    expect(shippedCorrectionFactors.factors).toEqual([]);
    expect(parseCableCccDataset(rawBaseTable)).toEqual(shippedCableCccDataset);
    expect(parseCableCccCorrectionDataset(rawCorrectionFactors)).toEqual(shippedCorrectionFactors);
  });

  it("registers copper and aluminium V-90/X-90 multicore air paths only", () => {
    expect(uniqueOptions(shippedCableCccDataset.paths, "material")).toEqual([
      "copper",
      "aluminium",
    ]);
    expect(uniqueOptions(shippedCableCccDataset.paths, "insulation")).toEqual(["V-90", "X-90"]);
    expect(uniqueOptions(shippedCableCccDataset.paths, "arrangement")).toEqual(["multicore"]);
    expect(uniqueOptions(shippedCableCccDataset.paths, "installation")).toEqual([
      "unenclosed-air",
      "enclosed-air",
    ]);
  });

  it("fails closed on a typical 16 mm² copper X-90 unenclosed lookup", () => {
    expect(() =>
      lookupCableCcc(
        {
          material: "copper",
          insulation: "X-90",
          arrangement: "multicore",
          installation: "unenclosed-air",
          sizeMm2: 16,
        },
        shippedCableCccDataset,
      ),
    ).toThrow(CableCccLookupError);
    try {
      lookupCableCcc(
        {
          material: "copper",
          insulation: "X-90",
          arrangement: "multicore",
          installation: "unenclosed-air",
          sizeMm2: 16,
        },
        shippedCableCccDataset,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(CableCccLookupError);
      expect((error as CableCccLookupError).code).toBe("EMPTY_TABLE");
      expect((error as Error).message).toMatch(/does not invent ampacity/i);
    }
  });
});

describe("parseCableCccDataset", () => {
  it("rejects ratings that have no table or column citation", () => {
    expect(() =>
      fixtureDataset([
        fixturePath({
          tableId: "",
          columnId: "",
        }),
      ]),
    ).toThrow(/tableId\/columnId/);
  });

  it("rejects duplicate sizes on one path", () => {
    expect(() =>
      fixtureDataset([
        fixturePath({
          ratings: [
            { sizeMm2: 16, currentA: 1 },
            { sizeMm2: 16, currentA: 3 },
          ],
        }),
      ]),
    ).toThrow(/duplicate size 16/);
  });

  it("rejects a non-positive tabulated current", () => {
    expect(() =>
      fixtureDataset([
        fixturePath({
          ratings: [{ sizeMm2: 16, currentA: 0 }],
        }),
      ]),
    ).toThrow(/greater than zero/);
  });

  it("rejects unknown insulation families", () => {
    expect(() =>
      parseCableCccDataset({
        standard: "AS/NZS 3008.1.1",
        edition: "2017",
        title: "t",
        sourceNote: "s",
        copyrightNote: "c",
        referenceConditionsNote: "r",
        paths: [
          {
            ...fixturePath(),
            insulation: "EPR-110",
            ratings: [],
            tableId: "",
            columnId: "",
          },
        ],
      }),
    ).toThrow(/insulation must be one of/);
  });
});

describe("lookupCableCcc with a test fixture", () => {
  const dataset = fixtureDataset();

  it("returns the cited fixture cell for 16 mm²", () => {
    const result = lookupCableCcc(
      {
        material: "copper",
        insulation: "X-90",
        arrangement: "multicore",
        installation: "unenclosed-air",
        sizeMm2: 16,
      },
      dataset,
    );
    expect(result.currentA).toBe(1);
    expect(result.tableId).toBe("TEST-T");
    expect(result.columnId).toBe("TEST-C");
    expect(result.citation).toBe("AS/NZS 3008.1.1:2017 Table TEST-T, column TEST-C");
    expect(result.correctionFactorsApplied).toEqual([]);
    expect(result.equation).toMatch(/no correction factors/);
  });

  it("does not interpolate between tabulated sizes", () => {
    expect(() =>
      lookupCableCcc(
        {
          material: "copper",
          insulation: "X-90",
          arrangement: "multicore",
          installation: "unenclosed-air",
          sizeMm2: 18,
        },
        dataset,
      ),
    ).toThrow(/not interpolated/);
  });

  it("fails closed for a registered path that is missing from the fixture", () => {
    expect(() =>
      lookupCableCcc(
        {
          material: "aluminium",
          insulation: "V-90",
          arrangement: "multicore",
          installation: "enclosed-air",
          sizeMm2: 16,
        },
        dataset,
      ),
    ).toThrow(/No AS\/NZS 3008\.1\.1:2017 table path/);
  });

  it("rejects a non-positive conductor size", () => {
    expect(() =>
      lookupCableCcc(
        {
          material: "copper",
          insulation: "X-90",
          arrangement: "multicore",
          installation: "unenclosed-air",
          sizeMm2: 0,
        },
        dataset,
      ),
    ).toThrow(/Conductor size must be greater than zero/);
  });

  it("refuses to apply correction-factor tables in this MVP", () => {
    const corrections = parseCableCccCorrectionDataset({
      standard: "AS/NZS 3008.1.1",
      edition: "2017",
      title: "Fixture factors",
      sourceNote: "Synthetic.",
      copyrightNote: "Not a standard table.",
      factors: [
        {
          id: "group-3",
          tableId: "TEST-22",
          columnId: "TEST-G",
          kind: "grouping",
          label: "3 circuits enclosed",
          value: 0.7,
        },
      ],
    });
    expect(() =>
      lookupCableCcc(
        {
          material: "copper",
          insulation: "X-90",
          arrangement: "multicore",
          installation: "unenclosed-air",
          sizeMm2: 16,
        },
        dataset,
        corrections,
      ),
    ).toThrow(/not applied in this MVP/);
  });
});

describe("pathKey", () => {
  it("joins material, insulation, arrangement, and installation", () => {
    expect(
      pathKey({
        material: "copper",
        insulation: "X-90",
        arrangement: "multicore",
        installation: "unenclosed-air",
      }),
    ).toBe("copper|X-90|multicore|unenclosed-air");
  });
});
