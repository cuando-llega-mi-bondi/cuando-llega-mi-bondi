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

/** Small turquoise pill label sitting above a section heading. */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
      {children}
    </span>
  );
}
