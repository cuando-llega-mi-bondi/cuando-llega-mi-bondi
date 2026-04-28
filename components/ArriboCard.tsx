"use client";

import { isFavorito } from "@/lib/storage/favoritos";
import type { Arribo } from "@/lib/types";
import { getArriboColor, formatDesvio } from "@/lib/utils";
import { IconStar } from "./icons/IconStar";
import { IconWheelchair } from "./icons/IconWheelchair";
import { IconUser } from "./icons/IconUser";
import { IconClock } from "./icons/IconClock";
import { cn } from "@/lib/utils";

export function ArriboCard({ arribo, onFav, favId }: { arribo: Arribo; onFav: () => void; favId: string }) {
    const color = getArriboColor(arribo.Arribo);
    const desvio = formatDesvio(arribo.DesvioHorario);
    const fav = isFavorito(favId);
    const isAdaptado = arribo.EsAdaptado === "True";

    const arriboColorClass =
        color === "#22c55e"
            ? "text-success"
            : color === "#f5a623"
              ? "text-accent"
              : "text-text";

    return (
        <div className="arrival-row flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3.5">
                <div className="min-w-16 flex-shrink-0 rounded-lg bg-accent px-3 py-1.5 text-center font-display text-[22px] font-black tracking-[1px] text-black shadow-[0_2px_8px_rgba(245,166,35,0.4)]">
                    {arribo.DescripcionLinea}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 font-display text-[13px] font-bold tracking-[0.5px] text-text-dim">
                        {arribo.DescripcionCartelBandera.toUpperCase()}
                    </div>
                    <div
                        className={cn(
                            "font-mono text-[22px] font-extrabold leading-[1.1] tracking-[-0.5px]",
                            arriboColorClass,
                        )}
                    >
                        {arribo.Arribo}
                    </div>
                </div>

                <button
                    onClick={onFav}
                    className={cn(
                        "cursor-pointer bg-transparent p-2 transition-transform duration-150 hover:scale-110",
                        fav ? "text-accent" : "text-text-muted",
                    )}
                    title={fav ? "Quitar favorito" : "Guardar favorito"}
                >
                    <IconStar filled={fav} />
                </button>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-dim">
                        <span className="font-bold text-accent">
                            INTERNO {arribo.IdentificadorCoche}
                        </span>
                        {isAdaptado && (
                            <div className="flex items-center gap-1 rounded border border-blue-400 px-1 py-[1px] text-[8px] text-blue-400">
                                <IconWheelchair /> ADAPTADO
                            </div>
                        )}
                    </div>
                    {arribo.IdentificadorChofer && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
                            <IconUser /> {arribo.IdentificadorChofer}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1 text-right">
                    {desvio && (
                        <div
                            className={cn(
                                "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                                desvio.isEarly
                                    ? "border border-success/35 bg-success/15 text-success"
                                    : "border border-danger/35 bg-danger/15 text-danger",
                            )}
                        >
                            {desvio.label} {desvio.isEarly ? "ADELANTADO" : "ATRASADO"}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                        <IconClock /> GPS: {arribo.UltimaFechaHoraGPS.split(" ")[1]}
                    </div>
                </div>
            </div>
        </div>
    );
}
