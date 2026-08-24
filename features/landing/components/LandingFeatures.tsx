"use client";

import { Heart, Map, Shield, Star } from "lucide-react";
import { IconStar } from "@shared/icons/IconStar";
import { cn } from "@shared/utils";
import { LandingSection } from "./LandingSection";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";

// Tarjetas chicas: solo lo que no repite el hero (favoritos, gratis).
const COMPACT_FEATURES = [
  {
    icon: Heart,
    title: "Tus paradas, a mano",
    description: "Guardá las que más usás y accedé en un toque.",
  },
  {
    icon: Shield,
    title: "Gratis, sin vueltas",
    description: "Sin cuenta, sin costos ocultos, sin límites de uso.",
  },
];

export function LandingFeatures() {
  return (
    <LandingSection
      eyebrow="Funciones"
      title="¿Por qué usar"
      highlight="Bondi MDP?"
      description="La forma más simple de consultar cuándo llega tu colectivo."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Destacada: Reseñas — con una preview real del componente de calificación */}
        <SpotlightCard index={0} tint="rgba(249,205,74,0.16)" className="lg:col-span-3 p-7">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-amarillo/20 bg-amarillo/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
            <Star className="h-5 w-5 text-amarillo" strokeWidth={2} />
          </div>
          <h3 className="relative mb-2 mt-5 text-2xl font-bold tracking-tight text-foreground">
            Calificá cada línea
          </h3>
          <p className="relative max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Mirá qué opina la gente antes de subirte, o dejá tu propia reseña.
          </p>
          <div className="relative mt-6 max-w-sm rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <IconStar key={i} filled width={14} height={14} className="text-amarillo" />
                ))}
                <IconStar filled={false} width={14} height={14} className="text-amarillo" />
              </div>
              <span className="text-[13px] font-bold text-foreground">
                <CountUp to={4.2} duration={1.2} decimals={1} />
              </span>
              <span className="text-[12px] text-muted-foreground">· Línea 221</span>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              &ldquo;Llegó justo cuando decía la app&rdquo;
            </p>
          </div>
        </SpotlightCard>

        {/* Destacada: Ver recorridos — con una mini ruta animada y un bondi recorriéndola */}
        <SpotlightCard index={1} tint="rgba(36,144,138,0.18)" className="lg:col-span-2 p-7">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/25 bg-secondary/10 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
            <Map className="h-5 w-5 text-secondary" strokeWidth={2} />
          </div>
          <h3 className="relative mb-2 mt-5 text-2xl font-bold tracking-tight text-foreground">
            Recorridos en mapa
          </h3>
          <p className="relative text-[15px] leading-relaxed text-muted-foreground">
            Explorá el trazado completo, parada por parada.
          </p>
          <div className="relative mt-6 h-20 overflow-hidden rounded-xl border border-border bg-background/70">
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(43,179,168,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,179,168,0.10) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <svg
              aria-hidden
              viewBox="0 0 260 90"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 h-full w-full"
            >
              {/* Unidad de dasharray (6+4=10) divide justo el offset compartido
                  de .animate-route-flow (-140), así el loop no salta al reiniciar. */}
              <path
                id="feature-route-path"
                d="M 10 70 L 70 70 L 70 30 L 140 30 L 140 55 L 250 55"
                fill="none"
                stroke="var(--mdp-amarillo)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 4"
                opacity="0.85"
                className="animate-route-flow"
                style={{ animationDuration: "3.6s" }}
              />
              {/* El bondi recorriendo la línea */}
              <g className="motion-reduce:hidden">
                <circle r="8" fill="var(--mdp-amarillo)" opacity="0.22" />
                <circle r="4" fill="var(--mdp-amarillo)" />
                <circle r="1.6" fill="var(--primary-foreground)" />
                <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#feature-route-path" />
                </animateMotion>
              </g>
            </svg>
          </div>
        </SpotlightCard>

        {/* Compactas: Favoritos + Gratis */}
        {COMPACT_FEATURES.map((feature, i) => (
          <SpotlightCard
            key={feature.title}
            index={2 + i}
            tint="rgba(249,205,74,0.14)"
            className={cn("flex items-center gap-4 p-5", i === 0 ? "lg:col-span-2" : "lg:col-span-3")}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amarillo/20 bg-amarillo/10 transition-transform duration-500 group-hover:scale-110">
              <feature.icon className="h-5 w-5 text-amarillo" strokeWidth={2} />
            </span>
            <div className="relative">
              <h3 className="text-[15px] font-bold text-foreground">{feature.title}</h3>
              <p className="text-[13px] text-muted-foreground">{feature.description}</p>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </LandingSection>
  );
}
