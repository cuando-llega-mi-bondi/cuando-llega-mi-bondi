"use client";

import { isFavorito } from "@/lib/storage/favoritos";
import type { Arribo } from "@/lib/types";
import { getArriboColor, formatDesvio } from "@/lib/utils";
import { IconStar } from "./icons/IconStar";
import { IconWheelchair } from "./icons/IconWheelchair";
import { IconClock } from "./icons/IconClock";
import { cn } from "@/lib/utils";

export function ArriboCard({
  arribo,
  onFav,
  favId,
}: {
  arribo: Arribo;
  onFav: () => void;
  favId: string;
}) {
  const color = getArriboColor(arribo.Arribo);
  const desvio = formatDesvio(arribo.DesvioHorario);
  const fav = isFavorito(favId);
  const isAdaptado = arribo.EsAdaptado === "True";

  const arriboColorClass =
    color === "#22c55e"
      ? "text-success"
      : color === "#0099ff"
        ? "text-secondary"
        : "text-foreground";

  return (
    <div className="arrival-row arrival-card flex flex-col gap-3">
      <div className="flex items-center gap-3.5">
        <div className="min-w-16 flex-shrink-0 rounded-full border border-border bg-muted px-3 py-1.5 text-center font-display text-[22px] font-medium tracking-tight text-foreground shadow-sm">
          {arribo.DescripcionLinea}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-sans text-[12px] font-medium tracking-[0.02em] text-muted-foreground">
            {(
              arribo.DescripcionCartelBandera ??
              arribo.DescripcionBandera ??
              ""
            ).toUpperCase()}
          </div>
          <div
            className={cn(
              "font-mono text-[22px] font-extrabold leading-[1.1] tracking-[-0.5px]",
              arriboColorClass,
            )}
          >
            {arribo.Arribo}
          </div>
          {isAdaptado && (
            <div className="inline-flex items-center gap-1 rounded border border-border px-1 py-[1px] text-[8px] text-muted-foreground">
              <IconWheelchair /> ADAPTADO
            </div>
          )}
        </div>

        <button
          onClick={onFav}
          className={cn(
            "cursor-pointer rounded-full border border-border bg-card p-2 transition-transform duration-150 hover:scale-110 hover:border-secondary",
            fav ? "text-secondary" : "text-muted-foreground",
          )}
          title={fav ? "Quitar favorito" : "Guardar favorito"}
        >
          <IconStar filled={fav} />
        </button>
      </div>
    </div>
  );
}
