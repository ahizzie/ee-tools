export type UnitOption = {
  value: string;
  label: string;
  /** Multiply display value by this to get SI base units. */
  factor: number;
};

export const voltageUnits: UnitOption[] = [
  { value: "mV", label: "mV", factor: 1e-3 },
  { value: "V", label: "V", factor: 1 },
  { value: "kV", label: "kV", factor: 1e3 },
];

export const currentUnits: UnitOption[] = [
  { value: "mA", label: "mA", factor: 1e-3 },
  { value: "A", label: "A", factor: 1 },
  { value: "kA", label: "kA", factor: 1e3 },
];

export const resistanceUnits: UnitOption[] = [
  { value: "mΩ", label: "mΩ", factor: 1e-3 },
  { value: "Ω", label: "Ω", factor: 1 },
  { value: "kΩ", label: "kΩ", factor: 1e3 },
];

export const powerUnits: UnitOption[] = [
  { value: "W", label: "W", factor: 1 },
  { value: "kW", label: "kW", factor: 1e3 },
  { value: "MW", label: "MW", factor: 1e6 },
];

export const apparentPowerUnits: UnitOption[] = [
  { value: "VA", label: "VA", factor: 1 },
  { value: "kVA", label: "kVA", factor: 1e3 },
  { value: "MVA", label: "MVA", factor: 1e6 },
];

export const lengthUnits: UnitOption[] = [
  { value: "m", label: "m", factor: 1 },
  { value: "km", label: "km", factor: 1e3 },
];

export const areaUnits: UnitOption[] = [
  { value: "mm²", label: "mm²", factor: 1 },
];

export const temperatureUnits: UnitOption[] = [
  { value: "°C", label: "°C", factor: 1 },
];

export function toBase(display: number, factor: number): number {
  return display * factor;
}

export function fromBase(base: number, factor: number): number {
  return base / factor;
}

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(4);
  return value.toLocaleString("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
