// components/SocialTestimonials.tsx
"use client";

import { Star } from "lucide-react";
import { LandingSection } from "./LandingSection";

const socialTestimonials = [
  {
    avatar: "./assets/01.jpg",
    user: "Luigi",
    handle: "@luigicanoro",
    platform: "Star",
    quote: "Cracks totales! Orgullo de la comunidad @mardelplata.dev.ar",
    Icon: Star,
  },
  {
    avatar: "./assets/02.jpg",
    user: "Jonatan Leonardo",
    handle: "@jonimdp",
    platform: "Star",
    quote:
      "Ohh está joyaaa le vas haciendo el seguimiento en el mapita búsquenla en Google por bondimdp.com.ar",
    Icon: Star,
  },
  {
    avatar: "./assets/03.jpg",
    user: "Mónica Castellini",
    handle: "@beacastel2015",
    platform: "Star",
    quote:
      "Era muy necesaria! Una idea muy inteligente para los que padecemos tener que utilizar los colectivos de Mar del Plata.",
    Icon: Star,
  },
];

export function SocialTestimonials() {
  return (
    <LandingSection
      title="Lo que dice la"
      highlight="gente"
      description="La forma más simple de consultar cuándo llega tu colectivo"
      className="max-w-7xl mx-auto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        {socialTestimonials.map((item, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-[1.5rem] p-6 hover:shadow-md transition-shadow relative"
          >
            <div className="absolute top-6 right-6 text-muted-foreground/30">
              <item.Icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={item.avatar}
                alt={item.user}
                className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
              />
              <div>
                <div className="font-bold text-foreground text-[15px]">
                  {item.user}
                </div>
                <div className="text-[13px] text-muted-foreground font-medium">
                  {item.handle}
                </div>
              </div>
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              &quot;{item.quote}&quot;
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
