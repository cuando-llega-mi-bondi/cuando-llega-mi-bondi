import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { DemoUserProvider } from "@/lib/demo/DemoUserContext";
import { BottomNav } from "./_components/BottomNav";
import "./v2.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-v2-display",
  weight: ["500", "600", "700", "800"],
});

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-v2-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-v2-mono",
});

export const metadata: Metadata = {
  title: "Bondi MDP",
  description:
    "Líneas, paradas y arribos en vivo de los colectivos urbanos de Mar del Plata.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <DemoUserProvider>
      <div
        className={`${display.variable} ${sans.variable} ${mono.variable} v2-root relative min-h-[100dvh] bg-[#FAF7F0] text-[#0F1115] antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 z-0 v2-grain" aria-hidden />
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] v2-aurora" aria-hidden />
        <main className="relative z-10 mx-auto w-full max-w-md pb-[120px] pt-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </DemoUserProvider>
  );
}
