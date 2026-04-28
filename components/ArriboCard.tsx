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
            : color === "#0099ff"
              ? "text-accent"
              : "text-text";

    return (
        <div className="arrival-row flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px,0_10px_24px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3.5">
                <div className="min-w-16 flex-shrink-0 rounded-full border border-accent/45 bg-accent/18 px-3 py-1.5 text-center font-display text-[22px] font-semibold tracking-[-0.03em] text-accent shadow-[0_2px_10px_rgba(0,153,255,0.35)]">
                    {arribo.DescripcionLinea}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 font-sans text-[12px] font-medium tracking-[0.02em] text-text-dim">
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
                        "cursor-pointer rounded-full border border-white/10 bg-white/5 p-2 transition-transform duration-150 hover:scale-110 hover:border-white/20",
                        fav ? "text-accent" : "text-text-muted",
                    )}
                    title={fav ? "Quitar favorito" : "Guardar favorito"}
                >
                    <IconStar filled={fav} />
                </button>
            </div>

            <div className="h-px bg-white/8" />

            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-dim">
                        <span className="font-bold text-accent">
                            INTERNO {arribo.IdentificadorCoche}
                        </span>
                        {isAdaptado && (
                            <div className="flex items-center gap-1 rounded border border-accent/55 px-1 py-[1px] text-[8px] text-accent">
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
