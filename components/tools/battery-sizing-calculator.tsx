"use client";

import { useCallback, useMemo } from "react";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { useToolChrome } from "@/components/tools/use-tool-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  batterySizingCodec,
  batterySizingDefaults,
  batterySizingExamples,
  type BatteryLoadState,
  type BatterySwitchgearState,
} from "@/config/tool-share";
import {
  BATTERY_SIZING_EQUATION,
  batterySizing,
  type StandingLoad,
  type SwitchgearDuty,
} from "@/lib/calc/battery-sizing";
import type { ToolSnapshot } from "@/lib/copy-results";
import { useShareableState } from "@/lib/use-shareable-state";
import {
  currentUnits,
  formatNumber,
  fromBase,
  parseOptionalNumber,
  powerUnits,
  timeUnits,
  toBase,
  voltageUnits,
  type UnitOption,
} from "@/lib/units";

type LoadForm = BatteryLoadState;
type SwitchgearForm = BatterySwitchgearState;

let nextLoad = 3;
let nextSwitchgear = 2;

function bumpBatteryCounters(loads: LoadForm[], switchgear: SwitchgearForm[]) {
  for (const load of loads) {
    const match = /^load-(\d+)$/.exec(load.id);
    if (match) nextLoad = Math.max(nextLoad, Number(match[1]) + 1);
  }
  for (const item of switchgear) {
    const match = /^swg-(\d+)$/.exec(item.id);
    if (match) nextSwitchgear = Math.max(nextSwitchgear, Number(match[1]) + 1);
  }
}

function unitFactor(units: UnitOption[], unit: string): number {
  return units.find((option) => option.value === unit)?.factor ?? 1;
}

function formatInputNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const precision = abs >= 100 ? 6 : abs >= 1 ? 8 : 10;
  return String(Number(value.toPrecision(precision)));
}

function displayFromBase(base: number, units: UnitOption[], unit: string): string {
  return formatInputNumber(fromBase(base, unitFactor(units, unit)));
}

function editedField(value: string): "power" | "current" {
  return value === "current" ? "current" : "power";
}

function voltageBaseFrom(raw: string, unit: string): number | null {
  const value = parseOptionalNumber(raw);
  if (value === null) return null;
  const base = toBase(value, unitFactor(voltageUnits, unit));
  return base > 0 ? base : null;
}

function syncLoad(
  load: LoadForm,
  voltageV: number,
  edited: "power" | "current",
): LoadForm {
  if (edited === "power") {
    const power = parseOptionalNumber(load.power);
    if (power === null) return { ...load, lastEdited: "power" };
    const powerW = toBase(power, unitFactor(powerUnits, load.powerUnit));
    return {
      ...load,
      lastEdited: "power",
      current: displayFromBase(powerW / voltageV, currentUnits, load.currentUnit),
    };
  }
  const current = parseOptionalNumber(load.current);
  if (current === null) return { ...load, lastEdited: "current" };
  const currentA = toBase(current, unitFactor(currentUnits, load.currentUnit));
  return {
    ...load,
    lastEdited: "current",
    power: displayFromBase(currentA * voltageV, powerUnits, load.powerUnit),
  };
}

function newLoad(
  name: string,
  voltageV: number | null,
  overrides: Partial<LoadForm> = {},
): LoadForm {
  const load: LoadForm = {
    id: `load-${nextLoad++}`,
    name,
    power: "100",
    powerUnit: "W",
    current: "",
    currentUnit: "A",
    lastEdited: "power",
    ...overrides,
  };
  return voltageV === null ? load : syncLoad(load, voltageV, editedField(load.lastEdited));
}

function newSwitchgear(
  name: string,
  overrides: Partial<SwitchgearForm> = {},
): SwitchgearForm {
  return {
    id: `swg-${nextSwitchgear++}`,
    name,
    quantity: "1",
    tripCurrent: "10",
    tripCurrentUnit: "A",
    tripDuration: "0.1",
    tripDurationUnit: "s",
    tripOperations: "2",
    closeCurrent: "20",
    closeCurrentUnit: "A",
    closeDuration: "0.3",
    closeDurationUnit: "s",
    closeOperations: "1",
    motorCurrent: "5",
    motorCurrentUnit: "A",
    motorDuration: "15",
    motorDurationUnit: "s",
    motorOperations: "1",
    ...overrides,
  };
}

function requireNumber(raw: string, label: string): number {
  const value = parseOptionalNumber(raw);
  if (value === null) throw new Error(`${label}: enter a number.`);
  return value;
}

export function BatterySizingCalculator() {
  const [state, setState] = useShareableState(batterySizingDefaults, batterySizingCodec);
  const voltage = state.voltage;
  const voltageUnit = state.voltageUnit;
  const autonomy = state.autonomy;
  const autonomyUnit = state.autonomyUnit;
  const ageing = state.ageing;
  const temperature = state.temperature;
  const margin = state.margin;
  const loads = state.loads;
  const switchgear = state.switchgear;

  const setVoltage = (value: string) => setState((current) => ({ ...current, voltage: value }));
  const setVoltageUnit = (value: string) =>
    setState((current) => ({ ...current, voltageUnit: value }));
  const setAutonomy = (value: string) => setState((current) => ({ ...current, autonomy: value }));
  const setAutonomyUnit = (value: string) =>
    setState((current) => ({ ...current, autonomyUnit: value }));
  const setAgeing = (value: string) => setState((current) => ({ ...current, ageing: value }));
  const setTemperature = (value: string) =>
    setState((current) => ({ ...current, temperature: value }));
  const setMargin = (value: string) => setState((current) => ({ ...current, margin: value }));
  const setLoads = useCallback(
    (action: LoadForm[] | ((current: LoadForm[]) => LoadForm[])) => {
      setState((current) => {
        const loads = typeof action === "function" ? action(current.loads) : action;
        bumpBatteryCounters(loads, current.switchgear);
        return { ...current, loads };
      });
    },
    [setState],
  );
  const setSwitchgear = useCallback(
    (action: SwitchgearForm[] | ((current: SwitchgearForm[]) => SwitchgearForm[])) => {
      setState((current) => {
        const switchgear =
          typeof action === "function" ? action(current.switchgear) : action;
        bumpBatteryCounters(current.loads, switchgear);
        return { ...current, switchgear };
      });
    },
    [setState],
  );

  const parsed = useMemo(() => {
    try {
      const voltageDisplay = requireNumber(voltage, "DC voltage");
      const autonomyDisplay = requireNumber(autonomy, "Autonomy");
      const vf = voltageUnits.find((u) => u.value === voltageUnit)?.factor ?? 1;
      const tf = timeUnits.find((u) => u.value === autonomyUnit)?.factor ?? 1;

      const standingLoads: StandingLoad[] = loads.map((load, index) => {
        const label = load.name.trim() || `Standing load ${index + 1}`;
        const current = parseOptionalNumber(load.current);
        const power = parseOptionalNumber(load.power);
        if (load.lastEdited === "current") {
          if (current === null) throw new Error(`${label}: enter current or power.`);
          return {
            name: label,
            currentA: toBase(current, unitFactor(currentUnits, load.currentUnit)),
          };
        }
        if (power === null) throw new Error(`${label}: enter current or power.`);
        return {
          name: label,
          powerW: toBase(power, unitFactor(powerUnits, load.powerUnit)),
        };
      });

      const duties: SwitchgearDuty[] = switchgear.map((item, index) => {
        const label = item.name.trim() || `Switchgear ${index + 1}`;
        const currentFactor = (unit: string) =>
          currentUnits.find((u) => u.value === unit)?.factor ?? 1;
        const durationFactor = (unit: string) =>
          timeUnits.find((u) => u.value === unit)?.factor ?? 1;
        return {
          name: label,
          quantity: requireNumber(item.quantity, `${label} quantity`),
          tripCurrentA: toBase(
            requireNumber(item.tripCurrent, `${label} trip current`),
            currentFactor(item.tripCurrentUnit),
          ),
          tripDurationS: toBase(
            requireNumber(item.tripDuration, `${label} trip duration`),
            durationFactor(item.tripDurationUnit),
          ),
          tripOperations: requireNumber(item.tripOperations, `${label} trip operations`),
          closeCurrentA: toBase(
            requireNumber(item.closeCurrent, `${label} close current`),
            currentFactor(item.closeCurrentUnit),
          ),
          closeDurationS: toBase(
            requireNumber(item.closeDuration, `${label} close duration`),
            durationFactor(item.closeDurationUnit),
          ),
          closeOperations: requireNumber(item.closeOperations, `${label} close operations`),
          motorCurrentA: toBase(
            requireNumber(item.motorCurrent, `${label} motor current`),
            currentFactor(item.motorCurrentUnit),
          ),
          motorDurationS: toBase(
            requireNumber(item.motorDuration, `${label} motor duration`),
            durationFactor(item.motorDurationUnit),
          ),
          motorOperations: requireNumber(item.motorOperations, `${label} motor operations`),
        };
      });

      const result = batterySizing({
        voltageV: toBase(voltageDisplay, vf),
        autonomyH: toBase(autonomyDisplay, tf) / 3600,
        standingLoads,
        switchgear: duties,
        ageingFactor: requireNumber(ageing, "Ageing factor"),
        temperatureFactor: requireNumber(temperature, "Temperature factor"),
        designMargin: requireNumber(margin, "Design margin"),
      });
      return { ok: true as const, result };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [
    voltage,
    voltageUnit,
    autonomy,
    autonomyUnit,
    ageing,
    temperature,
    margin,
    loads,
    switchgear,
  ]);

  function updateLoad(id: string, patch: Partial<LoadForm>) {
    setLoads((current) =>
      current.map((load) => (load.id === id ? { ...load, ...patch } : load)),
    );
  }

  function retargetLoads(nextVoltage: string, nextUnit: string) {
    const voltageV = voltageBaseFrom(nextVoltage, nextUnit);
    if (voltageV === null) return;
    setLoads((current) =>
      current.map((load) => syncLoad(load, voltageV, editedField(load.lastEdited))),
    );
  }

  function editLoad(
    id: string,
    patch: Partial<LoadForm>,
    edited: "power" | "current",
  ) {
    const voltageV = voltageBaseFrom(voltage, voltageUnit);
    setLoads((current) =>
      current.map((load) => {
        if (load.id !== id) return load;
        const next = { ...load, ...patch, lastEdited: edited };
        return voltageV === null ? next : syncLoad(next, voltageV, edited);
      }),
    );
  }

  function updateSwitchgear(id: string, patch: Partial<SwitchgearForm>) {
    setSwitchgear((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  const snapshot = useMemo<ToolSnapshot>(() => {
    const inputs = [
      { label: "Nominal DC voltage", value: `${voltage} ${voltageUnit}` },
      { label: "Autonomy", value: `${autonomy} ${autonomyUnit}` },
      { label: "Ageing factor", value: ageing },
      { label: "Temperature factor", value: temperature },
      { label: "Design margin", value: margin },
      ...loads.map((load, index) => ({
        label: `Standing load ${index + 1}`,
        value: `${load.name}: ${load.power} ${load.powerUnit} / ${load.current} ${load.currentUnit}`,
      })),
      ...switchgear.map((item, index) => ({
        label: `Switchgear ${index + 1}`,
        value: `${item.name} × ${item.quantity}; trip ${item.tripCurrent} ${item.tripCurrentUnit} × ${item.tripDuration} ${item.tripDurationUnit} × ${item.tripOperations}`,
      })),
    ];
    if (!parsed.ok) return { inputs, outputs: [], error: parsed.message };
    return {
      inputs,
      outputs: [
        { label: "Standing current", value: `${formatNumber(parsed.result.standingCurrentA, 3)} A` },
        { label: "Standing charge", value: `${formatNumber(parsed.result.standingAh, 3)} Ah` },
        { label: "Operations charge", value: `${formatNumber(parsed.result.operationsAh, 4)} Ah` },
        { label: "Uncorrected capacity", value: `${formatNumber(parsed.result.uncorrectedAh, 3)} Ah` },
        { label: "Required capacity", value: `${formatNumber(parsed.result.requiredAh, 3)} Ah` },
        {
          label: "Suggested C10 size",
          value:
            parsed.result.suggestedAh === null
              ? "Above 1000 Ah — specify a larger string"
              : `${parsed.result.suggestedAh} Ah`,
        },
        {
          label: "Peak current",
          value: `${formatNumber(parsed.result.peakCurrentA, 3)} A`,
        },
      ],
    };
  }, [
    voltage,
    voltageUnit,
    autonomy,
    autonomyUnit,
    ageing,
    temperature,
    margin,
    loads,
    switchgear,
    parsed,
  ]);

  useToolChrome({
    state,
    codec: batterySizingCodec,
    examples: batterySizingExamples,
    snapshot,
    applyExample: (example) => {
      bumpBatteryCounters(example.state.loads, example.state.switchgear);
      setState(example.state);
    },
  });

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Size a DC tripping battery from standing loads (amps or watts — the
          other field follows from P = V × I) plus a defined number of open,
          close, and spring-charge operations. Discharge-rate (Kt) tables are
          not applied.
        </p>
        <NumericInput
          id="batt-v"
          label="Nominal DC voltage"
          value={voltage}
          onChange={(value) => {
            setVoltage(value);
            retargetLoads(value, voltageUnit);
          }}
          unit={voltageUnit}
          units={voltageUnits}
          onUnitChange={(unit) => {
            setVoltageUnit(unit);
            retargetLoads(voltage, unit);
          }}
        />
        <NumericInput
          id="batt-t"
          label="Autonomy"
          value={autonomy}
          onChange={setAutonomy}
          unit={autonomyUnit}
          units={timeUnits}
          onUnitChange={setAutonomyUnit}
        />
        <NumericInput
          id="batt-age"
          label="Ageing factor"
          value={ageing}
          onChange={setAgeing}
        />
        <NumericInput
          id="batt-temp"
          label="Temperature factor"
          value={temperature}
          onChange={setTemperature}
        />
        <NumericInput
          id="batt-margin"
          label="Design margin"
          value={margin}
          onChange={setMargin}
        />

        <p className="pt-2 text-sm font-medium">Standing loads</p>
        {loads.map((load, index) => (
          <div
            key={load.id}
            className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${load.id}-name`}>Load {index + 1}</Label>
              {loads.length > 1 || switchgear.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setLoads((current) => current.filter((item) => item.id !== load.id))
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <Input
              id={`${load.id}-name`}
              value={load.name}
              onChange={(event) => updateLoad(load.id, { name: event.target.value })}
              aria-label={`Standing load ${index + 1} name`}
            />
            <div className="grid gap-3">
              <NumericInput
                id={`${load.id}-p`}
                label="Power"
                value={load.power}
                onChange={(value) => editLoad(load.id, { power: value }, "power")}
                unit={load.powerUnit}
                units={powerUnits}
                onUnitChange={(unit) =>
                  editLoad(load.id, { powerUnit: unit }, "power")
                }
              />
              <NumericInput
                id={`${load.id}-i`}
                label="Current"
                value={load.current}
                onChange={(value) => editLoad(load.id, { current: value }, "current")}
                unit={load.currentUnit}
                units={currentUnits}
                onUnitChange={(unit) =>
                  editLoad(load.id, { currentUnit: unit }, "current")
                }
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setLoads((current) => [
              ...current,
              newLoad(
                `Load ${current.length + 1}`,
                voltageBaseFrom(voltage, voltageUnit),
              ),
            ])
          }
        >
          Add standing load
        </Button>

        <p className="pt-2 text-sm font-medium">Switchgear operations</p>
        {switchgear.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${item.id}-name`}>Switchgear {index + 1}</Label>
              {switchgear.length > 1 || loads.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSwitchgear((current) =>
                      current.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <Input
              id={`${item.id}-name`}
              value={item.name}
              onChange={(event) =>
                updateSwitchgear(item.id, { name: event.target.value })
              }
              aria-label={`Switchgear ${index + 1} name`}
            />
            <NumericInput
              id={`${item.id}-qty`}
              label="Quantity"
              value={item.quantity}
              onChange={(value) => updateSwitchgear(item.id, { quantity: value })}
            />
            <div className="grid gap-3">
              <NumericInput
                id={`${item.id}-trip-i`}
                label="Trip current"
                value={item.tripCurrent}
                onChange={(value) => updateSwitchgear(item.id, { tripCurrent: value })}
                unit={item.tripCurrentUnit}
                units={currentUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { tripCurrentUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-trip-t`}
                label="Trip duration"
                value={item.tripDuration}
                onChange={(value) => updateSwitchgear(item.id, { tripDuration: value })}
                unit={item.tripDurationUnit}
                units={timeUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { tripDurationUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-trip-n`}
                label="Trip operations"
                value={item.tripOperations}
                onChange={(value) =>
                  updateSwitchgear(item.id, { tripOperations: value })
                }
              />
            </div>
            <div className="grid gap-3">
              <NumericInput
                id={`${item.id}-close-i`}
                label="Close current"
                value={item.closeCurrent}
                onChange={(value) => updateSwitchgear(item.id, { closeCurrent: value })}
                unit={item.closeCurrentUnit}
                units={currentUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { closeCurrentUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-close-t`}
                label="Close duration"
                value={item.closeDuration}
                onChange={(value) => updateSwitchgear(item.id, { closeDuration: value })}
                unit={item.closeDurationUnit}
                units={timeUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { closeDurationUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-close-n`}
                label="Close operations"
                value={item.closeOperations}
                onChange={(value) =>
                  updateSwitchgear(item.id, { closeOperations: value })
                }
              />
            </div>
            <div className="grid gap-3">
              <NumericInput
                id={`${item.id}-motor-i`}
                label="Motor current"
                value={item.motorCurrent}
                onChange={(value) => updateSwitchgear(item.id, { motorCurrent: value })}
                unit={item.motorCurrentUnit}
                units={currentUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { motorCurrentUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-motor-t`}
                label="Motor duration"
                value={item.motorDuration}
                onChange={(value) => updateSwitchgear(item.id, { motorDuration: value })}
                unit={item.motorDurationUnit}
                units={timeUnits}
                onUnitChange={(unit) =>
                  updateSwitchgear(item.id, { motorDurationUnit: unit })
                }
              />
              <NumericInput
                id={`${item.id}-motor-n`}
                label="Motor operations"
                value={item.motorOperations}
                onChange={(value) =>
                  updateSwitchgear(item.id, { motorOperations: value })
                }
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setSwitchgear((current) => [
              ...current,
              newSwitchgear(`Switchgear ${current.length + 1}`),
            ])
          }
        >
          Add switchgear
        </Button>
      </div>
      <div className="grid gap-4">
        {parsed.ok ? (
          <>
            <ResultCard equation={parsed.result.equation}>
              <ResultRow
                label="Standing current"
                value={`${formatNumber(parsed.result.standingCurrentA, 3)} A`}
              />
              <ResultRow
                label="Standing charge"
                value={`${formatNumber(parsed.result.standingAh, 3)} Ah`}
              />
              <ResultRow
                label="Operations charge"
                value={`${formatNumber(parsed.result.operationsAh, 4)} Ah`}
              />
              <ResultRow
                label="Uncorrected capacity"
                value={`${formatNumber(parsed.result.uncorrectedAh, 3)} Ah`}
              />
              <ResultRow
                label="Required capacity"
                value={`${formatNumber(parsed.result.requiredAh, 3)} Ah`}
              />
              <ResultRow
                label="Suggested C10 size"
                value={
                  parsed.result.suggestedAh === null
                    ? "Above 1000 Ah — specify a larger string"
                    : `${parsed.result.suggestedAh} Ah`
                }
              />
              <ResultRow
                label="Peak current (standing + largest simultaneous duty)"
                value={`${formatNumber(parsed.result.peakCurrentA, 3)} A`}
              />
            </ResultCard>
            {parsed.result.standingLoads.length > 0 ? (
              <ResultCard equation="P = V × I" title="Standing loads">
                {parsed.result.standingLoads.map((load) => (
                  <ResultRow
                    key={load.name}
                    label={load.name}
                    value={`${formatNumber(load.currentA, 3)} A · ${formatNumber(load.powerW, 3)} W`}
                  />
                ))}
              </ResultCard>
            ) : null}
            {parsed.result.switchgear.length > 0 ? (
              <ResultCard
                equation="Ah = N · (I_trip·t·n + I_close·t·n + I_m·t·n) / 3600"
                title="Switchgear charge"
              >
                {parsed.result.switchgear.map((duty) => (
                  <ResultRow
                    key={duty.name}
                    label={`${duty.name} × ${duty.quantity}`}
                    value={`${formatNumber(duty.chargeAh, 4)} Ah`}
                  />
                ))}
              </ResultCard>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Ageing 1.25 is 80 % remaining capacity; temperature factor 1.0 is
              25 °C. Peak current assumes every listed device of the heaviest
              duty (trip, close, or motor) operates together with the standing
              load. Confirm coil currents and charger rating against the
              switchgear data sheet.
            </p>
          </>
        ) : (
          <ResultCard equation={BATTERY_SIZING_EQUATION}>
            <p className="text-sm text-destructive">{parsed.message}</p>
          </ResultCard>
        )}
      </div>
    </div>
  );
}
