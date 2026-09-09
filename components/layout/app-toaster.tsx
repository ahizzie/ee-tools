"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export function AppToaster() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Toaster />
    </ThemeProvider>
  );
}
