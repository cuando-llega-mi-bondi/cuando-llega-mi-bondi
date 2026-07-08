"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@shared/utils";

import { SearchFlow } from "@features/search/components/SearchFlow";
import { PageShell } from "@shared/layout/PageShell";
import { IconLocation } from "@shared/icons/IconLocation";

/** Directions / route icon (signpost style) */
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export function ConsultarClient({ children }: { children?: ReactNode }) {
  return (
    <PageShell>
      {children}
      {/* Desktop: columna de formulario centrada, más cómoda que el shell completo */}
      <div className="lg:mx-auto lg:max-w-xl">
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
      </div>
    </PageShell>
  );
}
