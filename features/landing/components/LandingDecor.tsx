import type { ReactNode } from "react";
import { cn } from "@shared/utils";

/** Faint blueprint grid used as a section backdrop, faded at the edges. */
export function BlueprintGrid({ className }: { className?: string }) {
  const mask = "radial-gradient(120% 90% at 50% 0%, black 45%, transparent 100%)";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(43,179,168,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,179,168,0.06) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/**
 * Faint Mar del Plata street map behind the whole landing. Fixed so the content
 * scrolls over one coherent map instead of a repeated/cropped texture.
 * Map data © OpenStreetMap contributors (ODbL) — attributed in the footer.
 */
export function CityMapBackground() {
  const mask = "radial-gradient(120% 85% at 50% 42%, black 28%, transparent 80%)";
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: "url(/mar-del-plata-mapa-bg.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.14,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/** Small turquoise pill label sitting above a section heading. */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2bb3a8]/40 bg-[#2bb3a8]/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#2bb3a8]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2bb3a8]" />
      {children}
    </span>
  );
}

/** Animated dashed "route" that visually connects two stacked sections. */
export function RouteDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto flex max-w-6xl items-center gap-3 px-8 py-2"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amarillo/70" />
      <div className="route-dash-line h-px flex-1 opacity-70" />
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute h-3 w-3 animate-route-pulse rounded-full bg-amarillo" />
        <span className="h-1.5 w-1.5 rounded-full bg-amarillo" />
      </span>
      <div className="route-dash-line h-px flex-1 opacity-70" />
      <span className="h-1.5 w-1.5 rounded-full bg-amarillo/70" />
    </div>
  );
}
