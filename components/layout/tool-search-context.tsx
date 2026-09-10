"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ToolSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const ToolSearchContext = createContext<ToolSearchContextValue | null>(null);

export function ToolSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);

  return <ToolSearchContext.Provider value={value}>{children}</ToolSearchContext.Provider>;
}

export function useToolSearch(): ToolSearchContextValue {
  const context = useContext(ToolSearchContext);
  if (!context) {
    throw new Error("useToolSearch must be used within ToolSearchProvider");
  }
  return context;
}
