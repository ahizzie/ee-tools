"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { ToolSnapshot } from "@/lib/copy-results";

type ToolSessionValue = {
  slug: string;
  name: string;
  setSnapshot: (snapshot: ToolSnapshot) => void;
  getSnapshot: () => ToolSnapshot | null;
  registerApplyExample: (apply: (id: string) => void) => void;
  applyExample: (id: string) => void;
  getShareHref: () => string;
  registerShareHref: (getter: () => string) => void;
};

const ToolSessionContext = createContext<ToolSessionValue | null>(null);

export function ToolSessionProvider({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: ReactNode;
}) {
  const snapshotRef = useRef<ToolSnapshot | null>(null);
  const applyRef = useRef<(id: string) => void>(() => undefined);
  const shareHrefRef = useRef<() => string>(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );

  const setSnapshot = useCallback((next: ToolSnapshot) => {
    snapshotRef.current = next;
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const registerApplyExample = useCallback((apply: (id: string) => void) => {
    applyRef.current = apply;
  }, []);

  const registerShareHref = useCallback((getter: () => string) => {
    shareHrefRef.current = getter;
  }, []);

  const applyExample = useCallback((id: string) => {
    applyRef.current(id);
  }, []);

  const getShareHref = useCallback(() => shareHrefRef.current(), []);

  const value = useMemo(
    () => ({
      slug,
      name,
      setSnapshot,
      getSnapshot,
      registerApplyExample,
      applyExample,
      getShareHref,
      registerShareHref,
    }),
    [
      slug,
      name,
      setSnapshot,
      getSnapshot,
      registerApplyExample,
      applyExample,
      getShareHref,
      registerShareHref,
    ],
  );

  return <ToolSessionContext.Provider value={value}>{children}</ToolSessionContext.Provider>;
}

export function useToolSession(): ToolSessionValue {
  const value = useContext(ToolSessionContext);
  if (!value) {
    throw new Error("useToolSession must be used within ToolSessionProvider");
  }
  return value;
}

export function useOptionalToolSession(): ToolSessionValue | null {
  return useContext(ToolSessionContext);
}
