"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { type ShareCodec } from "@/lib/share-url";

/**
 * Hydrate calculator state from the query string, then keep the URL in sync
 * with `history.replaceState` using a relative `?query` (Next.js App Router).
 */
export function useShareableState<T>(defaults: T, codec: ShareCodec<T>): [T, Dispatch<SetStateAction<T>>] {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [state, setState] = useState<T>(defaults);
  const skipSearch = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (skipSearch.current === search) {
      skipSearch.current = null;
      return;
    }
    setState(codec.decode(new URLSearchParams(search)));
  }, [search, codec]);

  useEffect(() => {
    const qs = codec.encode(state).toString();
    if (qs === search) return;
    skipSearch.current = qs;
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [state, codec, search]);

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
