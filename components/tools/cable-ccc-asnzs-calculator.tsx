"use client";

import { useCallback, useMemo } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { useToolChrome } from "@/components/tools/use-tool-chrome";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cableCccCodec, cableCccDefaults, cableCccExamples } from "@/config/tool-share";
import {
  ARRANGEMENT_LABELS,
  INSULATION_LABELS,
  INSTALLATION_LABELS,
  LOOKUP_EQUATION_PLACEHOLDER,
  MATERIAL_LABELS,
  lookupCableCcc,
  shippedCableCccDataset,
  uniqueOptions,
  type CableCccArrangement,
  type CableCccInstallation,
  type CableCccInsulation,
  type CableCccMaterial,
} from "@/lib/calc/asnzs-cable-ccc";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import { areaUnits, formatNumber, parseOptionalNumber } from "@/lib/units";

function recordFrom<T extends string>(values: readonly T[], labels: Record<T, string>): Record<T, string> {
  return Object.fromEntries(values.map((value) => [value, labels[value]])) as Record<T, string>;
}

export function CableCccAsnzsCalculator() {
  const [state, setState] = useShareableState(cableCccDefaults, cableCccCodec);
  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((current) => ({ ...current, [key]: value }));
    },
    [setState],
  );

  const materials = uniqueOptions<CableCccMaterial>(shippedCableCccDataset.paths, "material");
  const insulations = uniqueOptions<CableCccInsulation>(shippedCableCccDataset.paths, "insulation");
  const arrangements = uniqueOptions<CableCccArrangement>(
    shippedCableCccDataset.paths,
    "arrangement",
  );
  const installations = uniqueOptions<CableCccInstallation>(
    shippedCableCccDataset.paths,
    "installation",
  );

  const parsed = useMemo(() => {
    const sizeMm2 = parseOptionalNumber(state.section);
    if (sizeMm2 === null) {
      return { ok: false as const, message: "Enter a conductor cross-section in mm²." };
    }
    try {
      return {
        ok: true as const,
        value: lookupCableCcc(
          {
            material: state.material as CableCccMaterial,
            insulation: state.insulation as CableCccInsulation,
            arrangement: state.arrangement as CableCccArrangement,
            installation: state.installation as CableCccInstallation,
            sizeMm2,
          },
          shippedCableCccDataset,
        ),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [state.material, state.insulation, state.arrangement, state.installation, state.section]);

  const snapshot: ToolSnapshot = (() => {
    const inputs = [
      { label: "Conductor", value: MATERIAL_LABELS[state.material as CableCccMaterial] ?? state.material },
      { label: "Insulation", value: INSULATION_LABELS[state.insulation as CableCccInsulation] ?? state.insulation },
      {
        label: "Arrangement",
        value: ARRANGEMENT_LABELS[state.arrangement as CableCccArrangement] ?? state.arrangement,
      },
      {
        label: "Installation",
        value: INSTALLATION_LABELS[state.installation as CableCccInstallation] ?? state.installation,
      },
      { label: "Conductor cross-section", value: `${state.section} mm²` },
    ];
    if (!parsed.ok) return { inputs, outputs: [], error: parsed.message };
    return {
      inputs,
      outputs: [
        { label: "Current-carrying capacity I_z", value: `${formatNumber(parsed.value.currentA)} A` },
        { label: "Citation", value: parsed.value.citation },
        { label: "Path", value: parsed.value.pathLabel },
        { label: "Conditions", value: parsed.value.conditions },
        { label: "Correction factors", value: "None applied (base tabulated CCC only)" },
      ],
    };
  })();

  useToolChrome({
    state,
    codec: cableCccCodec,
    examples: cableCccExamples,
    snapshot,
    applyExample: (example) => setState(example.state),
  });

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Lookup of tabulated current-carrying capacity from a licensed{" "}
          <span className="font-medium text-foreground">AS/NZS 3008.1.1:{shippedCableCccDataset.edition}</span>{" "}
          dataset. AS/NZS 3000 requires cables to be selected for the installation; the CCC tables
          themselves live in AS/NZS 3008, not in the Wiring Rules. Unknown combinations fail closed.
          Correction factors are not applied in this MVP.
        </p>
        <div className="grid gap-1.5">
          <Label>Conductor</Label>
          <Select
            value={state.material}
            items={recordFrom(materials, MATERIAL_LABELS)}
            onValueChange={(value) => value && setField("material", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material} value={material}>
                  {MATERIAL_LABELS[material]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Insulation family</Label>
          <Select
            value={state.insulation}
            items={recordFrom(insulations, INSULATION_LABELS)}
            onValueChange={(value) => value && setField("insulation", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {insulations.map((insulation) => (
                <SelectItem key={insulation} value={insulation}>
                  {INSULATION_LABELS[insulation]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {arrangements.length > 1 ? (
          <div className="grid gap-1.5">
            <Label>Arrangement</Label>
            <Select
              value={state.arrangement}
              items={recordFrom(arrangements, ARRANGEMENT_LABELS)}
              onValueChange={(value) => value && setField("arrangement", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {arrangements.map((arrangement) => (
                  <SelectItem key={arrangement} value={arrangement}>
                    {ARRANGEMENT_LABELS[arrangement]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrangement: {ARRANGEMENT_LABELS[arrangements[0] ?? "multicore"]} (only loaded path family)
          </p>
        )}
        <div className="grid gap-1.5">
          <Label>Installation method</Label>
          <Select
            value={state.installation}
            items={recordFrom(installations, INSTALLATION_LABELS)}
            onValueChange={(value) => value && setField("installation", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {installations.map((installation) => (
                <SelectItem key={installation} value={installation}>
                  {INSTALLATION_LABELS[installation]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumericInput
          id="ccc-a"
          label="Conductor cross-section"
          value={state.section}
          onChange={(value) => setField("section", value)}
          unit="mm²"
          units={areaUnits}
          onUnitChange={() => undefined}
        />
      </div>
      {parsed.ok ? (
        <ResultCard equation={parsed.value.equation}>
          <ResultRow
            label="Current-carrying capacity I_z"
            value={`${formatNumber(parsed.value.currentA)} A`}
          />
          <ResultRow label="Citation" value={parsed.value.citation} />
          <ResultRow label="Table" value={parsed.value.tableId} />
          <ResultRow label="Column" value={parsed.value.columnId} />
          <ResultRow label="Path" value={parsed.value.pathLabel} />
          <ResultRow label="Conditions" value={parsed.value.conditions} />
          <ResultRow label="Correction factors" value="None applied" />
        </ResultCard>
      ) : (
        <ResultCard equation={LOOKUP_EQUATION_PLACEHOLDER}>
          <p className="text-sm text-destructive">{parsed.message}</p>
        </ResultCard>
      )}
    </div>
  );
}
