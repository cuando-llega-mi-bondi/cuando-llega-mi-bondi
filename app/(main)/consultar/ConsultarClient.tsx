"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SearchFlow } from "@features/search/components/SearchFlow";
import { FavoritosQuickList } from "@features/favorites/components/FavoritosQuickList";
import { SponsorSlot } from "@features/sponsors/components/SponsorSlot";
import { AdSenseRail } from "@shared/ads/AdSenseUnit";
import { IconLocation } from "@shared/icons/IconLocation";

/** Una sola unidad en el DOM (mobile + desktop). Vacío = no se muestra. */
const ADSENSE_SLOT_CONSULTAR = process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONSULTAR?.trim();

/** Directions / route icon (signpost style) */
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

// Tarjeta con contorno: título grande arriba, bajada abajo a la izquierda y el ícono
// en un círculo de acento abajo a la derecha
function QuickAction({
  href,
  title,
  caption,
  icon,
}: {
  href: string;
  title: ReactNode;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-32 flex-col justify-between gap-4 rounded-[20px] border border-border p-4 no-underline transition-[border-color,transform] duration-150 hover:border-secondary active:scale-[0.98]"
    >
      <span className="font-display text-[22px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
        {title}
      </span>
      <span className="flex items-end justify-between gap-2">
        <span className="text-xs leading-snug text-muted-foreground">{caption}</span>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform duration-150 group-hover:-rotate-12"
        >
          {icon}
        </span>
      </span>
    </Link>
  );
}

export function ConsultarClient({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col">
      {children}
      {/* El espacio antes del <br /> mantiene "Paradas cerca mío" entero en el nombre accesible */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <QuickAction
          href="/paradas-cerca"
          title={<>Paradas{" "}<br />cerca mío</>}
          caption="Con tu GPS"
          icon={<IconLocation />}
        />
        <QuickAction
          href="/como-llego"
          title={<>Cómo{" "}<br />llego</>}
          caption="A tu destino"
          icon={<IconRoute />}
        />
      </div>

      <SearchFlow loadingArribos={false} />
      <FavoritosQuickList className="mt-6 hidden lg:block" />

      {/* Una sola unidad AdSense (no duplicar dentro de SponsorSlot). */}
      <AdSenseRail slot={ADSENSE_SLOT_CONSULTAR} className="mt-6" />
      <div className="hidden lg:block">
        <SponsorSlot />
      </div>
    </div>
  );
}
