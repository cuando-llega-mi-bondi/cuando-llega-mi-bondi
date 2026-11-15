"use client";

import type { ReactNode } from "react";
import { cn } from "@shared/utils";

interface SpotlightCardProps {
  index?: number;
  tint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor plano del sistema de diseño: un único método de separación por límite
 * (`border border-border bg-card`), sin sombras pesadas ni brillos decorativos.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-150 hover:border-secondary/60",
        className,
      )}
    >
      {children}
    </div>
  );
}
