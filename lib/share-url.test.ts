import { describe, expect, it } from "vitest";
import {
  createCompositeCodec,
  createFlatCodec,
  decodeFlat,
  decodeList,
  encodeList,
  mergeParams,
  parseSearch,
} from "./share-url";

const spec = {
  defaults: { mode: "a", voltage: "400", unit: "V" },
  keys: { mode: "m", voltage: "v", unit: "vu" },
  enums: {
    mode: ["a", "b"] as const,
    unit: ["V", "kV"] as const,
  },
};

describe("decodeFlat / encodeFlat", () => {
  const codec = createFlatCodec(spec);

  it("round-trips known fields", () => {
    const state = { mode: "b", voltage: "11", unit: "kV" };
    const again = codec.decode(codec.encode(state));
    expect(again).toEqual(state);
  });

  it("ignores unknown query keys", () => {
    const params = parseSearch("?v=415&bogus=1&also=x");
    expect(codec.decode(params)).toEqual({
      mode: "a",
      voltage: "415",
      unit: "V",
    });
  });

  it("ignores invalid enum values", () => {
    const params = parseSearch("?m=not-a-mode&vu=amps&v=230");
    expect(codec.decode(params)).toEqual({
      mode: "a",
      voltage: "230",
      unit: "V",
    });
  });

  it("keeps defaults when the query is empty", () => {
    expect(codec.decode(new URLSearchParams())).toEqual(spec.defaults);
  });

  it("accepts empty strings for non-enum fields", () => {
    const params = parseSearch("?v=");
    expect(decodeFlat(params, spec).voltage).toBe("");
  });
});

describe("indexed lists", () => {
  const listSpec = {
    prefix: "d",
    max: 4,
    defaults: { name: "Device", kind: "relay", pickup: "100" },
    keys: { name: "n", kind: "k", pickup: "p" },
    enums: { kind: ["relay", "fuse"] as const },
  };

  it("round-trips several items", () => {
    const items = [
      { name: "Feeder", kind: "relay", pickup: "100" },
      { name: "Fuse", kind: "fuse", pickup: "63" },
    ];
    const again = decodeList(encodeList(items, listSpec), listSpec);
    expect(again).toEqual(items);
  });

  it("returns undefined when no list keys are present", () => {
    expect(decodeList(parseSearch("?v=1"), listSpec)).toBeUndefined();
  });

  it("stops at the first gap", () => {
    const params = parseSearch("?d0n=A&d2n=C");
    expect(decodeList(params, listSpec)).toEqual([
      { name: "A", kind: "relay", pickup: "100" },
    ]);
  });

  it("ignores invalid enum values on a list item", () => {
    const params = parseSearch("?d0n=Fuse&d0k=not-a-kind");
    expect(decodeList(params, listSpec)).toEqual([
      { name: "Fuse", kind: "relay", pickup: "100" },
    ]);
  });
});

describe("createCompositeCodec", () => {
  const codec = createCompositeCodec(
    {
      scalars: {
        defaults: { minFault: "800" },
        keys: { minFault: "mf" },
      },
      lists: {
        devices: {
          prefix: "d",
          max: 3,
          defaults: { name: "Device" },
          keys: { name: "n" },
        },
      },
    },
    { devices: [{ name: "Default" }] },
  );

  it("keeps default lists when list keys are absent", () => {
    expect(codec.decode(parseSearch("?mf=1200"))).toEqual({
      minFault: "1200",
      devices: [{ name: "Default" }],
    });
  });

  it("round-trips scalars and lists together", () => {
    const state = { minFault: "500", devices: [{ name: "A" }, { name: "B" }] };
    expect(codec.decode(codec.encode(state))).toEqual(state);
  });

  it("merges param bags without dropping keys", () => {
    const merged = mergeParams(
      parseSearch("a=1&b=2"),
      parseSearch("b=9&c=3"),
    );
    expect(Object.fromEntries(merged)).toEqual({ a: "1", b: "9", c: "3" });
  });
});
