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

export type ExampleRequest = {
  id: string;
  token: number;
};

type ToolSessionValue = {
  slug: string;
  name: string;
  exampleRequest: ExampleRequest | null;
  requestExample: (id: string) => void;
  setSnapshot: (snapshot: ToolSnapshot) => void;
  getSnapshot: () => ToolSnapshot | null;
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
  const [exampleRequest, setExampleRequest] = useState<ExampleRequest | null>(null);
  const snapshotRef = useRef<ToolSnapshot | null>(null);
  const shareHrefRef = useRef<() => string>(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );
  const tokenRef = useRef(0);

  const setSnapshot = useCallback((next: ToolSnapshot) => {
    snapshotRef.current = next;
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const registerShareHref = useCallback((getter: () => string) => {
    shareHrefRef.current = getter;
  }, []);

  const requestExample = useCallback((id: string) => {
    tokenRef.current += 1;
    setExampleRequest({ id, token: tokenRef.current });
  }, []);

  const getShareHref = useCallback(() => shareHrefRef.current(), []);

  const value = useMemo(
    () => ({
      slug,
      name,
      exampleRequest,
      requestExample,
      setSnapshot,
      getSnapshot,
      getShareHref,
      registerShareHref,
    }),
    [
      slug,
      name,
      exampleRequest,
      requestExample,
      setSnapshot,
      getSnapshot,
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
