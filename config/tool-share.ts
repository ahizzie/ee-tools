import type { ToolSlug } from "@/config/tools";
import {
  createCompositeCodec,
  createFlatCodec,
  type ShareCodec,
} from "@/lib/share-url";
import {
  currentUnits,
  lengthUnits,
  powerUnits,
  resistanceUnits,
  timeUnits,
  voltageUnits,
  apparentPowerUnits,
} from "@/lib/units";

const voltageUnitValues = voltageUnits.map((unit) => unit.value);
const currentUnitValues = currentUnits.map((unit) => unit.value);
const powerUnitValues = powerUnits.map((unit) => unit.value);
const apparentPowerUnitValues = apparentPowerUnits.map((unit) => unit.value);
const lengthUnitValues = lengthUnits.map((unit) => unit.value);
const resistanceUnitValues = resistanceUnits.map((unit) => unit.value);
const timeUnitValues = timeUnits.map((unit) => unit.value);

export type ToolExample<T> = {
  id: string;
  label: string;
  state: T;
};

export type AmpsKwState = {
  mode: string;
  voltage: string;
  voltageUnit: string;
  current: string;
  currentUnit: string;
  powerKw: string;
  pf: string;
};

export const ampsKwDefaults: AmpsKwState = {
  mode: "amps-to-kw",
  voltage: "400",
  voltageUnit: "V",
  current: "10",
  currentUnit: "A",
  powerKw: "5.543",
  pf: "0.8",
};

export const ampsKwCodec: ShareCodec<AmpsKwState> = createFlatCodec({
  defaults: ampsKwDefaults,
  keys: {
    mode: "m",
    voltage: "v",
    voltageUnit: "vu",
    current: "i",
    currentUnit: "iu",
    powerKw: "p",
    pf: "pf",
  },
  enums: {
    mode: ["amps-to-kw", "kw-to-amps"],
    voltageUnit: voltageUnitValues,
    currentUnit: currentUnitValues,
  },
});

export const ampsKwExamples: ToolExample<AmpsKwState>[] = [
  {
    id: "amps-to-kw",
    label: "400 V · 10 A · pf 0.8",
    state: { ...ampsKwDefaults },
  },
  {
    id: "kw-to-amps",
    label: "400 V · 5.543 kW · pf 0.8",
    state: { ...ampsKwDefaults, mode: "kw-to-amps" },
  },
];

export type ThreePhaseState = {
  mode: string;
  voltage: string;
  voltageUnit: string;
  current: string;
  currentUnit: string;
  power: string;
  powerUnit: string;
  pf: string;
};

export const threePhaseDefaults: ThreePhaseState = {
  mode: "from-current",
  voltage: "400",
  voltageUnit: "V",
  current: "10",
  currentUnit: "A",
  power: "5543",
  powerUnit: "W",
  pf: "0.8",
};

export const threePhaseCodec: ShareCodec<ThreePhaseState> = createFlatCodec({
  defaults: threePhaseDefaults,
  keys: {
    mode: "m",
    voltage: "v",
    voltageUnit: "vu",
    current: "i",
    currentUnit: "iu",
    power: "p",
    powerUnit: "pu",
    pf: "pf",
  },
  enums: {
    mode: ["from-current", "from-power"],
    voltageUnit: voltageUnitValues,
    currentUnit: currentUnitValues,
    powerUnit: powerUnitValues,
  },
});

export const threePhaseExamples: ToolExample<ThreePhaseState>[] = [
  {
    id: "from-current",
    label: "400 V · 10 A · pf 0.8",
    state: { ...threePhaseDefaults },
  },
  {
    id: "from-power",
    label: "400 V · 5543 W · pf 0.8",
    state: { ...threePhaseDefaults, mode: "from-power" },
  },
];

export type VoltageDropState = {
  material: string;
  circuit: string;
  length: string;
  lengthUnit: string;
  current: string;
  currentUnit: string;
  section: string;
  temp: string;
  pf: string;
  xPerKm: string;
  nominal: string;
  voltageUnit: string;
};

export const voltageDropDefaults: VoltageDropState = {
  material: "copper",
  circuit: "three-phase",
  length: "100",
  lengthUnit: "m",
  current: "80",
  currentUnit: "A",
  section: "25",
  temp: "70",
  pf: "0.85",
  xPerKm: "0.08",
  nominal: "400",
  voltageUnit: "V",
};

export const voltageDropCodec: ShareCodec<VoltageDropState> = createFlatCodec({
  defaults: voltageDropDefaults,
  keys: {
    material: "mat",
    circuit: "cir",
    length: "l",
    lengthUnit: "lu",
    current: "i",
    currentUnit: "iu",
    section: "a",
    temp: "t",
    pf: "pf",
    xPerKm: "x",
    nominal: "vn",
    voltageUnit: "vu",
  },
  enums: {
    material: ["copper", "aluminium"],
    circuit: ["three-phase", "single-phase"],
    lengthUnit: lengthUnitValues,
    currentUnit: currentUnitValues,
    voltageUnit: voltageUnitValues,
  },
});

export const voltageDropExamples: ToolExample<VoltageDropState>[] = [
  {
    id: "cu-3ph-20c",
    label: "Cu 25 mm² · 100 A · 100 m · 20 °C",
    state: {
      ...voltageDropDefaults,
      current: "100",
      temp: "20",
      pf: "1",
      xPerKm: "0",
    },
  },
  {
    id: "cu-1ph",
    label: "Cu 10 mm² single-phase · 230 V",
    state: {
      ...voltageDropDefaults,
      circuit: "single-phase",
      length: "50",
      current: "20",
      section: "10",
      temp: "20",
      pf: "0.9",
      xPerKm: "0.08",
      nominal: "230",
    },
  },
];

export type AdiabaticState = {
  material: string;
  kMode: string;
  initialTemp: string;
  finalTemp: string;
  customK: string;
  current: string;
  currentUnit: string;
  duration: string;
  timeUnit: string;
};

export const adiabaticDefaults: AdiabaticState = {
  material: "copper",
  kMode: "pvc",
  initialTemp: "70",
  finalTemp: "160",
  customK: "115",
  current: "10",
  currentUnit: "kA",
  duration: "1",
  timeUnit: "s",
};

export const adiabaticCodec: ShareCodec<AdiabaticState> = createFlatCodec({
  defaults: adiabaticDefaults,
  keys: {
    material: "mat",
    kMode: "ins",
    initialTemp: "ti",
    finalTemp: "tf",
    customK: "k",
    current: "i",
    currentUnit: "iu",
    duration: "t",
    timeUnit: "tu",
  },
  enums: {
    material: ["copper", "aluminium"],
    kMode: ["pvc", "xlpe", "custom-k"],
    currentUnit: currentUnitValues,
    timeUnit: timeUnitValues,
  },
});

export const adiabaticExamples: ToolExample<AdiabaticState>[] = [
  {
    id: "cu-pvc-10ka",
    label: "Cu PVC · 10 kA · 1 s",
    state: { ...adiabaticDefaults },
  },
  {
    id: "cu-xlpe-20ka",
    label: "Cu XLPE · 20 kA · 0.2 s",
    state: {
      ...adiabaticDefaults,
      kMode: "xlpe",
      initialTemp: "90",
      finalTemp: "250",
      current: "20",
      duration: "0.2",
    },
  },
];

export type ProtectionDeviceState = {
  id: string;
  name: string;
  kind: string;
  characteristic: string;
  fuseClass: string;
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

export type ProtectionCurvesState = {
  minFault: string;
  minFaultUnit: string;
  maxFault: string;
  maxFaultUnit: string;
  devices: ProtectionDeviceState[];
};

const protectionDeviceDefaults: ProtectionDeviceState = {
  id: "device-1",
  name: "Device",
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
};

export const protectionCurvesDefaults: ProtectionCurvesState = {
  minFault: "800",
  minFaultUnit: "A",
  maxFault: "1500",
  maxFaultUnit: "A",
  devices: [
    {
      ...protectionDeviceDefaults,
      id: "device-1",
      name: "Feeder",
      tms: "0.15",
      instPickup: "800",
      instTime: "0.05",
    },
    {
      ...protectionDeviceDefaults,
      id: "device-2",
      name: "Incomer",
      pickup: "250",
      ratedCurrent: "250",
      tms: "0.35",
      definiteTime: "1",
      instPickup: "2000",
      instTime: "0.10",
    },
  ],
};

export const protectionCurvesCodec: ShareCodec<ProtectionCurvesState> = createCompositeCodec(
  {
    scalars: {
      defaults: {
        minFault: protectionCurvesDefaults.minFault,
        minFaultUnit: protectionCurvesDefaults.minFaultUnit,
        maxFault: protectionCurvesDefaults.maxFault,
        maxFaultUnit: protectionCurvesDefaults.maxFaultUnit,
      },
      keys: {
        minFault: "mf",
        minFaultUnit: "mfu",
        maxFault: "xf",
        maxFaultUnit: "xfu",
      },
      enums: {
        minFaultUnit: currentUnitValues,
        maxFaultUnit: currentUnitValues,
      },
    },
    lists: {
      devices: {
        prefix: "d",
        max: 6,
        defaults: protectionDeviceDefaults,
        keys: {
          id: "id",
          name: "n",
          kind: "k",
          characteristic: "c",
          fuseClass: "fc",
          pickup: "p",
          pickupUnit: "pu",
          ratedCurrent: "r",
          ratedUnit: "ru",
          tms: "tms",
          definiteTime: "dt",
          instPickup: "ip",
          instPickupUnit: "ipu",
          instTime: "it",
        },
        enums: {
          kind: ["relay", "fuse"],
          characteristic: ["iec-si", "iec-vi", "iec-ei", "iec-lti", "definite-time"],
          fuseClass: ["gg", "am"],
          pickupUnit: currentUnitValues,
          ratedUnit: currentUnitValues,
          instPickupUnit: currentUnitValues,
        },
      },
    },
  },
  { devices: protectionCurvesDefaults.devices },
);

export const protectionCurvesExamples: ToolExample<ProtectionCurvesState>[] = [
  {
    id: "si-10x",
    label: "IEC SI · 100 A · TMS 1 · 1 kA",
    state: {
      minFault: "1000",
      minFaultUnit: "A",
      maxFault: "1000",
      maxFaultUnit: "A",
      devices: [
        {
          ...protectionDeviceDefaults,
          id: "device-1",
          name: "Relay 1",
          pickup: "100",
          tms: "1",
          instPickup: "",
        },
      ],
    },
  },
  {
    id: "fuse-relay",
    label: "63 A gG + 250 A SI upstream",
    state: {
      minFault: "800",
      minFaultUnit: "A",
      maxFault: "5000",
      maxFaultUnit: "A",
      devices: [
        {
          ...protectionDeviceDefaults,
          id: "device-1",
          name: "Outgoing fuse",
          kind: "fuse",
          fuseClass: "gg",
          ratedCurrent: "63",
        },
        {
          ...protectionDeviceDefaults,
          id: "device-2",
          name: "Upstream",
          pickup: "250",
          tms: "0.3",
          instPickup: "",
        },
      ],
    },
  },
];

export type ProtectionCtAlfState = {
  ctPrimary: string;
  ctPrimaryUnit: string;
  ctSecondary: string;
  ratedAlf: string;
  fault: string;
  faultUnit: string;
  burden: string;
  rct: string;
  rctUnit: string;
  relayR: string;
  relayRUnit: string;
  length: string;
  lengthUnit: string;
  csa: string;
  safetyFactor: string;
};

export const protectionCtAlfDefaults: ProtectionCtAlfState = {
  ctPrimary: "600",
  ctPrimaryUnit: "A",
  ctSecondary: "1",
  ratedAlf: "20",
  fault: "31500",
  faultUnit: "A",
  burden: "15",
  rct: "3",
  rctUnit: "Ω",
  relayR: "0.1",
  relayRUnit: "Ω",
  length: "40",
  lengthUnit: "m",
  csa: "2.5",
  safetyFactor: "2",
};

export const protectionCtAlfCodec: ShareCodec<ProtectionCtAlfState> = createFlatCodec({
  defaults: protectionCtAlfDefaults,
  keys: {
    ctPrimary: "ctp",
    ctPrimaryUnit: "ctpu",
    ctSecondary: "cts",
    ratedAlf: "alf",
    fault: "if",
    faultUnit: "ifu",
    burden: "s",
    rct: "rct",
    rctUnit: "rctu",
    relayR: "rr",
    relayRUnit: "rru",
    length: "l",
    lengthUnit: "lu",
    csa: "a",
    safetyFactor: "sf",
  },
  enums: {
    ctPrimaryUnit: currentUnitValues,
    ctSecondary: ["1", "5"],
    faultUnit: currentUnitValues,
    rctUnit: resistanceUnitValues,
    relayRUnit: resistanceUnitValues,
    lengthUnit: lengthUnitValues,
  },
});

export const protectionCtAlfExamples: ToolExample<ProtectionCtAlfState>[] = [
  {
    id: "sheet-5p20",
    label: "Workbook 600/1 5P20",
    state: { ...protectionCtAlfDefaults },
  },
  {
    id: "sheet-5p40",
    label: "Same CT as 5P40",
    state: { ...protectionCtAlfDefaults, ratedAlf: "40" },
  },
];

export type MeteringCtBurdenState = {
  load: string;
  loadUnit: string;
  voltage: string;
  voltageUnit: string;
  vpu: string;
  ctPrimary: string;
  ctPrimaryUnit: string;
  ctSecondary: string;
  length: string;
  lengthUnit: string;
  csa: string;
  meterR: string;
  meterRUnit: string;
  extraR: string;
  extraRUnit: string;
  burden: string;
};

export const meteringCtBurdenDefaults: MeteringCtBurdenState = {
  load: "50",
  loadUnit: "MVA",
  voltage: "33",
  voltageUnit: "kV",
  vpu: "0.94",
  ctPrimary: "1000",
  ctPrimaryUnit: "A",
  ctSecondary: "1",
  length: "40",
  lengthUnit: "m",
  csa: "2.5",
  meterR: "0.1",
  meterRUnit: "Ω",
  extraR: "0",
  extraRUnit: "Ω",
  burden: "10",
};

export const meteringCtBurdenCodec: ShareCodec<MeteringCtBurdenState> = createFlatCodec({
  defaults: meteringCtBurdenDefaults,
  keys: {
    load: "s",
    loadUnit: "su",
    voltage: "v",
    voltageUnit: "vu",
    vpu: "vpu",
    ctPrimary: "ctp",
    ctPrimaryUnit: "ctpu",
    ctSecondary: "cts",
    length: "l",
    lengthUnit: "lu",
    csa: "a",
    meterR: "rr",
    meterRUnit: "rru",
    extraR: "rx",
    extraRUnit: "rxu",
    burden: "b",
  },
  enums: {
    loadUnit: apparentPowerUnitValues,
    voltageUnit: voltageUnitValues,
    ctPrimaryUnit: currentUnitValues,
    ctSecondary: ["1", "5"],
    lengthUnit: lengthUnitValues,
    meterRUnit: resistanceUnitValues,
    extraRUnit: resistanceUnitValues,
  },
});

export const meteringCtBurdenExamples: ToolExample<MeteringCtBurdenState>[] = [
  {
    id: "sheet-10va",
    label: "Workbook 50 MVA · 10 VA",
    state: { ...meteringCtBurdenDefaults },
  },
  {
    id: "sheet-0-5va",
    label: "Same circuit · 0.5 VA CT",
    state: { ...meteringCtBurdenDefaults, burden: "0.5" },
  },
];

export type BatteryLoadState = {
  id: string;
  name: string;
  power: string;
  powerUnit: string;
  current: string;
  currentUnit: string;
  lastEdited: string;
};

export type BatterySwitchgearState = {
  id: string;
  name: string;
  quantity: string;
  tripCurrent: string;
  tripCurrentUnit: string;
  tripDuration: string;
  tripDurationUnit: string;
  tripOperations: string;
  closeCurrent: string;
  closeCurrentUnit: string;
  closeDuration: string;
  closeDurationUnit: string;
  closeOperations: string;
  motorCurrent: string;
  motorCurrentUnit: string;
  motorDuration: string;
  motorDurationUnit: string;
  motorOperations: string;
};

export type BatterySizingState = {
  voltage: string;
  voltageUnit: string;
  autonomy: string;
  autonomyUnit: string;
  ageing: string;
  temperature: string;
  margin: string;
  loads: BatteryLoadState[];
  switchgear: BatterySwitchgearState[];
};

const batteryLoadDefaults: BatteryLoadState = {
  id: "load-1",
  name: "Load",
  power: "100",
  powerUnit: "W",
  current: "",
  currentUnit: "A",
  lastEdited: "power",
};

const batterySwitchgearDefaults: BatterySwitchgearState = {
  id: "swg-1",
  name: "CB",
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
};

export const batterySizingDefaults: BatterySizingState = {
  voltage: "110",
  voltageUnit: "V",
  autonomy: "3",
  autonomyUnit: "h",
  ageing: "1.25",
  temperature: "1",
  margin: "1.1",
  loads: [
    {
      ...batteryLoadDefaults,
      id: "load-1",
      name: "Protection & control",
      power: "220",
      current: "2",
    },
    {
      ...batteryLoadDefaults,
      id: "load-2",
      name: "Indication lamps",
      power: "55",
      current: "0.5",
    },
  ],
  switchgear: [
    {
      ...batterySwitchgearDefaults,
      id: "swg-1",
      name: "11 kV CB",
      quantity: "4",
    },
  ],
};

export const batterySizingCodec: ShareCodec<BatterySizingState> = createCompositeCodec(
  {
    scalars: {
      defaults: {
        voltage: batterySizingDefaults.voltage,
        voltageUnit: batterySizingDefaults.voltageUnit,
        autonomy: batterySizingDefaults.autonomy,
        autonomyUnit: batterySizingDefaults.autonomyUnit,
        ageing: batterySizingDefaults.ageing,
        temperature: batterySizingDefaults.temperature,
        margin: batterySizingDefaults.margin,
      },
      keys: {
        voltage: "v",
        voltageUnit: "vu",
        autonomy: "t",
        autonomyUnit: "tu",
        ageing: "age",
        temperature: "kth",
        margin: "mar",
      },
      enums: {
        voltageUnit: voltageUnitValues,
        autonomyUnit: timeUnitValues,
      },
    },
    lists: {
      loads: {
        prefix: "l",
        max: 12,
        defaults: batteryLoadDefaults,
        keys: {
          id: "id",
          name: "n",
          power: "p",
          powerUnit: "pu",
          current: "i",
          currentUnit: "iu",
          lastEdited: "e",
        },
        enums: {
          powerUnit: powerUnitValues,
          currentUnit: currentUnitValues,
          lastEdited: ["power", "current"],
        },
      },
      switchgear: {
        prefix: "g",
        max: 8,
        defaults: batterySwitchgearDefaults,
        keys: {
          id: "id",
          name: "n",
          quantity: "q",
          tripCurrent: "ti",
          tripCurrentUnit: "tiu",
          tripDuration: "tt",
          tripDurationUnit: "ttu",
          tripOperations: "tn",
          closeCurrent: "ci",
          closeCurrentUnit: "ciu",
          closeDuration: "ct",
          closeDurationUnit: "ctu",
          closeOperations: "cn",
          motorCurrent: "mi",
          motorCurrentUnit: "miu",
          motorDuration: "mt",
          motorDurationUnit: "mtu",
          motorOperations: "mn",
        },
        enums: {
          tripCurrentUnit: currentUnitValues,
          closeCurrentUnit: currentUnitValues,
          motorCurrentUnit: currentUnitValues,
          tripDurationUnit: timeUnitValues,
          closeDurationUnit: timeUnitValues,
          motorDurationUnit: timeUnitValues,
        },
      },
    },
  },
  {
    loads: batterySizingDefaults.loads,
    switchgear: batterySizingDefaults.switchgear,
  },
);

export const batterySizingExamples: ToolExample<BatterySizingState>[] = [
  {
    id: "textbook",
    label: "10 A · 5 h + 1 Ah trip",
    state: {
      voltage: "110",
      voltageUnit: "V",
      autonomy: "5",
      autonomyUnit: "h",
      ageing: "1.25",
      temperature: "1",
      margin: "1.1",
      loads: [
        {
          id: "load-1",
          name: "Control & indication",
          power: "1100",
          powerUnit: "W",
          current: "10",
          currentUnit: "A",
          lastEdited: "power",
        },
      ],
      switchgear: [
        {
          ...batterySwitchgearDefaults,
          id: "swg-1",
          name: "110 kV CB",
          quantity: "1",
          tripCurrent: "100",
          tripDuration: "36",
          tripOperations: "1",
          closeCurrent: "0",
          closeDuration: "0",
          closeOperations: "0",
          motorCurrent: "0",
          motorDuration: "0",
          motorOperations: "0",
        },
      ],
    },
  },
  {
    id: "11kv-board",
    label: "110 V · 3 h · 4 × 11 kV CB",
    state: { ...batterySizingDefaults },
  },
];

export const toolShare = {
  "amps-kw": { codec: ampsKwCodec, examples: ampsKwExamples },
  "three-phase": { codec: threePhaseCodec, examples: threePhaseExamples },
  "voltage-drop": { codec: voltageDropCodec, examples: voltageDropExamples },
  adiabatic: { codec: adiabaticCodec, examples: adiabaticExamples },
  "protection-curves": { codec: protectionCurvesCodec, examples: protectionCurvesExamples },
  "protection-ct-alf": { codec: protectionCtAlfCodec, examples: protectionCtAlfExamples },
  "metering-ct-burden": { codec: meteringCtBurdenCodec, examples: meteringCtBurdenExamples },
  "battery-sizing": { codec: batterySizingCodec, examples: batterySizingExamples },
} as const;

export function getToolExamples(slug: string): ToolExample<unknown>[] {
  if (Object.prototype.hasOwnProperty.call(toolShare, slug)) {
    return toolShare[slug as ToolSlug].examples as ToolExample<unknown>[];
  }
  return [];
}
