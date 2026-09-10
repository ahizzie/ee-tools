import { assertPositive } from "@/lib/calc/assert";
import rawBaseTable from "@/data/asnzs3008/ccc-base.json";
import rawCorrectionFactors from "@/data/asnzs3008/correction-factors.json";

export const CABLE_CCC_MATERIALS = ["copper", "aluminium"] as const;
export const CABLE_CCC_INSULATIONS = ["V-75", "V-90", "X-90"] as const;
export const CABLE_CCC_ARRANGEMENTS = ["multicore", "single-core"] as const;
export const CABLE_CCC_INSTALLATIONS = [
  "unenclosed-air",
  "enclosed-air",
  "buried-direct",
  "underground-enclosure",
] as const;

export type CableCccMaterial = (typeof CABLE_CCC_MATERIALS)[number];
export type CableCccInsulation = (typeof CABLE_CCC_INSULATIONS)[number];
export type CableCccArrangement = (typeof CABLE_CCC_ARRANGEMENTS)[number];
export type CableCccInstallation = (typeof CABLE_CCC_INSTALLATIONS)[number];

export type CableCccRating = {
  sizeMm2: number;
  currentA: number;
};

export type CableCccPath = {
  id: string;
  label: string;
  material: CableCccMaterial;
  insulation: CableCccInsulation;
  arrangement: CableCccArrangement;
  installation: CableCccInstallation;
  tableId: string;
  columnId: string;
  conditions: string;
  ratings: readonly CableCccRating[];
};

export type CableCccDataset = {
  standard: string;
  edition: string;
  title: string;
  sourceNote: string;
  copyrightNote: string;
  referenceConditionsNote: string;
  paths: readonly CableCccPath[];
};

export type CableCccCorrectionFactor = {
  id: string;
  tableId: string;
  columnId: string;
  kind: string;
  label: string;
  value: number;
};

export type CableCccCorrectionDataset = {
  standard: string;
  edition: string;
  title: string;
  sourceNote: string;
  copyrightNote: string;
  factors: readonly CableCccCorrectionFactor[];
};

export type CableCccInput = {
  material: CableCccMaterial;
  insulation: CableCccInsulation;
  arrangement: CableCccArrangement;
  installation: CableCccInstallation;
  sizeMm2: number;
};

export type CableCccResult = {
  currentA: number;
  equation: string;
  citation: string;
  standard: string;
  edition: string;
  tableId: string;
  columnId: string;
  pathId: string;
  pathLabel: string;
  conditions: string;
  sizeMm2: number;
  correctionFactorsApplied: readonly string[];
};

export type CableCccLookupCode =
  | "EMPTY_TABLE"
  | "NO_PATH"
  | "NO_SIZE"
  | "INVALID_INPUT";

export class CableCccLookupError extends Error {
  readonly code: CableCccLookupCode;

  constructor(code: CableCccLookupCode, message: string) {
    super(message);
    this.name = "CableCccLookupError";
    this.code = code;
  }
}

const LOOKUP_EQUATION =
  "I_z = tabulated CCC (AS/NZS 3008) · exact size match · no interpolation · no correction factors";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new CableCccLookupError("INVALID_INPUT", `${label} must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string {
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new CableCccLookupError("INVALID_INPUT", `${label} must be a string.`);
  }
  return value.trim();
}

function requireMember<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new CableCccLookupError(
      "INVALID_INPUT",
      `${label} must be one of: ${allowed.join(", ")}.`,
    );
  }
  return value as T;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CableCccLookupError("INVALID_INPUT", `${label} must be a finite number.`);
  }
  return value;
}

function parseRating(raw: unknown, pathId: string, index: number): CableCccRating {
  if (!isObject(raw)) {
    throw new CableCccLookupError(
      "INVALID_INPUT",
      `Path ${pathId} rating ${index} must be an object.`,
    );
  }
  const sizeMm2 = requireFiniteNumber(raw.sizeMm2, `Path ${pathId} rating ${index} size`);
  const currentA = requireFiniteNumber(raw.currentA, `Path ${pathId} rating ${index} current`);
  assertPositive(sizeMm2, `Path ${pathId} conductor size`);
  assertPositive(currentA, `Path ${pathId} tabulated CCC`);
  return { sizeMm2, currentA };
}

function parsePath(raw: unknown, index: number): CableCccPath {
  if (!isObject(raw)) {
    throw new CableCccLookupError("INVALID_INPUT", `Path ${index} must be an object.`);
  }
  const id = requireNonEmptyString(raw.id, `Path ${index} id`);
  const ratingsRaw = raw.ratings;
  if (!Array.isArray(ratingsRaw)) {
    throw new CableCccLookupError("INVALID_INPUT", `Path ${id} ratings must be an array.`);
  }
  const ratings = ratingsRaw.map((item, ratingIndex) => parseRating(item, id, ratingIndex));
  const seen = new Set<number>();
  for (const rating of ratings) {
    if (seen.has(rating.sizeMm2)) {
      throw new CableCccLookupError(
        "INVALID_INPUT",
        `Path ${id} has duplicate size ${rating.sizeMm2} mm².`,
      );
    }
    seen.add(rating.sizeMm2);
  }
  const tableId = optionalString(raw.tableId, `Path ${id} tableId`);
  const columnId = optionalString(raw.columnId, `Path ${id} columnId`);
  if (ratings.length > 0 && (tableId === "" || columnId === "")) {
    throw new CableCccLookupError(
      "INVALID_INPUT",
      `Path ${id} has ratings but no tableId/columnId citation. A number without a table citation is not allowed.`,
    );
  }
  return {
    id,
    label: requireNonEmptyString(raw.label, `Path ${id} label`),
    material: requireMember(raw.material, CABLE_CCC_MATERIALS, `Path ${id} material`),
    insulation: requireMember(raw.insulation, CABLE_CCC_INSULATIONS, `Path ${id} insulation`),
    arrangement: requireMember(raw.arrangement, CABLE_CCC_ARRANGEMENTS, `Path ${id} arrangement`),
    installation: requireMember(
      raw.installation,
      CABLE_CCC_INSTALLATIONS,
      `Path ${id} installation`,
    ),
    tableId,
    columnId,
    conditions: optionalString(raw.conditions, `Path ${id} conditions`),
    ratings,
  };
}

export function parseCableCccDataset(raw: unknown): CableCccDataset {
  if (!isObject(raw)) {
    throw new CableCccLookupError("INVALID_INPUT", "CCC dataset must be an object.");
  }
  if (!Array.isArray(raw.paths)) {
    throw new CableCccLookupError("INVALID_INPUT", "CCC dataset paths must be an array.");
  }
  const paths = raw.paths.map((path, index) => parsePath(path, index));
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  for (const path of paths) {
    if (seenIds.has(path.id)) {
      throw new CableCccLookupError("INVALID_INPUT", `Duplicate path id ${path.id}.`);
    }
    seenIds.add(path.id);
    const key = pathKey(path);
    if (seenKeys.has(key)) {
      throw new CableCccLookupError(
        "INVALID_INPUT",
        `Duplicate lookup key ${key} (path ${path.id}).`,
      );
    }
    seenKeys.add(key);
  }
  return {
    standard: requireNonEmptyString(raw.standard, "standard"),
    edition: requireNonEmptyString(raw.edition, "edition"),
    title: requireNonEmptyString(raw.title, "title"),
    sourceNote: requireNonEmptyString(raw.sourceNote, "sourceNote"),
    copyrightNote: requireNonEmptyString(raw.copyrightNote, "copyrightNote"),
    referenceConditionsNote: requireNonEmptyString(
      raw.referenceConditionsNote,
      "referenceConditionsNote",
    ),
    paths,
  };
}

export function parseCableCccCorrectionDataset(raw: unknown): CableCccCorrectionDataset {
  if (!isObject(raw)) {
    throw new CableCccLookupError("INVALID_INPUT", "Correction-factor dataset must be an object.");
  }
  if (!Array.isArray(raw.factors)) {
    throw new CableCccLookupError("INVALID_INPUT", "Correction-factor dataset factors must be an array.");
  }
  const factors = raw.factors.map((item, index) => {
    if (!isObject(item)) {
      throw new CableCccLookupError("INVALID_INPUT", `Correction factor ${index} must be an object.`);
    }
    const value = requireFiniteNumber(item.value, `Correction factor ${index} value`);
    assertPositive(value, `Correction factor ${index} value`);
    const tableId = requireNonEmptyString(item.tableId, `Correction factor ${index} tableId`);
    const columnId = requireNonEmptyString(item.columnId, `Correction factor ${index} columnId`);
    return {
      id: requireNonEmptyString(item.id, `Correction factor ${index} id`),
      tableId,
      columnId,
      kind: requireNonEmptyString(item.kind, `Correction factor ${index} kind`),
      label: requireNonEmptyString(item.label, `Correction factor ${index} label`),
      value,
    };
  });
  return {
    standard: requireNonEmptyString(raw.standard, "standard"),
    edition: requireNonEmptyString(raw.edition, "edition"),
    title: requireNonEmptyString(raw.title, "title"),
    sourceNote: requireNonEmptyString(raw.sourceNote, "sourceNote"),
    copyrightNote: requireNonEmptyString(raw.copyrightNote, "copyrightNote"),
    factors,
  };
}

export function pathKey(input: {
  material: CableCccMaterial;
  insulation: CableCccInsulation;
  arrangement: CableCccArrangement;
  installation: CableCccInstallation;
}): string {
  return `${input.material}|${input.insulation}|${input.arrangement}|${input.installation}`;
}

export function findCableCccPath(
  dataset: CableCccDataset,
  input: Omit<CableCccInput, "sizeMm2">,
): CableCccPath | undefined {
  const key = pathKey(input);
  return dataset.paths.find((path) => pathKey(path) === key);
}

export function uniqueOptions<T extends string>(
  paths: readonly CableCccPath[],
  field: keyof Pick<CableCccPath, "material" | "insulation" | "arrangement" | "installation">,
): T[] {
  const seen = new Set<T>();
  const values: T[] = [];
  for (const path of paths) {
    const value = path[field] as T;
    if (!seen.has(value)) {
      seen.add(value);
      values.push(value);
    }
  }
  return values;
}

export function datasetHasRatings(dataset: CableCccDataset): boolean {
  return dataset.paths.some((path) => path.ratings.length > 0);
}

function formatSizeList(ratings: readonly CableCccRating[]): string {
  if (ratings.length === 0) return "none";
  return ratings.map((rating) => `${rating.sizeMm2} mm²`).join(", ");
}

export function lookupCableCcc(
  input: CableCccInput,
  dataset: CableCccDataset,
  corrections: CableCccCorrectionDataset = shippedCorrectionFactors,
): CableCccResult {
  assertPositive(input.sizeMm2, "Conductor size");
  if (corrections.factors.length > 0) {
    throw new CableCccLookupError(
      "INVALID_INPUT",
      "Loaded correction-factor tables are not applied in this MVP. Remove factors from the correction-factor file, or wait for a derating release that cites each factor’s table and column.",
    );
  }

  const path = findCableCccPath(dataset, input);
  if (!path) {
    throw new CableCccLookupError(
      "NO_PATH",
      `No AS/NZS 3008.1.1:${dataset.edition} table path is registered for ${input.material} ${input.insulation} ${input.arrangement}, ${input.installation}. The lookup fails closed rather than guessing a column.`,
    );
  }

  const standardLabel = `${dataset.standard}:${dataset.edition}`;
  if (path.ratings.length === 0) {
    throw new CableCccLookupError(
      "EMPTY_TABLE",
      `No licensed CCC ratings are loaded for ${path.label} (${standardLabel}, path ${path.id}). Add tableId, columnId, and ratings from a licensed copy of the standard; see docs/ASNZS_CABLE_CCC.md. This tool does not invent ampacity.`,
    );
  }

  const rating = path.ratings.find((item) => item.sizeMm2 === input.sizeMm2);
  if (!rating) {
    throw new CableCccLookupError(
      "NO_SIZE",
      `No tabulated CCC for ${input.sizeMm2} mm² on ${path.label} (${standardLabel} Table ${path.tableId}, column ${path.columnId}). Loaded sizes: ${formatSizeList(path.ratings)}. Intermediate sizes are not interpolated.`,
    );
  }

  const citation = `${standardLabel} Table ${path.tableId}, column ${path.columnId}`;
  return {
    currentA: rating.currentA,
    equation: `I_z = ${citation} @ ${input.sizeMm2} mm² (base tabulated value; no correction factors)`,
    citation,
    standard: dataset.standard,
    edition: dataset.edition,
    tableId: path.tableId,
    columnId: path.columnId,
    pathId: path.id,
    pathLabel: path.label,
    conditions:
      path.conditions ||
      dataset.referenceConditionsNote,
    sizeMm2: input.sizeMm2,
    correctionFactorsApplied: [],
  };
}

export const LOOKUP_EQUATION_PLACEHOLDER = LOOKUP_EQUATION;

export const shippedCableCccDataset = parseCableCccDataset(rawBaseTable);
export const shippedCorrectionFactors = parseCableCccCorrectionDataset(rawCorrectionFactors);

export const INSTALLATION_LABELS: Record<CableCccInstallation, string> = {
  "unenclosed-air": "Unenclosed in air",
  "enclosed-air": "Enclosed in air (conduit / trunking)",
  "buried-direct": "Buried direct",
  "underground-enclosure": "Underground enclosure",
};

export const INSULATION_LABELS: Record<CableCccInsulation, string> = {
  "V-75": "V-75 (PVC 75 °C)",
  "V-90": "V-90 (PVC 90 °C)",
  "X-90": "X-90 (XLPE 90 °C)",
};

export const ARRANGEMENT_LABELS: Record<CableCccArrangement, string> = {
  multicore: "Multicore",
  "single-core": "Single-core",
};

export const MATERIAL_LABELS: Record<CableCccMaterial, string> = {
  copper: "Copper",
  aluminium: "Aluminium",
};
