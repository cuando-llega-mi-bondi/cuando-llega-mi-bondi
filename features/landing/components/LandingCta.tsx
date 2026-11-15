"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { ScrollRevealText } from "./ScrollRevealText";

export function LandingCta() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const mapY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["0%", "14%"],
  );

  return (
    <section ref={ref} className="pb-16 pt-20 xl:pt-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10 xl:p-12">
        <motion.div
          aria-hidden
          style={{ y: mapY }}
          className="pointer-events-none absolute -inset-y-8 right-0 w-3/5 bg-cover bg-right opacity-20 dark:opacity-25"
        >
          <div
            className="h-full w-full bg-cover bg-right"
            style={{
              backgroundImage: "url(/mar-del-plata-mapa-bg.svg)",
              maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to left, black 35%, transparent 100%)",
            }}
          />
        </motion.div>

        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-xl space-y-2.5">
            <h2
              aria-label="Dejá de adivinar cuándo llega el bondi."
              className="text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-5xl xl:text-[54px]"
            >
              <ScrollRevealText
                text="Dejá de adivinar cuándo llega😉"
                highlight="el bondi."
              />
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Elegí línea y esquina en el teléfono interactivo de la izquierda o
              llevate la aplicación instalada en Android.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {/* Único CTA primario de la landing: amarillo MDP con texto oscuro */}
            <Link
              href="/android"
              className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-88 active:scale-[0.98]"
            >
              Bajala en Google Play
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
