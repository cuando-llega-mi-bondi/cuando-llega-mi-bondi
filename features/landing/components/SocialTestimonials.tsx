// components/SocialTestimonials.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { Quote, Star } from "lucide-react";
import { LandingSection } from "./LandingSection";

const socialTestimonials = [
  {
    avatar: "/assets/01.jpg",
    user: "Luigi",
    handle: "@luigicanoro",
    quote: "Cracks totales! Orgullo de la comunidad @mardelplata.dev.ar",
  },
  {
    avatar: "/assets/02.jpg",
    user: "Jonatan Leonardo",
    handle: "@jonimdp",
    quote:
      "Ohh está joyaaa le vas haciendo el seguimiento en el mapita búsquenla en Google por bondimdp.com.ar",
  },
  {
    avatar: "/assets/03.jpg",
    user: "Mónica Castellini",
    handle: "@beacastel2015",
    quote:
      "Era muy necesaria! Una idea muy inteligente para los que padecemos tener que utilizar los colectivos de Mar del Plata.",
  },
];

function TestimonialCard({ item }: { item: (typeof socialTestimonials)[number] }) {
  return (
    <div className="relative flex w-[360px] shrink-0 flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-amarillo/40">
      <Quote className="absolute right-6 top-6 h-7 w-7 text-amarillo/20" />

      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amarillo text-amarillo" />
        ))}
      </div>

      <p className="mb-6 flex-1 text-[15px] leading-relaxed text-foreground/90">
        &quot;{item.quote}&quot;
      </p>

      <div className="flex items-center gap-3">
        <img
          src={item.avatar}
          alt={item.user}
          className="h-11 w-11 rounded-full border-2 border-border object-cover"
        />
        <div>
          <div className="text-[15px] font-bold text-foreground">{item.user}</div>
          <div className="text-[13px] font-medium text-muted-foreground">{item.handle}</div>
        </div>
      </div>
    </div>
  );
}

export function SocialTestimonials() {
  return (
    <LandingSection
      eyebrow="Comunidad"
      title="Lo que dice la"
      highlight="gente"
      description="Lo que opinan los usuarios que la usan todos los días."
    >
      {/* Cinta sin fin en vez de grilla estática — el contenido se duplica una
          vez así el loop es continuo, sin salto al reiniciar. Se pausa al
          pasar el mouse para poder leer, y respeta prefers-reduced-motion
          (definido en globals.css junto al resto de las animaciones de ruta). */}
      <div
        className="relative -mx-8 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="animate-marquee flex w-max gap-6 px-8 hover:[animation-play-state:paused]">
          {[...socialTestimonials, ...socialTestimonials].map((item, i) => (
            <TestimonialCard key={`${item.handle}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
