"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ToolSnapshot } from "@/lib/copy-results";

export type RegisteredExample = {
  id: string;
  label: string;
};

type ToolSessionValue = {
  slug: string;
  name: string;
  examples: RegisteredExample[];
  setSnapshot: (snapshot: ToolSnapshot) => void;
  getSnapshot: () => ToolSnapshot | null;
  registerExamples: (examples: RegisteredExample[], apply: (id: string) => void) => void;
  applyExample: (id: string) => void;
  getShareHref: () => string;
  registerShareHref: (getter: () => string) => void;
};

const ToolSessionContext = createContext<ToolSessionValue | null>(null);

function sameExamples(a: RegisteredExample[], b: RegisteredExample[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, index) => item.id === b[index]?.id && item.label === b[index]?.label)
  );
}

export function ToolSessionProvider({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: ReactNode;
}) {
  const [examples, setExamples] = useState<RegisteredExample[]>([]);
  const snapshotRef = useRef<ToolSnapshot | null>(null);
  const applyRef = useRef<(id: string) => void>(() => undefined);
  const shareHrefRef = useRef<() => string>(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );

  const setSnapshot = useCallback((next: ToolSnapshot) => {
    snapshotRef.current = next;
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const registerExamples = useCallback(
    (next: RegisteredExample[], apply: (id: string) => void) => {
      applyRef.current = apply;
      setExamples((current) => (sameExamples(current, next) ? current : next));
    },
    [],
  );

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
      examples,
      setSnapshot,
      getSnapshot,
      registerExamples,
      applyExample,
      getShareHref,
      registerShareHref,
    }),
    [
      slug,
      name,
      examples,
      setSnapshot,
      getSnapshot,
      registerExamples,
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
