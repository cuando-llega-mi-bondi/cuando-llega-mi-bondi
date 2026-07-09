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
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";
import { useSearchFlowData } from "@features/search/context/SearchFlowContext";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { useUIStore } from "@shared/ui/store/useUIStore";

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
      if (!line) return; // Can't resolve – do nothing

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
    <PageShell wide>
      <PageHeader
        className="mb-6"
        title="Favoritos"
        subtitle="Paradas guardadas y consultas recientes"
      />
      {/* Desktop: favoritos (1/3) e historial (2/3, en dos columnas) */}
      <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
        <div>
          {/* Header simétrico al de "Consultas recientes" (solo desktop) */}
          <div className="mb-3 hidden min-h-[26px] items-center lg:flex">
            <div className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
              PARADAS GUARDADAS
            </div>
          </div>
          <FavoritesList
            favoritos={favoritos}
            onView={fetchFavArribos}
            onRemove={removeFavoritoEntry}
            onUndoRemove={addFavorito}
            onRename={handleEditFavName}
            onGoToSearch={() => router.push("/consultar")}
          />
        </div>
        <div className="lg:col-span-2">
          <HistorialList
            historial={historial}
            onView={fetchHistEntry}
            onRemove={removeHistorialEntry}
            onUndoRemove={pushHistorialEntry}
            onClear={clearHistorialEntries}
          />
        </div>
      </div>
    </PageShell>
  );
}
