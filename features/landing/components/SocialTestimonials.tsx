/* eslint-disable @next/next/no-img-element */
"use client";

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
] as const;

export function SocialTestimonials() {
  return (
    <LandingSection
      title="Lo que dice"
      highlight="la comunidad."
    >
      {/* Las citas son el contenido: tipografía grande y una sola línea de separación, sin tarjetas */}
      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {socialTestimonials.map((item) => (
          <figure
            key={item.handle}
            className="flex flex-col justify-between gap-8 border-t-2 border-secondary pt-6"
          >
            <blockquote className="text-balance text-lg font-semibold leading-snug tracking-[-0.01em] text-foreground xl:text-xl">
              &ldquo;{item.quote}&rdquo;
            </blockquote>

            <figcaption className="flex items-center gap-3">
              <img
                src={item.avatar}
                alt={item.user}
                loading="lazy"
                decoding="async"
                className="h-10 w-10 rounded-full border border-border object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-foreground">
                  {item.user}
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {item.handle}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </LandingSection>
  );
}
