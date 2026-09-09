import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EE Tools — IEC electrical calculators",
    template: "%s | EE Tools",
  },
  description:
    "Free IEC / metric electrical engineering calculators: three-phase amps and kW, voltage drop, adiabatic short-circuit CSA, and protection tools.",
  openGraph: {
    title: "EE Tools — IEC electrical calculators",
    description:
      "Three-phase amps ↔ kW, voltage drop, adiabatic short-circuit CSA, and protection calculators.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
