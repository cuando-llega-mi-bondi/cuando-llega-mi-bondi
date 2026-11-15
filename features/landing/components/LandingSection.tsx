"use client";

import type { ReactNode } from "react";
import { cn } from "@shared/utils";
import { ScrollRevealText } from "./ScrollRevealText";

interface LandingSectionProps {
  /** Solo cuando aporta un dato (período, fuente); no para numerar secciones */
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  /** Contenido extra bajo la bajada, en la misma columna del título */
  headerExtra?: ReactNode;
  /**
   * "stack": título arriba y contenido debajo.
   * "split": título a la izquierda y contenido a la derecha, como la sección del premio.
   */
  layout?: "stack" | "split";
  className?: string;
  children: ReactNode;
}

export function LandingSection({
  eyebrow,
  title,
  highlight,
  description,
  headerExtra,
  layout = "stack",
  className = "",
  children,
}: LandingSectionProps) {
  const split = layout === "split";

  return (
    <section className={cn("relative py-20 xl:py-24", className)}>
      <div
        className={cn(
          split &&
            "grid gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-16",
        )}
      >
        {/* Jerarquía del premio: dato chico, título, bajada a ancho de lectura */}
        <header className={cn(!split && "mb-12 xl:mb-16")}>
          {eyebrow ? (
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-secondary dark:text-amarillo">
              {eyebrow}
            </p>
          ) : null}

          <h2
            aria-label={highlight ? `${title} ${highlight}` : title}
            className="text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-[42px] xl:text-[46px]"
          >
            <ScrollRevealText text={title} highlight={highlight} />
          </h2>

          {description ? (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}

          {headerExtra}
        </header>

        <div>{children}</div>
      </div>
    </section>
  );
}
