"use client";

import { Bus, Zap, Heart, Map, Clock, Shield } from "lucide-react";
import { LandingSection } from "./LandingSection";

const features = [
  {
    icon: Clock,
    title: "Tiempo real",
    description:
      "Consultá los próximos arribos de todas las líneas de colectivos en Mar del Plata.",
  },
  {
    icon: Zap,
    title: "Rápido y simple",
    description: "Sin registro. Abrís, elegís y listo.",
  },
  {
    icon: Heart,
    title: "Guardá favoritos",
    description: "Guardá tus paradas frecuentes para accederlas al instante.",
  },
  {
    icon: Map,
    title: "Ver recorridos",
    description: "Explorá el mapa con todos los recorridos de las líneas.",
  },
  {
    icon: Bus,
    title: "Todas las líneas",
    description: "Información de todas las líneas de transporte de la ciudad.",
  },
  {
    icon: Shield,
    title: "100% gratuito",
    description: "App gratuita y sin costos ocultos. Uso libre.",
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[#2bb3a8]/50"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amarillo/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amarillo/20 bg-amarillo/10">
              <feature.icon className="h-5 w-5 text-amarillo" strokeWidth={2} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              {feature.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
