/**
 * Query-string codec for calculator state.
 *
 * Scheme (see docs/SHARE_URLS.md):
 * - Scalar fields use compact keys (`v`, `pf`, …).
 * - Lists use `{prefix}{index}{field}` (0-based, no gaps), e.g. `d0n=Feeder`.
 * - Unknown keys are ignored. Invalid enum values fall back to the default.
 */

export type FlatSpec<T extends Record<string, string>> = {
  defaults: T;
  /** Maps state field → compact query key. */
  keys: { [K in keyof T]: string };
  enums?: { [K in keyof T]?: readonly string[] };
};

export type ListSpec<T extends Record<string, string>> = FlatSpec<T> & {
  prefix: string;
  max: number;
};

export type ShareCodec<T> = {
  decode(params: URLSearchParams): T;
  encode(state: T): URLSearchParams;
};

function allowed(spec: { enums?: Record<string, readonly string[] | undefined> }, field: string, value: string): boolean {
  const values = spec.enums?.[field];
  if (!values) return true;
  return values.includes(value);
}

export function decodeFlat<T extends Record<string, string>>(
  params: URLSearchParams,
  spec: FlatSpec<T>,
): T {
  const next = { ...spec.defaults };
  for (const field of Object.keys(spec.keys) as (keyof T)[]) {
    const short = spec.keys[field];
    const raw = params.get(short);
    if (raw === null) continue;
    if (!allowed(spec, String(field), raw)) continue;
    next[field] = raw as T[keyof T];
  }
  return next;
}

export function encodeFlat<T extends Record<string, string>>(
  state: T,
  spec: FlatSpec<T>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const field of Object.keys(spec.keys) as (keyof T)[]) {
    params.set(spec.keys[field], state[field] ?? "");
  }
  return params;
}

function listFieldKey<T extends Record<string, string>>(
  spec: ListSpec<T>,
  index: number,
  field: keyof T,
): string {
  return `${spec.prefix}${index}${spec.keys[field]}`;
}

function indexPresent<T extends Record<string, string>>(
  params: URLSearchParams,
  spec: ListSpec<T>,
  index: number,
): boolean {
  return (Object.keys(spec.keys) as (keyof T)[]).some((field) =>
    params.has(listFieldKey(spec, index, field)),
  );
}

/**
 * Parse an indexed list. Returns `undefined` when no items are present so
 * callers can keep their UI defaults.
 */
export function decodeList<T extends Record<string, string>>(
  params: URLSearchParams,
  spec: ListSpec<T>,
): T[] | undefined {
  if (!indexPresent(params, spec, 0)) return undefined;
  const items: T[] = [];
  for (let index = 0; index < spec.max; index += 1) {
    if (!indexPresent(params, spec, index)) break;
    const item = { ...spec.defaults };
    for (const field of Object.keys(spec.keys) as (keyof T)[]) {
      const raw = params.get(listFieldKey(spec, index, field));
      if (raw === null) continue;
      if (!allowed(spec, String(field), raw)) continue;
      item[field] = raw as T[keyof T];
    }
    items.push(item);
  }
  return items.length > 0 ? items : undefined;
}

export function encodeList<T extends Record<string, string>>(
  items: T[],
  spec: ListSpec<T>,
): URLSearchParams {
  const params = new URLSearchParams();
  const limited = items.slice(0, spec.max);
  limited.forEach((item, index) => {
    for (const field of Object.keys(spec.keys) as (keyof T)[]) {
      params.set(listFieldKey(spec, index, field), item[field] ?? "");
    }
  });
  return params;
}

export function mergeParams(...parts: URLSearchParams[]): URLSearchParams {
  const params = new URLSearchParams();
  for (const part of parts) {
    for (const [key, value] of part.entries()) {
      params.set(key, value);
    }
  }
  return params;
}

export function createFlatCodec<T extends Record<string, string>>(spec: FlatSpec<T>): ShareCodec<T> {
  return {
    decode: (params) => decodeFlat(params, spec),
    encode: (state) => encodeFlat(state, spec),
  };
}

export type CompositeSpec<
  S extends Record<string, string>,
  L extends Record<string, Record<string, string>>,
> = {
  scalars: FlatSpec<S>;
  lists: { [K in keyof L]: ListSpec<L[K]> };
};

export type CompositeState<
  S extends Record<string, string>,
  L extends Record<string, Record<string, string>>,
> = S & { [K in keyof L]: L[K][] };

export function createCompositeCodec<
  S extends Record<string, string>,
  L extends Record<string, Record<string, string>>,
>(
  spec: CompositeSpec<S, L>,
  defaultLists: { [K in keyof L]: L[K][] },
): ShareCodec<CompositeState<S, L>> {
  return {
    decode(params) {
      const scalars = decodeFlat(params, spec.scalars);
      const lists = { ...defaultLists };
      for (const name of Object.keys(spec.lists) as (keyof L)[]) {
        const parsed = decodeList(params, spec.lists[name]);
        if (parsed) lists[name] = parsed;
      }
      return { ...scalars, ...lists };
    },
    encode(state) {
      const scalarState = {} as S;
      for (const field of Object.keys(spec.scalars.keys) as (keyof S)[]) {
        scalarState[field] = state[field];
      }
      const parts = [encodeFlat(scalarState, spec.scalars)];
      for (const name of Object.keys(spec.lists) as (keyof L)[]) {
        const items = (state as CompositeState<S, L>)[name];
        parts.push(encodeList(items as L[typeof name][], spec.lists[name]));
      }
      return mergeParams(...parts);
    },
  };
}

export function parseSearch(search: string): URLSearchParams {
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(trimmed);
}

export function replaceSearch(params: URLSearchParams): void {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;
  // Next.js patches history.replaceState; pass null like the App Router docs.
  window.history.replaceState(null, "", next);
}

export function hrefWithParams(params: URLSearchParams, base = typeof window === "undefined" ? "" : window.location.href): string {
  if (!base) {
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }
  const url = new URL(base);
  url.search = params.toString();
  return url.toString();
}
