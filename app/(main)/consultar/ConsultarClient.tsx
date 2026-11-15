"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@shared/utils";

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

export function ConsultarClient({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col">
      {children}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          href="/paradas-cerca"
          className={cn(
            "btn-pill btn-secondary inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-xs font-bold tracking-tight",
          )}
        >
          <IconLocation />
          Paradas cerca mío
        </Link>
        <Link
          href="/como-llego"
          className={cn(
            "btn-pill btn-secondary inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-xs font-bold tracking-tight",
          )}
        >
          <IconRoute />
          Cómo llego
        </Link>
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
