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
  IEC_CURVES,
  overlayCurves,
  operatingTimeS,
  suggestedCurrentMaxA,
  type IecCurveId,
  type ProtectionDevice,
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

const STROKES = ["#1d4ed8", "#b45309", "#15803d", "#be123c", "#6d28d9", "#0f766e"];

type DeviceForm = {
  id: string;
  name: string;
  characteristic: IecCurveId;
  pickup: string;
  pickupUnit: string;
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
    characteristic: "iec-si",
    pickup: "100",
    pickupUnit: "A",
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

export function ProtectionCurvesCalculator() {
  const [devices, setDevices] = useState<DeviceForm[]>([
    {
      id: "device-1",
      name: "Feeder",
      characteristic: "iec-si",
      pickup: "100",
      pickupUnit: "A",
      tms: "0.15",
      definiteTime: "0.4",
      instPickup: "800",
      instPickupUnit: "A",
      instTime: "0.05",
    },
    {
      id: "device-2",
      name: "Incomer",
      characteristic: "iec-si",
      pickup: "250",
      pickupUnit: "A",
      tms: "0.35",
      definiteTime: "1",
      instPickup: "2000",
      instPickupUnit: "A",
      instTime: "0.10",
    },
  ]);
  const [fault, setFault] = useState("1500");
  const [faultUnit, setFaultUnit] = useState("A");

  const iff = currentUnits.find((u) => u.value === faultUnit)?.factor ?? 1;

  const parsed = useMemo(() => {
    const models: ProtectionDevice[] = [];
    for (const form of devices) {
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

    const faultA = parseOptionalNumber(fault);
    if (faultA === null) {
      return { ok: false as const, message: "Enter a fault current I to evaluate operating times." };
    }
    const faultBase = toBase(faultA, iff);
    const currentMaxA = suggestedCurrentMaxA(models, faultBase);

    try {
      const curves = overlayCurves(models, currentMaxA);
      const trips = models.map((device) => {
        try {
          return {
            id: device.id,
            name: device.name,
            ok: true as const,
            timeS: operatingTimeS(device, faultBase),
          };
        } catch (error) {
          return {
            id: device.id,
            name: device.name,
            ok: false as const,
            message: error instanceof Error ? error.message : "No trip",
          };
        }
      });
      return { ok: true as const, curves, trips, faultBase, currentMaxA };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Invalid settings",
      };
    }
  }, [devices, fault, iff]);

  function updateDevice(id: string, patch: Partial<DeviceForm>) {
    setDevices((current) =>
      current.map((device) => (device.id === id ? { ...device, ...patch } : device)),
    );
  }

  const allTimes = parsed.ok
    ? parsed.curves.flatMap((curve) => curve.points.map((p) => p.timeS))
    : [];
  const allCurrents = parsed.ok
    ? parsed.curves.flatMap((curve) => curve.points.map((p) => p.currentA))
    : [];
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
          IEC 60255-151 IDMT: t = TMS · k / ((I/Iₛ)^α − 1). Overlay several 51
          elements and optional 50 (I&gt;&gt;) settings. Leave I&gt;&gt; blank to
          omit the instantaneous element.
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
              <Label>Characteristic</Label>
              <Select
                value={device.characteristic}
                items={CURVE_LABELS}
                onValueChange={(value) =>
                  value && updateDevice(device.id, { characteristic: value as IecCurveId })
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
          </div>
        ))}
        {devices.length < 6 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDevices((current) => [...current, newDevice(`Device ${current.length + 1}`)])
            }
          >
            Add device
          </Button>
        ) : null}
        <NumericInput
          id="fault-i"
          label="Fault current I"
          value={fault}
          onChange={setFault}
          unit={faultUnit}
          units={currentUnits}
          onUnitChange={setFaultUnit}
        />
      </div>
      <div className="grid gap-4">
        {parsed.ok ? (
          <>
            <ResultCard equation="t = TMS · k / ((I/Iₛ)^α − 1)  [IEC 60255-151]">
              {parsed.trips.map((trip) => (
                <ResultRow
                  key={trip.id}
                  label={`${trip.name} operating time`}
                  value={
                    trip.ok ? `${formatNumber(trip.timeS, 3)} s` : trip.message
                  }
                />
              ))}
            </ResultCard>
            <div className="h-[28rem] rounded-xl bg-card p-3 ring-1 ring-foreground/10 print:break-inside-avoid">
              <p className="mb-2 text-sm font-medium">Time–current characteristic</p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="currentA"
                    scale="log"
                    domain={xDomain}
                    ticks={xDomain ? logTicks(xDomain[0], xDomain[1]) : undefined}
                    tickFormatter={(value: number) => formatNumber(value, 2)}
                    label={{ value: "I (A)", position: "insideBottom", offset: -4 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="timeS"
                    scale="log"
                    domain={yDomain}
                    ticks={yDomain ? logTicks(yDomain[0], yDomain[1]) : undefined}
                    tickFormatter={(value: number) => formatNumber(value, 2)}
                    label={{ value: "t (s)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatNumber(Number(value), 3)} s`, "t"]}
                    labelFormatter={(label) => `${formatNumber(Number(label), 2)} A`}
                  />
                  <Legend />
                  {parsed.curves.map((curve, index) => (
                    <Line
                      key={curve.id}
                      data={curve.points}
                      type="monotone"
                      dataKey="timeS"
                      name={`${curve.name} (${curve.code})`}
                      stroke={STROKES[index % STROKES.length]}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Vendor accuracy bands, CT ratio, and reset/disk-emulation curves are
              not included. Confirm k and α against the relay manual if it
              publishes a variant of IEC A/B/C.
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
