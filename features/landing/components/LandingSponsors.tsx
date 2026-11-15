"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { SPONSORS, type Sponsor } from "@features/sponsors/data/sponsors";
import { cn } from "@shared/utils";
import { LandingSection } from "./LandingSection";

// Fila sin caja: logo, nombre y bajada, separadas solo por la línea de la lista
function RowBody({
  mark,
  name,
  tagline,
}: {
  mark: ReactNode;
  name: string;
  tagline?: string;
}) {
  return (
    <>
      {/* Caja fija para el logo: los logos llegan con proporciones muy distintas */}
      {mark}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-foreground underline-offset-4 group-hover:underline">
          {name}
        </span>
        {tagline ? (
          <span className="mt-0.5 block text-sm text-muted-foreground sm:text-base">
            {tagline}
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        aria-hidden
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </>
  );
}

const ROW = "group flex items-center gap-6 py-6";

function SponsorRow({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={ROW}
    >
      <RowBody
        name={sponsor.name}
        tagline={sponsor.tagline}
        mark={
          <span
            // Logos centrados en la misma caja para que formen una columna pareja.
            // La placa sigue el tema del sitio (.dark), no el del sistema: con el
            // sistema oscuro y el sitio claro, dark: la sacaba y el logo quedaba blanco sobre blanco
            className={cn(
              "flex h-14 w-36 shrink-0 items-center justify-center",
              sponsor.logoOnDark &&
                "rounded-sm bg-foreground px-3 in-[.dark]:bg-transparent in-[.dark]:px-0",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); logo estático liviano */}
            <img
              src={sponsor.logo}
              alt=""
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </span>
        }
      />
    </a>
  );
}

export function LandingSponsors() {
  return (
    <LandingSection
      layout="split"
      title="Nos"
      highlight="acompañan."
      description="Empresas y comunidades locales que apoyan el proyecto para que siga siendo gratuito."
    >
      <ul role="list" className="divide-y divide-border border-y border-border">
        {SPONSORS.map((sponsor) => (
          <li key={sponsor.name}>
            <SponsorRow sponsor={sponsor} />
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
