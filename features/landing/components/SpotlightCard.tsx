"use client";

import type { ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@shared/utils";

interface SpotlightCardProps {
  /** Orden de aparición en el scroll — cada tarjeta entra 100ms después de la anterior. */
  index: number;
  /** Color del spotlight radial que sigue el mouse, ej. "rgba(249,205,74,0.16)". */
  tint: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tarjeta base reusada en toda la landing: entrada escalonada al hacer scroll,
 * elevación con spring al hover, y un spotlight radial que sigue el mouse
 * (misma técnica que usan Linear/Stripe/Vercel) — usa useMotionValue en vez
 * de useState para no re-renderizar en cada mousemove.
 */
export function SpotlightCard({ index, tint, children, className }: SpotlightCardProps) {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(480px circle at ${mouseX}% ${mouseY}%, ${tint}, transparent 65%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] },
      }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}
