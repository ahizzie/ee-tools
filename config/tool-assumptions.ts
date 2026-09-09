import type { ToolSlug } from "@/config/tools";

export type ToolAssumptions = {
  /** What the model takes as true. */
  assumes: string[];
  /** Situations where this calculator must not be used. */
  notFor: string[];
  /** Standards or clauses actually used in the model. Omit rather than invent. */
  standards: string[];
  /** Sign conventions, rounding, and display notes. */
  conventions: string[];
  /** Validation ranges the calc will reject. */
  ranges: string[];
};

export const toolAssumptions = {
  "ohms-law": {
    assumes: [
      "DC (or RMS-equivalent) Ohm’s law and Joule heating: V = I × R and P = V × I = I²R = V²/R.",
      "A linear passive resistance. Enter any two of V, I, and R, or power plus one of V, I, or R.",
      "All quantities are unsigned magnitudes. Negative values are rejected (no advanced signed-power mode).",
    ],
    notFor: [
      "AC circuits with reactance or impedance (use 3-phase power or AC voltage drop).",
      "Three-phase line quantities, unbalanced networks, or temperature-dependent resistance.",
      "Bidirectional / regenerative power flow, or treating a negative result as direction.",
    ],
    standards: [
      "Basic circuit theory only — no IEC product standard is applied.",
    ],
    conventions: [
      "Voltage, current, resistance, and power are magnitudes ≥ 0. Resistance must be > 0.",
      "Displayed values use the selected SI prefix; the solver works in V, A, Ω, and W.",
      "Results are rounded for display (up to four decimal places, en-GB grouping, or scientific notation for |x| ≥ 10⁶ or |x| < 10⁻³). Internal arithmetic is IEEE-754 double.",
    ],
    ranges: [
      "Voltage ≥ 0, current ≥ 0, power ≥ 0, resistance > 0.",
      "Current must be non-zero when solving R from V and I; voltage must be non-zero when solving from P and V.",
    ],
  },
  "three-phase": {
    assumes: [
      "Balanced three-phase sinusoidal quantities with a displacement power factor (cos φ).",
      "Voltage is line-to-line. P = √3 · V_L · I_L · cosφ, S = √3 · V_L · I_L, Q = √3 · V_L · I_L · sinφ with sinφ = √(1 − cos²φ).",
      "You may enter line current, or active power to solve for current.",
    ],
    notFor: [
      "Unbalanced systems, harmonics, or true (wattmeter) power factor versus displacement PF.",
      "Single-phase circuits, motor starting / inrush, or transient currents.",
      "Lag versus lead: Q is reported as a positive magnitude, not a signed reactive flow.",
    ],
    standards: [
      "IEC-style line-to-line formulation; 400 V is a typical IEC 60038 LV default, not a voltage-band check.",
    ],
    conventions: [
      "Power factor is a displacement factor in 0–1, not a percentage and not signed.",
      "Active, reactive, and apparent power share the selected watt / var / VA prefix.",
      "Display rounding matches the other tools (up to four decimal places or scientific notation).",
    ],
    ranges: [
      "Line-to-line voltage > 0, line current ≥ 0, active power ≥ 0.",
      "Power factor must be between 0 and 1. Current cannot be solved from power when PF = 0.",
    ],
  },
  "voltage-drop": {
    assumes: [
      "Simplified IEC-style drop ΔU = k · I · (R cosφ + X sinφ), with k = √3 (three-phase) or 2 (single-phase loop).",
      "Conductor resistance from R = ρ_θ · L / A, with ρ_θ = ρ₂₀ (1 + α (θ − 20 °C)). Copper ρ₂₀ = 0.017241 Ω·mm²/m, α = 0.00393; aluminium ρ₂₀ = 0.028264 Ω·mm²/m, α = 0.00403.",
      "Optional series reactance of one conductor (default 0.08 Ω/km). Set X = 0 to ignore reactance. Constant RMS load current.",
    ],
    notFor: [
      "Current-carrying capacity / ampacity. This is not an AS/NZS 3000 or IEC 60364 rating-table lookup.",
      "Motor starting voltage dip, harmonics, unbalance, parallel cables, armour, or installation-method factors.",
      "DC circuits, or treating the result as a code-compliance voltage-drop limit.",
    ],
    standards: [
      "IEC-style copper/aluminium resistivity coefficients (IEC 60228-type 20 °C values). Not a full IEC 60364 Annex G voltage-drop calculation.",
    ],
    conventions: [
      "Three-phase nominal voltage is line-to-line; single-phase is line-to-neutral with the factor of 2 for the go-and-return loop.",
      "Temperature is conductor temperature, not ambient. Power factor is displacement 0–1.",
      "Percent drop is 100 · ΔU / V_n. Display rounding as for the other tools.",
    ],
    ranges: [
      "Length > 0, load current ≥ 0, cross-section > 0, nominal voltage > 0, reactance ≥ 0.",
      "Power factor 0–1. Conductor temperature between −50 °C and 250 °C.",
    ],
  },
  "protection-curves": {
    assumes: [
      "IEC 60255-151 inverse-time: t = TMS · k / ((I / Iₛ)^α − 1) for Standard, Very, Extremely, and Long-time Inverse (c = 0).",
      "Independent (definite) time uses a constant t> for I ≥ I>. Optional I>> (50) element: if I ≥ I>>, t = t>>.",
      "Fuse overlays are generic IEC 60269-style gG / aM mid-band melting approximations (log–log I/In), not a manufacturer curve.",
      "Currents are primary amperes. No CT ratio, saturation, or composite error is applied. Default grading highlight is 50 ms between successive operating layers.",
    ],
    notFor: [
      "Manufacturer-specific fuse melting or total-clearing data, or ANSI/IEEE C37.112 curves.",
      "Directional, voltage-restrained, differential, thermal, or reset / disk-emulation models.",
      "Replacing a coordination study that needs CT ratio, vendor accuracy bands, or type-tested TCC files.",
    ],
    standards: [
      "IEC 60255-151 (IEC A / B / C / LTI constants k, α).",
      "IEC 60269 fuse classes gG and aM — generic mid-band melting only, not the standard’s gates as a pass/fail test.",
    ],
    conventions: [
      "Times in seconds, currents in primary amperes. I>> must be greater than I> when set.",
      "Fuse curves start at the first tabulated multiple (~1.6× In for gG, ~4× In for aM).",
      "Grading Δt is ordered fastest → slowest at the stated fault level and is highlighted when below 50 ms.",
    ],
    ranges: [
      "I> pickup > 0, TMS > 0 and ≤ 10 (IDMT), t> ≥ 0, fuse In > 0.",
      "I>> > I> when set; t>> ≥ 0 when I>> is set. Fault levels > 0, with minimum ≤ maximum.",
    ],
  },
  "protection-ct-alf": {
    assumes: [
      "Steady RMS dimensioning: effective ALF ALFs = ALFo · (Iₛ² Rct + S) / (Iₛ² Rct + Iₛ² (Rw + Rr)), required ALFr = SF · I_f / CTₚ, pass when ALFs > ALFr.",
      "Copper secondary wiring ρ = 1.72×10⁻⁸ Ω·m. Loop resistance uses twice the one-way length (Rw ∝ 2L).",
      "No remnant flux, no kneepoint / Vk check, no transient dimensioning factor.",
    ],
    notFor: [
      "IEC 61869-2 transient performance (TPX/TPY/TPZ, Ktd, Vk), or replacing a manufacturer ALF / Vk calculation.",
      "Metering CTs (use Metering CT Burden). Capacitive burdens or composite-error certification.",
    ],
    standards: [
      "Accuracy-limit-factor concept from IEC / BS EN 61869-2.",
      "Method aligned with Cahier Technique No. 194 as implemented in the Powersystems UK “Calculate Protection and Metering CTs v1.2” protection-ALF sheet.",
    ],
    conventions: [
      "Wiring length L is one-way; the loop is 2L. Secondary is typically 1 A or 5 A.",
      "“Adequate” means ALFs is strictly greater than ALFr. Display rounding as for the other tools.",
    ],
    ranges: [
      "CT primary, CT secondary, rated burden, rated ALF, and safety factor > 0. Fault current, Rct, relay burden, and length ≥ 0. Wiring CSA > 0.",
      "Rated ALF 1–100, safety factor 0.5–10, wiring cross-section ≤ 1000 mm².",
    ],
  },
  "metering-ct-burden": {
    assumes: [
      "A metering CT is only guaranteed to its accuracy class when the connected circuit burden sits between 25 % and 100 % of rated VA (B).",
      "Three-phase load current I_l = S / (√3 · V · Vpu); secondary Iₛ = I_l / (CTₚ / CTₛ). Circuit burden Btot = Iₛ² (Rw + Rr + Rextra).",
      "Copper wiring ρ = 1.72×10⁻⁸ Ω·m. Wiring length L is the loop length (Rw = ρ L / A), not twice a one-way run.",
    ],
    notFor: [
      "Protection CTs (use Protection CT ALF). Choosing 0.2s vs 0.5 class beyond the 25–100 % burden window.",
      "Temperature correction of leads, or treating the result as a calibration certificate.",
    ],
    standards: [
      "BS EN 61869-2: class accuracy is specified for 25–100 % of rated burden.",
      "Method aligned with the Powersystems UK “Calculate Protection and Metering CTs v1.2” metering-burden sheet.",
    ],
    conventions: [
      "System voltage is line-to-line. Voltage deviation is per-unit (e.g. 0.94), not percent.",
      "Wiring length is the full loop, unlike the protection-CT tool’s one-way × 2 convention.",
      "Status is under (< 25 %), ok (25–100 %), or over (> 100 %) of rated burden.",
    ],
    ranges: [
      "Load capacity, voltage, CT primary, CT secondary, and rated burden > 0. Resistances and length ≥ 0. Wiring CSA > 0.",
      "Voltage deviation 0.5–1.5 p.u. Wiring cross-section ≤ 1000 mm².",
    ],
  },
  "battery-sizing": {
    assumes: [
      "Ampere-hour method: C = (Σ standing I · T + Σ (N · I · t · n) / 3600) · Kage · Kθ · Km, with standing I from amps or P / V.",
      "Result is a 10-hour-equivalent (C10) Ah with ageing, temperature, and design-margin factors only.",
      "Suggested size is the next value on a built-in list of common C10 ratings, not a named manufacturer’s cell.",
    ],
    notFor: [
      "IEEE 485 cell sizing, Peukert / Kt discharge-rate tables, or UPS inverter batteries.",
      "Charger sizing, float voltage, DC cable voltage drop, or AC loads.",
    ],
    standards: [
      "IEC / metric switchgear practice for tripping batteries. IEEE 485 Kt tables are not applied.",
    ],
    conventions: [
      "If both standing current and power are entered, current wins. Peak current = standing + the largest of trip, close, or motor (not all three at once).",
      "Ageing is typically 1.25 (80 % remaining at end of life), design margin typically 1.10, Kθ = 1 at 25 °C.",
      "Switchgear quantity is a positive integer; operation counts are whole numbers ≥ 0. Display rounding as for the other tools.",
    ],
    ranges: [
      "DC voltage > 0, autonomy > 0 and ≤ 720 h, ageing factor 1–3, temperature factor 0.5–2.5, design margin 1–3.",
      "Standing current and power ≥ 0. Trip / close / motor currents and durations ≥ 0. Quantity ≥ 1 (integer).",
    ],
  },
} as const satisfies Record<ToolSlug, ToolAssumptions>;

export type ToolAssumptionsSlug = keyof typeof toolAssumptions;

export function getToolAssumptions(slug: string): ToolAssumptions | undefined {
  if (Object.prototype.hasOwnProperty.call(toolAssumptions, slug)) {
    return toolAssumptions[slug as ToolAssumptionsSlug];
  }
  return undefined;
}
