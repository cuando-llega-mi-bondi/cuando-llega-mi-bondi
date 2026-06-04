"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchFlowContext } from "@features/search/context/SearchFlowContext";
import { cn } from "@shared/utils";

import { NearStopsSheet } from "@features/search/components/NearStopsSheet";
import { SearchFlow } from "@features/search/components/SearchFlow";
import { PageShell } from "@shared/layout/PageShell";
import { Button } from "@shared/ui/Button";
import { IconLocation } from "@shared/icons/IconLocation";

/** Directions / route icon (signpost style) */
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export function ConsultarClient({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const { actions, meta } = useSearchFlowContext();
  const [nearStopsOpen, setNearStopsOpen] = useState(false);

  const { lineas } = meta;
  const { resetToParada } = actions;

  const handleNearPickLinea = useCallback(
    (pickedParadaId: string, pickedCodLinea: string) => {
      const line = lineas.find((l) => l.CodigoLineaParada === pickedCodLinea);
      if (line?.isManual) {
        router.push(`/recorrido?linea=${encodeURIComponent(pickedCodLinea)}`);
        return;
      }
      resetToParada(pickedParadaId, pickedCodLinea, { consulting: true });
    },
    [lineas, router, resetToParada],
  );

  return (
    <>
      <PageShell>
        {children}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full text-xs font-bold"
            onClick={() => setNearStopsOpen(true)}
            leftIcon={<IconLocation />}
          >
            Paradas cerca mío
          </Button>
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
      </PageShell>

      <NearStopsSheet
        open={nearStopsOpen}
        onClose={() => setNearStopsOpen(false)}
        onPickLinea={handleNearPickLinea}
      />
    </>
  );
}
