"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NumericInput } from "@/components/calculators/numeric-input";
import { ResultCard, ResultRow } from "@/components/calculators/result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FUSE_CLASSES,
  GRADING_MARGIN_S,
  IEC_CURVES,
  deviceTripsAt,
  gradingMargins,
  overlayChartRows,
  overlayCurves,
  suggestedCurrentMaxA,
  type FuseClassId,
  type IecCurveId,
  type ProtectionDevice,
  type TripResult,
} from "@/lib/calc/protection-curves";
import {
  currentUnits,
  formatNumber,
  parseOptionalNumber,
  toBase,
} from "@/lib/units";

const CURVE_LABELS: Record<IecCurveId, string> = {
  "iec-si": "IEC A — Standard Inverse (SI)",
  "iec-vi": "IEC B — Very Inverse (VI)",
  "iec-ei": "IEC C — Extremely Inverse (EI)",
  "iec-lti": "IEC LTI — Long-time Inverse",
  "definite-time": "Independent time (definite time)",
};

const FUSE_LABELS: Record<FuseClassId, string> = {
  gg: "gG — general purpose",
  am: "aM — motor circuit (partial range)",
};

const KIND_LABELS = {
  relay: "Relay (IDMT / DT)",
  fuse: "Fuse (generic)",
} as const;

const STROKES = ["#1d4ed8", "#b45309", "#15803d", "#be123c", "#6d28d9", "#0f766e"];

type DeviceKind = "relay" | "fuse";

type DeviceForm = {
  id: string;
  name: string;
  kind: DeviceKind;
  characteristic: IecCurveId;
  fuseClass: FuseClassId;
  pickup: string;
  pickupUnit: string;
  ratedCurrent: string;
  ratedUnit: string;
  tms: string;
  definiteTime: string;
  instPickup: string;
  instPickupUnit: string;
  instTime: string;
};

let nextDevice = 3;

function newDevice(name: string, overrides: Partial<DeviceForm> = {}): DeviceForm {
  return {
    id: `device-${nextDevice++}`,
    name,
    kind: "relay",
    characteristic: "iec-si",
    fuseClass: "gg",
    pickup: "100",
    pickupUnit: "A",
    ratedCurrent: "100",
    ratedUnit: "A",
    tms: "0.15",
    definiteTime: "0.4",
    instPickup: "",
    instPickupUnit: "A",
    instTime: "0.05",
    ...overrides,
  };
}

function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const startExp = Math.floor(Math.log10(min));
  const endExp = Math.ceil(Math.log10(max));
  for (let exp = startExp; exp <= endExp; exp += 1) {
    for (const mantissa of [1, 2, 5]) {
      const value = mantissa * 10 ** exp;
      if (value >= min && value <= max) ticks.push(value);
    }
  }
  return ticks;
}

function formatTimeS(timeS: number): string {
  if (timeS < 0.1) return `${formatNumber(timeS * 1000, 1)} ms`;
  return `${formatNumber(timeS, 3)} s`;
}

function FaultLevelResults({
  title,
  faultA,
  trips,
}: {
  title: string;
  faultA: number;
  trips: TripResult[];
}) {
  const margins = gradingMargins(trips);
  const marginByFasterId = new Map(margins.map((margin) => [margin.fasterId, margin]));
  const ordered = trips
    .filter((trip): trip is Extract<TripResult, { ok: true }> => trip.ok)
    .slice()
    .sort((a, b) => a.timeS - b.timeS || a.name.localeCompare(b.name));
  const nonOperating = trips.filter((trip) => !trip.ok);

  return (
    <div className="grid gap-1.5 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <p className="text-sm font-medium">
        {title}{" "}
        <span className="font-mono text-muted-foreground">
          ({formatNumber(faultA, 2)} A)
        </span>
      </p>
      {ordered.map((trip) => {
        const margin = marginByFasterId.get(trip.id);
        return (
          <div key={trip.id} className="grid gap-1.5">
            <ResultRow
              label={`${trip.name} operating time`}
              value={formatTimeS(trip.timeS)}
            />
            {margin ? (
              <ResultRow
                label={`Δ ${margin.fasterName} → ${margin.slowerName}`}
                value={formatTimeS(margin.deltaS)}
                labelClassName={
                  margin.belowMargin ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }
                valueClassName={
                  margin.belowMargin
                    ? "font-mono font-medium tabular-nums text-red-600 dark:text-red-400"
                    : "font-mono font-medium tabular-nums"
                }
              />
            ) : null}
          </div>
        );
      })}
      {nonOperating.map((trip) => (
        <ResultRow
          key={trip.id}
          label={`${trip.name} operating time`}
          value={trip.ok ? "" : trip.message}
        />
      ))}
      {ordered.length < 2 ? (
        <p className="text-xs text-muted-foreground">
          Need at least two devices operating at this fault level to show grading
          margins (highlight &lt; {formatNumber(GRADING_MARGIN_S * 1000, 0)} ms).
        </p>
      ) : null}
    </div>
  );
}

export function ProtectionCurvesCalculator() {
  const [devices, setDevices] = useState<DeviceForm[]>([
    {
      id: "device-1",
      name: "Feeder",
      kind: "relay",
      characteristic: "iec-si",
      fuseClass: "gg",
      pickup: "100",
      pickupUnit: "A",
      ratedCurrent: "100",
      ratedUnit: "A",
      tms: "0.15",
      definiteTime: "0.4",
      instPickup: "800",
      instPickupUnit: "A",
      instTime: "0.05",
    },
    {
      id: "device-2",
      name: "Incomer",
      kind: "relay",
      characteristic: "iec-si",
      fuseClass: "gg",
      pickup: "250",
      pickupUnit: "A",
      ratedCurrent: "250",
      ratedUnit: "A",
      tms: "0.35",
      definiteTime: "1",
      instPickup: "2000",
      instPickupUnit: "A",
      instTime: "0.10",
    },
  ]);
  const [minFault, setMinFault] = useState("800");
  const [minFaultUnit, setMinFaultUnit] = useState("A");
  const [maxFault, setMaxFault] = useState("1500");
  const [maxFaultUnit, setMaxFaultUnit] = useState("A");

  const minFf = currentUnits.find((u) => u.value === minFaultUnit)?.factor ?? 1;
  const maxFf = currentUnits.find((u) => u.value === maxFaultUnit)?.factor ?? 1;

  const parsed = useMemo(() => {
    const models: ProtectionDevice[] = [];
    for (const form of devices) {
      if (form.kind === "fuse") {
        const rated = parseOptionalNumber(form.ratedCurrent);
        const rf = currentUnits.find((u) => u.value === form.ratedUnit)?.factor ?? 1;
        if (rated === null) {
          return { ok: false as const, message: `${form.name}: enter fuse rated current In.` };
        }
        models.push({
          kind: "fuse",
          id: form.id,
          name: form.name.trim() || "Fuse",
          fuseClass: form.fuseClass,
          ratedCurrentA: toBase(rated, rf),
        });
        continue;
      }

      const pickup = parseOptionalNumber(form.pickup);
      const tms = parseOptionalNumber(form.tms);
      const definiteTimeS = parseOptionalNumber(form.definiteTime);
      const instPickup = parseOptionalNumber(form.instPickup);
      const instTime = parseOptionalNumber(form.instTime);
      const pf = currentUnits.find((u) => u.value === form.pickupUnit)?.factor ?? 1;
      const inf = currentUnits.find((u) => u.value === form.instPickupUnit)?.factor ?? 1;
      if (pickup === null) {
        return { ok: false as const, message: `${form.name}: enter I> pickup.` };
      }
      if (form.characteristic !== "definite-time" && tms === null) {
        return { ok: false as const, message: `${form.name}: enter TMS.` };
      }
      if (form.characteristic === "definite-time" && definiteTimeS === null) {
        return { ok: false as const, message: `${form.name}: enter t>.` };
      }
      if (form.instPickup.trim() !== "" && instPickup === null) {
        return { ok: false as const, message: `${form.name}: I>> must be a number, or leave blank.` };
      }
      if (instPickup !== null && instTime === null) {
        return { ok: false as const, message: `${form.name}: enter t>> when I>> is set.` };
      }
      models.push({
        kind: "relay",
        id: form.id,
        name: form.name.trim() || "Device",
        characteristic: form.characteristic,
        pickupA: toBase(pickup, pf),
        tms: tms ?? 1,
        definiteTimeS: definiteTimeS ?? 0,
        instantaneousPickupA: instPickup === null ? null : toBase(instPickup, inf),
        instantaneousTimeS: instPickup === null ? null : instTime,
      });
    }

    const minFaultA = parseOptionalNumber(minFault);
    const maxFaultA = parseOptionalNumber(maxFault);
    if (minFaultA === null) {
      return { ok: false as const, message: "Enter a Minimum Fault Level." };
    }
    if (maxFaultA === null) {
      return { ok: false as const, message: "Enter a Maximum Fault Level." };
    }
    const minFaultBase = toBase(minFaultA, minFf);
    const maxFaultBase = toBase(maxFaultA, maxFf);
    if (!(minFaultBase > 0) || !(maxFaultBase > 0)) {
      return { ok: false as const, message: "Fault levels must be greater than zero." };
    }
    if (minFaultBase > maxFaultBase) {
      return {
        ok: false as const,
        message: "Minimum Fault Level must be less than or equal to Maximum Fault Level.",
      };
    }

    const currentMaxA = suggestedCurrentMaxA(models, [minFaultBase, maxFaultBase]);

    try {
      const curves = overlayCurves(models, currentMaxA);
      const chartRows = overlayChartRows(models, currentMaxA);
      return {
        ok: true as const,
        curves,
        chartRows,
        minFaultBase,
        maxFaultBase,
        currentMaxA,
        minTrips: deviceTripsAt(models, minFaultBase),
        maxTrips: deviceTripsAt(models, maxFaultBase),
        hasFuse: models.some((device) => device.kind === "fuse"),
      };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid settings",
      };
    }
  }, [devices, minFault, maxFault, minFf, maxFf]);

  function updateDevice(id: string, patch: Partial<DeviceForm>) {
    setDevices((current) =>
      current.map((device) => (device.id === id ? { ...device, ...patch } : device)),
    );
  }

  const allTimes = parsed.ok
    ? parsed.chartRows.flatMap((row) =>
        parsed.curves
          .map((curve) => row[curve.id])
          .filter((time): time is number => typeof time === "number"),
      )
    : [];
  const allCurrents = parsed.ok ? parsed.chartRows.map((row) => row.currentA) : [];
  const xDomain: [number, number] | undefined =
    allCurrents.length > 0
      ? [Math.max(1, Math.min(...allCurrents) * 0.7), Math.max(...allCurrents) * 1.15]
      : undefined;
  const yDomain: [number, number] | undefined =
    allTimes.length > 0
      ? [Math.max(0.01, Math.min(...allTimes) * 0.7), Math.min(1000, Math.max(...allTimes) * 1.4)]
      : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          IEC 60255-151 IDMT: t = TMS · k / ((I/Iₛ)^α − 1). Overlay relays and
          optional generic fuses, then compare operating times at Minimum and
          Maximum Fault Level. Leave I&gt;&gt; blank to omit the instantaneous
          element on relays.
        </p>
        {devices.map((device, index) => (
          <div
            key={device.id}
            className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${device.id}-name`}>Device {index + 1}</Label>
              {devices.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDevices((current) => current.filter((item) => item.id !== device.id))
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <Input
              id={`${device.id}-name`}
              value={device.name}
              onChange={(event) => updateDevice(device.id, { name: event.target.value })}
              aria-label={`Device ${index + 1} name`}
            />
            <div className="grid gap-1.5">
              <Label>Device type</Label>
              <Select
                value={device.kind}
                items={KIND_LABELS}
                onValueChange={(value) =>
                  value && updateDevice(device.id, { kind: value as DeviceKind })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relay">{KIND_LABELS.relay}</SelectItem>
                  <SelectItem value="fuse">{KIND_LABELS.fuse}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {device.kind === "fuse" ? (
              <>
                <div className="grid gap-1.5">
                  <Label>Fuse class</Label>
                  <Select
                    value={device.fuseClass}
                    items={FUSE_LABELS}
                    onValueChange={(value) =>
                      value && updateDevice(device.id, { fuseClass: value as FuseClassId })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUSE_CLASSES.map((fuseClass) => (
                        <SelectItem key={fuseClass.id} value={fuseClass.id}>
                          {FUSE_LABELS[fuseClass.id]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <NumericInput
                  id={`${device.id}-rated`}
                  label="Rated current In"
                  value={device.ratedCurrent}
                  onChange={(value) => updateDevice(device.id, { ratedCurrent: value })}
                  unit={device.ratedUnit}
                  units={currentUnits}
                  onUnitChange={(unit) => updateDevice(device.id, { ratedUnit: unit })}
                />
                <p className="text-xs text-muted-foreground">
                  Generic mid-band melting curve only. Check against the
                  manufacturer-specific fuse melting and total-clearing data before
                  relying on coordination margins.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label>Characteristic</Label>
                  <Select
                    value={device.characteristic}
                    items={CURVE_LABELS}
                    onValueChange={(value) =>
                      value &&
                      updateDevice(device.id, { characteristic: value as IecCurveId })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IEC_CURVES.map((curve) => (
                        <SelectItem key={curve.id} value={curve.id}>
                          {CURVE_LABELS[curve.id]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <NumericInput
                  id={`${device.id}-pickup`}
                  label="I> pickup (Iₛ)"
                  value={device.pickup}
                  onChange={(value) => updateDevice(device.id, { pickup: value })}
                  unit={device.pickupUnit}
                  units={currentUnits}
                  onUnitChange={(unit) => updateDevice(device.id, { pickupUnit: unit })}
                />
                {device.characteristic === "definite-time" ? (
                  <NumericInput
                    id={`${device.id}-dt`}
                    label="t> operating time"
                    value={device.definiteTime}
                    onChange={(value) => updateDevice(device.id, { definiteTime: value })}
                    unit="s"
                  />
                ) : (
                  <NumericInput
                    id={`${device.id}-tms`}
                    label="TMS (time multiplier)"
                    value={device.tms}
                    onChange={(value) => updateDevice(device.id, { tms: value })}
                  />
                )}
                <NumericInput
                  id={`${device.id}-inst`}
                  label="I>> instantaneous pickup"
                  value={device.instPickup}
                  onChange={(value) => updateDevice(device.id, { instPickup: value })}
                  unit={device.instPickupUnit}
                  units={currentUnits}
                  onUnitChange={(unit) => updateDevice(device.id, { instPickupUnit: unit })}
                  placeholder="omit"
                />
                {device.instPickup.trim() !== "" ? (
                  <NumericInput
                    id={`${device.id}-inst-t`}
                    label="t>> instantaneous delay"
                    value={device.instTime}
                    onChange={(value) => updateDevice(device.id, { instTime: value })}
                    unit="s"
                  />
                ) : null}
              </>
            )}
          </div>
        ))}
        {devices.length < 6 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDevices((current) => [
                  ...current,
                  newDevice(`Device ${current.length + 1}`),
                ])
              }
            >
              Add relay
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDevices((current) => [
                  ...current,
                  newDevice(`Fuse ${current.length + 1}`, {
                    kind: "fuse",
                    fuseClass: "gg",
                    ratedCurrent: "100",
                  }),
                ])
              }
            >
              Add fuse
            </Button>
          </div>
        ) : null}
        <NumericInput
          id="min-fault-i"
          label="Minimum Fault Level"
          value={minFault}
          onChange={setMinFault}
          unit={minFaultUnit}
          units={currentUnits}
          onUnitChange={setMinFaultUnit}
        />
        <NumericInput
          id="max-fault-i"
          label="Maximum Fault Level"
          value={maxFault}
          onChange={setMaxFault}
          unit={maxFaultUnit}
          units={currentUnits}
          onUnitChange={setMaxFaultUnit}
        />
      </div>
      <div className="grid gap-4">
        {parsed.ok ? (
          <>
            <ResultCard equation="t = TMS · k / ((I/Iₛ)^α − 1)  [IEC 60255-151]; generic fuse melting mid-band">
              <FaultLevelResults
                title="Minimum Fault Level"
                faultA={parsed.minFaultBase}
                trips={parsed.minTrips}
              />
              <FaultLevelResults
                title="Maximum Fault Level"
                faultA={parsed.maxFaultBase}
                trips={parsed.maxTrips}
              />
            </ResultCard>
            <div className="h-[28rem] rounded-xl bg-card p-3 ring-1 ring-foreground/10 print:break-inside-avoid">
              <p className="mb-2 text-sm font-medium">Time–current characteristic</p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={parsed.chartRows}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="currentA"
                    scale="log"
                    domain={xDomain}
                    ticks={xDomain ? logTicks(xDomain[0], xDomain[1]) : undefined}
                    tickFormatter={(value: number) => formatNumber(value, 2)}
                    allowDuplicatedCategory={false}
                    label={{ value: "I (A)", position: "insideBottom", offset: -4 }}
                  />
                  <YAxis
                    type="number"
                    scale="log"
                    domain={yDomain}
                    ticks={yDomain ? logTicks(yDomain[0], yDomain[1]) : undefined}
                    tickFormatter={(value: number) => formatNumber(value, 2)}
                    label={{ value: "t (s)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    shared
                    labelFormatter={(label) => `${formatNumber(Number(label), 2)} A`}
                    formatter={(value, name) => [
                      `${formatNumber(Number(value), 3)} s`,
                      String(name),
                    ]}
                  />
                  <Legend />
                  {parsed.curves.map((curve, index) => (
                    <Line
                      key={curve.id}
                      type="linear"
                      dataKey={curve.id}
                      name={`${curve.name} (${curve.code})`}
                      stroke={STROKES[index % STROKES.length]}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Grading Δt between successive operating layers is highlighted in red
              when below {formatNumber(GRADING_MARGIN_S * 1000, 0)} ms. Vendor
              accuracy bands, CT ratio, and reset/disk-emulation curves are not
              included. Confirm k and α against the relay manual if it publishes a
              variant of IEC A/B/C.
              {parsed.hasFuse
                ? " Generic fuse curves are near-enough mid-band melting approximations only — always check manufacturer-specific fuse data (melting and total clearing) before using the results for coordination."
                : null}
            </p>
          </>
        ) : (
          <ResultCard equation="t = TMS · k / ((I/Iₛ)^α − 1)">
            <p className="text-sm text-destructive">{parsed.message}</p>
          </ResultCard>
        )}
      </div>
    </div>
  );
}
