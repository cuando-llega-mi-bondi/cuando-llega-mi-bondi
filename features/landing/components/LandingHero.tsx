"use client";

import Link from "next/link";
import { ArrowRight, Bus, MapPin, Search, Zap } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { BrandLogo } from "@shared/ui/BrandLogo";

// Tokens del sistema (DESIGN.md), no hex sueltos — el hero fuerza `.dark` en
// LandingPage así que --secondary/--foreground resuelven siempre a los
// valores de modo oscuro. NAVY usa --primary-foreground, no --foreground:
// es el par de contraste fijo del amarillo (regla dura de DESIGN.md), no debe
// invertirse si el tema cambia.
const AMARILLO = "var(--mdp-amarillo)";
const NAVY = "var(--primary-foreground)";
// bg-[#0c243c] abajo (chasis del teléfono) es intencional: un tono "hardware"
// más oscuro que --card a propósito, no una superficie de la app — no hay
// token de sistema para esto.

const FEATURES = [
  {
    icon: MapPin,
    label: "GPS en vivo",
    detail: " — sabé exactamente dónde está tu bondi",
  },
  { icon: Zap, label: "Sin cuentas, sin esperas", detail: " — entrá y consultá directo" },
  { icon: Bus, label: "Incluye línea 221", detail: " — que no está en la app oficial" },
] as const;

/** Animated dashed transit route that snakes across the hero background. */
function HeroRoute() {
  // Right-angled "transit map" path, normalized via pathLength for the draw-on.
  // Kept in the centre-right gap so it never overlaps the hero copy.
  const ROUTE = "M 700 720 L 700 500 L 900 500 L 900 360 L 1120 360 L 1120 470 L 1320 470";

  // Subtle parallax: the route drifts up as the hero scrolls away.
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const rawY = useTransform(scrollY, [0, 700], [0, -80]);
  const routeY = reduceMotion ? 0 : rawY;

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      style={{
        y: routeY,
        maskImage: "linear-gradient(to bottom, black 50%, transparent 90%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 90%)",
        willChange: "transform",
      }}
    >
      {/* Faint diagonal "avenue" crossing the grid */}
      <line
        x1="120"
        y1="760"
        x2="1320"
        y2="20"
        stroke={AMARILLO}
        strokeWidth="1.5"
        opacity="0.14"
      />

      {/* Soft glow that traces itself once, then lingers under the dashes */}
      <path
        d={ROUTE}
        fill="none"
        stroke={AMARILLO}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.12"
        pathLength={1000}
        strokeDasharray={1000}
        className="animate-route-draw"
        style={{ filter: "blur(6px)" }}
      />

      {/* The recorrido — dashed line with marching-ants flow */}
      <path
        id="hero-route-path"
        d={ROUTE}
        fill="none"
        stroke={AMARILLO}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="12 8"
        opacity="0.9"
        className="animate-route-flow"
      />

      {/* GPS marker sitting on a junction, with a pulsing ring */}
      <g transform="translate(900 500)">
        <circle
          r="9"
          fill={AMARILLO}
          className="animate-route-pulse"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle r="6.5" fill={AMARILLO} />
        <circle r="2.6" fill={NAVY} />
      </g>

      {/* Live bondi travelling along the route */}
      <g className="motion-reduce:hidden">
        <circle r="16" fill={AMARILLO} opacity="0.22" />
        <circle r="6.5" fill={AMARILLO} />
        <circle r="2.6" fill={NAVY} />
        <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
          <mpath href="#hero-route-path" />
        </animateMotion>
      </g>
    </motion.svg>
  );
}

/** Tilted phone mockup showing the live map + arrivals list. */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] rotate-[3deg]">
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-secondary/25 to-amarillo/25 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0c243c] p-3 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          <BrandLogo size="md" className="text-foreground" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Vivo
          </span>
        </div>

        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-background px-3.5 py-3 text-[13px] text-muted-foreground">
          <Search className="h-4 w-4" />
          Buscar línea…
        </div>

        {/* Mini live map */}
        <div className="relative mb-3 h-[190px] overflow-hidden rounded-2xl border border-white/10 bg-background">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(43,179,168,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,179,168,0.10) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 300 190"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M 20 150 L 90 150 L 90 80 L 180 80 L 180 120 L 260 120"
              fill="none"
              stroke={AMARILLO}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="9 7"
              className="animate-route-flow"
            />
          </svg>
          {/* 221 marker */}
          <div className="absolute right-8 top-[58%] flex -translate-y-1/2 items-center gap-1.5">
            <span className="rounded-md bg-[#0c243c] px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow">
              221
            </span>
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute h-4 w-4 animate-route-pulse rounded-full bg-amarillo" />
              <span className="h-3 w-3 rounded-full border-2 border-[#0c243c] bg-amarillo" />
            </span>
          </div>
        </div>

        {/* Arrivals list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-amarillo/30 bg-amarillo/10 px-3.5 py-3">
            <div>
              <div className="text-lg font-black text-amarillo">221</div>
              <div className="text-[11px] text-muted-foreground">Centro — Terminal</div>
            </div>
            <span className="rounded-lg bg-amarillo px-2.5 py-1 text-[12px] font-bold text-primary-foreground">
              3 min
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background px-3.5 py-3">
            <div>
              <div className="text-lg font-black text-foreground">561</div>
              <div className="text-[11px] text-muted-foreground">Güemes — Puerto</div>
            </div>
            <span className="rounded-lg bg-secondary/15 px-2.5 py-1 text-[12px] font-bold text-secondary">
              9 min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden text-foreground">
      {/* Animated route */}
      <HeroRoute />

      <div className="relative z-10 mx-auto max-w-7xl px-8 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-secondary">
                GPS en tiempo real
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tight lg:text-7xl">
              <span className="block">Movéte mejor</span>
              <span className="block text-amarillo">por Mar del Plata.</span>
            </h1>

            <p className="mx-auto mb-9 max-w-lg text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:text-xl">
              Tiempos de arribo en vivo. La interfaz de transporte que la ciudad
              se merecía.
            </p>

            <ul className="mb-10 space-y-3 text-left">
              {FEATURES.map(({ icon: Icon, label, detail }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amarillo/25 bg-amarillo/10">
                    <Icon className="h-4 w-4 text-amarillo" />
                  </span>
                  <span className="text-[15px] text-foreground/85">
                    <span className="font-semibold text-foreground">{label}</span>
                    {detail}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-center gap-5 lg:justify-start">
              <Link
                href="/consultar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amarillo px-7 py-3.5 text-[15px] font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                Consultá gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-[14px] font-medium text-muted-foreground">
                Sin instalar nada, andá directo
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="hidden lg:block">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}
