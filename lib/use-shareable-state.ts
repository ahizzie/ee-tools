"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type Dispatch, type SetStateAction } from "react";
import { replaceSearch, type ShareCodec } from "@/lib/share-url";

function readWindowSearch(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/**
 * Hydrate calculator state from the query string, then keep the URL in sync
 * with `history.replaceState` (no Next.js navigation).
 */
export function useShareableState<T>(defaults: T, codec: ShareCodec<T>): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from location.search before paint. */
    setState(codec.decode(readWindowSearch()));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [codec]);

  useEffect(() => {
    if (!hydrated) return;
    replaceSearch(codec.encode(state));
  }, [state, hydrated, codec]);

  const update = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setState(action);
  }, []);

  return [state, update];
}

export function shareHref<T>(state: T, codec: ShareCodec<T>): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = codec.encode(state).toString();
  return url.toString();
}
