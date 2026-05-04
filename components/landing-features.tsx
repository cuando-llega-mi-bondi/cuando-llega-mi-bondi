"use client";

import { Bus, Zap, Heart, Map, Clock, Shield } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const features = [
  {
    icon: Clock,
    title: "Tiempo real",
    description:
      "Consultá los próximos arrivals de todas las líneas de colectivos en Mar del Plata.",
  },
  {
    icon: Zap,
    title: "Rápido y simple",
    description: "Sin registro, sin publicidad. Abrís, elegís y listo.",
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
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-[40px] flex-wrap text-balance font-black uppercase tracking-tighter mb-4 flex items-center justify-center gap-3">
            ¿Por qué usar <BrandLogo className="text-4xl lg:text-[40px]" />?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lo que opinan los usuarios que la usan todos los días.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-turquesa/50 transition-colors"
            >
              <div className="w-12 h-12 bg-amarillo/10 rounded-2xl flex items-center justify-center mb-4">
                <feature.icon
                  className="w-5 h-5 text-amarillo"
                  strokeWidth={2}
                />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
