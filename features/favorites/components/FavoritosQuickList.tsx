"use client";

import { useMemo } from "react";
import Link from "next/link";
import { IconStar } from "@shared/icons/IconStar";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { resolveFavoritoLinea } from "@features/favorites/resolveFavoritoLinea";
import { useSearchFlowData } from "@features/search/context/SearchFlowContext";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { cn } from "@shared/utils";

const MAX_ITEMS = 4;

/**
 * Accesos rápidos a favoritos bajo el formulario de /consultar (desktop):
 * un click re-consulta la parada guardada sin pasar por los 5 pasos.
 */
export function FavoritosQuickList({ className }: { className?: string }) {
  const { favoritos } = useFavoritos();
  const { lineas } = useSearchFlowData();
  const resetToParada = useSearchFlowStore((s) => s.resetToParada);

  const descripcionToCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of lineas) {
      const desc = (l.Descripcion ?? "").trim();
      if (desc) map.set(desc, l.CodigoLineaParada);
    }
    return map;
  }, [lineas]);

  if (favoritos.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          TUS FAVORITOS
        </span>
        <Link
          href="/favoritos"
          className="text-[12px] font-medium text-secondary transition-colors hover:text-foreground"
        >
          Ver todos
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {favoritos.slice(0, MAX_ITEMS).map((fav) => {
          const linea = resolveFavoritoLinea(fav, descripcionToCode);
          const lineaLabel =
            fav.lineaLabel?.trim() || fav.descripcionLinea?.trim() || "?";
          return (
            <button
              key={fav.id}
              type="button"
              disabled={!linea}
              onClick={() => {
                if (!linea) return;
                resetToParada(fav.identificadorParada, linea, {
                  consulting: true,
                });
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-secondary/50",
                !linea && "cursor-default opacity-50",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[12px] font-bold text-primary-foreground">
                {lineaLabel}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {fav.nombre}
              </span>
              <IconStar filled width={14} height={14} className="shrink-0 text-amarillo" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
