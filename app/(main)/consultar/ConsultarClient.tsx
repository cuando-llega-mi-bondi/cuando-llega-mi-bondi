"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@shared/utils";

import { SearchFlow } from "@features/search/components/SearchFlow";
import { FavoritosQuickList } from "@features/favorites/components/FavoritosQuickList";
import { SponsorSlot } from "@features/sponsors/components/SponsorSlot";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";
import { Footer } from "@shared/layout/Footer";
import { IconLocation } from "@shared/icons/IconLocation";
import { ConsultarMapPane } from "./ConsultarMapPane";

/** Directions / route icon (signpost style) */
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export function ConsultarClient({ children }: { children?: ReactNode }) {
  return (
    <PageShell fluid>
      {children}
      {/* Header de continuidad — solo desktop: en mobile el espacio es del form. */}
      <div className="hidden lg:mb-6 lg:block">
        <PageHeader
          as="h2"
          title="Consultar"
          highlight="arribos"
          subtitle="Tu parada en tiempo real · Mar del Plata"
        />
      </div>
      {/* Desktop: dos columnas — formulario a la izquierda, mapa persistente a la
          derecha. Todas las clases nuevas son lg: → el markup mobile no cambia. */}
      <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6">
        <div className="lg:flex lg:w-[440px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:pr-1 lg:pb-2">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Link
              href="/paradas-cerca"
              className={cn(
                "btn-pill btn-secondary inline-flex min-h-9 w-full items-center justify-center gap-2 px-3 text-xs font-bold tracking-tight",
              )}
            >
              <IconLocation />
              Paradas cerca mío
            </Link>
            <Link
              href="/como-llego"
              className={cn(
                "btn-pill btn-secondary inline-flex min-h-9 w-full items-center justify-center gap-2 px-3 text-xs font-bold tracking-tight",
              )}
            >
              <IconRoute />
              Cómo llego
            </Link>
          </div>
          <SearchFlow loadingArribos={false} />
          <FavoritosQuickList className="mt-6 hidden lg:block" />
          <SponsorSlot />
        </div>

        <div className="hidden lg:relative lg:block lg:min-w-0 lg:flex-1 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-muted">
          <ConsultarMapPane />
        </div>
      </div>
      {/* Solo mobile: en desktop el layout fluid queda a altura fija (dvh) sin scroll de página.
          mt-10 extra (Footer ya trae pt-4 propio) para que se lea como quiebre de sección
          después de publicidad, no una continuación del mismo ritmo. */}
      <div className="mt-10 lg:hidden">
        <Footer />
      </div>
    </PageShell>
  );
}
