"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useHistorial } from "@features/history/hooks/useHistorial";
import type { Favorito } from "@features/favorites/types";
import type { HistorialEntry } from "@features/history/types";
import { FavoritesList } from "@features/favorites/components/FavoritesList";
import { HistorialList } from "@features/history/components/HistorialList";
import { PageShell } from "@shared/layout/PageShell";
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
      const isValid = (v: unknown): v is string =>
        typeof v === "string" && v !== "" && v !== "undefined";

      // 1) Direct field
      let line = isValid(fav.codigoLineaParada)
        ? fav.codigoLineaParada
        : undefined;

      // 2) Extract from id (format: paradaId_codLinea)
      if (!line) {
        const fromId = fav.id.split("_")[1];
        if (isValid(fromId)) line = fromId;
      }

      // 3) Recover from lineaLabel / descripcionLinea via lineas metadata
      if (!line) {
        const label =
          fav.lineaLabel?.trim() || fav.descripcionLinea?.trim();
        if (label) line = descripcionToCode.get(label);
      }

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
    <PageShell>
      <div className="mb-6">
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.04em] text-text">
          Favoritos
        </h1>
      </div>
      <FavoritesList
        favoritos={favoritos}
        onView={fetchFavArribos}
        onRemove={removeFavoritoEntry}
        onUndoRemove={addFavorito}
        onRename={handleEditFavName}
        onGoToSearch={() => router.push("/consultar")}
      />
      <HistorialList
        historial={historial}
        onView={fetchHistEntry}
        onRemove={removeHistorialEntry}
        onUndoRemove={pushHistorialEntry}
        onClear={clearHistorialEntries}
      />
    </PageShell>
  );
}
