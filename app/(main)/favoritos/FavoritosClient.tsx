"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useHistorial } from "@features/history/hooks/useHistorial";
import type { Favorito } from "@features/favorites/types";
import type { HistorialEntry } from "@features/history/types";
import { FavoritesList } from "@features/favorites/components/FavoritesList";
import { resolveFavoritoLinea } from "@features/favorites/resolveFavoritoLinea";
import { HistorialList } from "@features/history/components/HistorialList";
import { PageHeader } from "@shared/layout/PageHeader";
import { useSearchFlowData } from "@features/search/context/SearchFlowContext";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { useUIStore } from "@shared/ui/store/useUIStore";
import { AdSenseRail } from "@shared/ads/AdSenseUnit";

const ADSENSE_SLOT_FAVORITOS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FAVORITOS?.trim();

export function FavoritosClient() {
  const router = useRouter();
  const { lineas } = useSearchFlowData();
  const resetToParada = useSearchFlowStore((s) => s.resetToParada);
  const setNamingModal = useUIStore((state) => state.setNamingModal);

  const {
    favoritos,
    addFavorito,
    removeFavorito: removeFavoritoEntry,
  } = useFavoritos();

  const {
    historial,
    pushHistorialEntry,
    removeHistorialEntry,
    clearHistorialEntries,
  } = useHistorial();

  const handleEditFavName = useCallback(
    (fav: Favorito) => setNamingModal({ open: true, mode: "edit", fav }),
    [setNamingModal],
  );

  /** Build a quick lookup: Descripcion → CodigoLineaParada */
  const descripcionToCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of lineas) {
      const desc = (l.Descripcion ?? "").trim();
      if (desc) map.set(desc, l.CodigoLineaParada);
    }
    return map;
  }, [lineas]);

  const fetchFavArribos = useCallback(
    (fav: Favorito) => {
      const line = resolveFavoritoLinea(fav, descripcionToCode);
      if (!line) return;

      resetToParada(fav.identificadorParada, line, {
        consulting: true,
      });
    },
    [resetToParada, descripcionToCode],
  );

  const fetchHistEntry = useCallback(
    (entry: HistorialEntry) => {
      let line = entry.codLinea;
      if (!line || line === "undefined") {
        const label =
          entry.lineaLabel?.trim() || entry.descripcionLinea?.trim();
        if (label) line = descripcionToCode.get(label) || "";
      }
      if (!line || line === "undefined") return;
      resetToParada(entry.paradaId, line, { consulting: true });
    },
    [resetToParada, descripcionToCode],
  );

  return (
    <div className="flex flex-col">
      <div className="mb-4 lg:hidden">
        <PageHeader
          title="Favoritos"
          subtitle="Paradas guardadas y consultas recientes"
        />
      </div>
      <div>
        <div className="mb-3 flex min-h-[26px] items-center">
          <div className="font-mono text-xs font-semibold tracking-[1.4px] text-muted-foreground">
            PARADAS GUARDADAS
          </div>
        </div>
        <FavoritesList
          favoritos={favoritos}
          onView={fetchFavArribos}
          onRemove={removeFavoritoEntry}
          onUndoRemove={addFavorito}
          onRename={handleEditFavName}
          onGoToSearch={() => router.push("/")}
        />
        <AdSenseRail slot={ADSENSE_SLOT_FAVORITOS} className="mt-6" />
      </div>
      <HistorialList
        historial={historial}
        onView={fetchHistEntry}
        onRemove={removeHistorialEntry}
        onUndoRemove={pushHistorialEntry}
        onClear={clearHistorialEntries}
      />
    </div>
  );
}
