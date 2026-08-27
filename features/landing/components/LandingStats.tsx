"use client";

import Link from "next/link";
import { ArrowRight, Users, Eye, Activity, Repeat, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { LandingSection } from "./LandingSection";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";

interface Stat {
  count?: { to: number; sep?: boolean; prefix?: string; suffix?: string };
  value?: string;
  label: string;
  /** Línea de contexto que traduce la métrica a algo que le hable al usuario. */
  detail: string;
  icon: LucideIcon;
}

// Datos del primer trimestre completo (26 may – 23 ago 2026), del mismo
// informe publicado en /primer-trimestre-en-numeros. Actualizar ahí primero
// y traer los mismos números acá cada vez que cierre un trimestre.
const STATS: Stat[] = [
  {
    count: { to: 22893, sep: true },
    label: "usuarios activos",
    detail: "sin una sola campaña de publicidad",
    icon: Users,
  },
  {
    count: { to: 763, prefix: "+", suffix: " mil" },
    label: "consultas de arribos",
    detail: "unas 8.500 por día",
    icon: Eye,
  },
  {
    count: { to: 133694, sep: true },
    label: "sesiones en el trimestre",
    detail: "cada persona volvió casi 6 veces",
    icon: Activity,
  },
  {
    value: "85%",
    label: "usuarios vuelven",
    detail: "la mayoría ya la usa de rutina",
    icon: Repeat,
  },
];

export function LandingStats() {
  return (
    <LandingSection eyebrow="En números" title="El primer trimestre" highlight="en la calle">
      {/* Halo ambiental detrás de toda la grilla — enmarca el bloque como un logro, no solo una lista de datos */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amarillo/[0.07] blur-[140px]"
      />

      {/* Texto previo — le da contexto y narrativa a los números */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto mb-12 max-w-2xl text-center text-[17px] leading-relaxed text-muted-foreground"
      >
        <Sparkles
          aria-hidden
          className="mr-1.5 hidden h-4 w-4 -translate-y-0.5 align-middle text-amarillo sm:inline"
        />
        Lanzamos Bondi MDP{" "}
        <span className="font-semibold text-foreground">
          sin un peso en publicidad
        </span>
        : creció de boca en boca, de parada en parada. Esto pasó en los
        primeros tres meses.
      </motion.p>

      {/* 2x2 en vez de 4 en fila: cada tarjeta necesita ancho de sobra para
          números grandes como "+763 mil" sin desbordar la tarjeta. Mismo
          ancho de contenedor que Funciones/Prensa (sin max-w propio), para
          que la página no salte de ancho entre secciones. */}
      <div className="relative grid grid-cols-2 gap-5 lg:gap-6">
        {STATS.map(({ count, value, label, detail, icon: Icon }, i) => (
          <SpotlightCard
            key={label}
            index={i}
            tint="rgba(36,144,138,0.18)"
            className="flex flex-col items-center p-7 text-center lg:p-9"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Icon className="relative h-5 w-5 text-secondary" />
            </span>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: i * 0.1 + 0.15 }}
              className="relative mt-5 text-4xl font-black leading-[0.95] tracking-tight text-amarillo drop-shadow-[0_0_24px_rgba(249,205,74,0.35)] sm:text-5xl lg:text-6xl"
            >
              {count ? <CountUp {...count} /> : value}
            </motion.div>
            <motion.div
              aria-hidden
              className="relative mt-3 h-[3px] w-10 origin-left rounded-full bg-amarillo/40"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={{ duration: 0.6, delay: i * 0.1 + 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="relative mt-3 text-[15px] font-bold text-foreground">
              {label}
            </div>
            <div className="relative mt-1 text-[12px] leading-snug text-muted-foreground">
              {detail}
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Info de impacto: derivada de los mismos 16.224 usuarios nuevos
          reales del trimestre, sin compararlos contra población total
          (denominador engañoso: ahí entra gente que nunca viajaría en
          colectivo). Ritmo de crecimiento en cambio no asume nada del mercado. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative mx-auto mt-8 max-w-2xl rounded-2xl border border-amarillo/25 bg-gradient-to-r from-amarillo/10 via-amarillo/5 to-transparent px-6 py-5 text-center"
      >
        <p className="text-[17px] font-bold text-foreground">
          Eso es <span className="text-amarillo">más de 180 personas nuevas por día</span>, sin gastar un peso en publicidad.
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          16.224 usuarios nuevos ÷ los 90 días del trimestre.
        </p>
      </motion.div>

      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/primer-trimestre-en-numeros"
          className="group inline-flex items-center justify-center gap-2 rounded-full border border-secondary/50 bg-secondary/10 px-6 py-3 text-[14px] font-bold text-foreground transition-colors hover:border-secondary"
        >
          Ver el informe completo
          <ArrowRight className="h-4 w-4 text-amarillo transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/un-mes-en-numeros"
          className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-[14px] font-bold text-foreground transition-colors hover:border-secondary/50"
        >
          Ver el informe del primer mes
          <ArrowRight className="h-4 w-4 text-amarillo transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </LandingSection>
  );
}
