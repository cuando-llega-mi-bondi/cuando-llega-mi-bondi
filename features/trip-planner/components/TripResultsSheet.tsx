"use client";

import { useMemo } from "react";
import { Sheet } from "react-modal-sheet";
import type { Itinerary, RouteLegRide, RouteLegWalk } from "@features/trip-planner/types";
import { estimateLegMins } from "@features/trip-planner/lib/costModel";
import { RIDE_COLORS } from "@features/trip-planner/lib/rideColors";
import { cn } from "@shared/utils";

function formatArrivalTime(minsFromNow: number): string {
    return new Date(Date.now() + minsFromNow * 60_000).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatWalkDistance(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function IconWalk({ size = 14, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className} aria-hidden>
            <circle cx="12" cy="4" r="2" />
            <path d="M12 7.5V13l-3 4M15 13l-1.5-4-1.5-1.5" />
            <path d="M10 9.5l2-1.5 3 2.5" />
        </svg>
    );
}

function SeqArrow() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-muted-foreground/30" aria-hidden>
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

/** Renders a custom badge for Mar del Plata lines based on official colors/brand styling. */
function LineBadge({ label, size = "md" }: { label: string; size?: "sm" | "md" }) {
    const cleanLine = label.trim();
    let bg = "bg-sky-600";
    const text = "text-white";
    let extra = null;

    if (cleanLine.startsWith("511")) {
        bg = "bg-[#104cd3]";
        extra = (
            <div className="absolute bottom-0 left-0 right-0 h-1 flex rounded-b overflow-hidden" aria-hidden>
                <span className="flex-1 bg-[#fbbf24]" />
                <span className="flex-1 bg-[#ef4444]" />
                <span className="flex-1 bg-[#10b981]" />
            </div>
        );
    } else if (cleanLine.startsWith("581")) {
        bg = "bg-[#6b21a8]"; // Purple / violet
    } else if (cleanLine.startsWith("512")) {
        bg = "bg-[#047857]"; // Green
    } else if (cleanLine.startsWith("221")) {
        bg = "bg-[#ea580c]"; // Orange
    } else if (cleanLine.startsWith("542")) {
        bg = "bg-[#0d9488]"; // Teal
    } else {
        bg = "bg-sky-700";
    }

    const isSm = size === "sm";

    return (
        <span className={cn(
            "relative overflow-hidden font-sans font-extrabold flex items-center justify-center select-none shadow-sm shrink-0",
            isSm ? "h-7 min-w-7 rounded-md px-1.5 text-[11px]" : "h-9 min-w-9 rounded-lg px-2 text-sm",
            bg,
            text
        )}>
            <span className="mb-0.5">{cleanLine}</span>
            {extra}
        </span>
    );
}

/*
 * Timeline vertical del detalle: cada fila reserva `pl-8` de canaletera y los
 * marcadores absolutos se centran en x=10px para que la línea sea continua.
 */

function TimelinePoint({ dotClass, label }: { dotClass: string; label: string }) {
    return (
        <div className="relative py-1 pl-8">
            <span className={cn("absolute left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full", dotClass)} aria-hidden />
            <p className="truncate text-sm font-bold text-foreground">{label}</p>
        </div>
    );
}

function TimelineWalk({ leg, mins }: { leg: RouteLegWalk; mins: number }) {
    return (
        <div className="relative py-3.5 pl-8">
            <span className="absolute bottom-0 left-[9px] top-0 border-l-2 border-dashed border-muted-foreground/40" aria-hidden />
            <p className="flex items-center gap-1.5 text-xs text-foreground/80">
                <IconWalk className="shrink-0 text-muted-foreground" />
                <span>
                    Caminá <strong className="font-bold">{leg.meters} m</strong> · {mins} min
                </span>
            </p>
        </div>
    );
}

function TimelineRide({ leg, mins, rideColor }: { leg: RouteLegRide; mins: number; rideColor: string }) {
    const numParadas = Math.max(1, leg.paradaIdsAlong.length - 1);
    const subi = leg.fromEsquinaLabel?.trim()
        ? `Subí en ${leg.fromEsquinaLabel}`
        : `Subí en la parada ${leg.fromParadaId}`;
    const baja = leg.toEsquinaLabel?.trim()
        ? `Bajate en ${leg.toEsquinaLabel}`
        : `Bajate en la parada ${leg.toParadaId}`;

    return (
        <div className="relative py-1 pl-8">
            <span className="absolute bottom-3 left-2 top-3 w-1 rounded-full" style={{ backgroundColor: rideColor }} aria-hidden />
            <span className="absolute left-1 top-1.5 h-3 w-3 rounded-full border-[3px] bg-card" style={{ borderColor: rideColor }} aria-hidden />
            <span className="absolute bottom-1.5 left-1 h-3 w-3 rounded-full border-[3px] bg-card" style={{ borderColor: rideColor }} aria-hidden />

            <p className="text-sm font-bold leading-tight text-foreground">{subi}</p>
            <div className="my-2 flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5 dark:bg-slate-800/40">
                <LineBadge label={leg.lineaLabel?.trim() || leg.codLinea} />
                <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">
                        Tomá {leg.lineaLabel?.trim() || `Línea ${leg.codLinea}`}
                        {leg.ramalLabel?.trim() ? (
                            <span className="font-medium text-muted-foreground"> · Ramal {leg.ramalLabel}</span>
                        ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {numParadas} {numParadas === 1 ? "parada" : "paradas"} · ~{mins} min
                    </p>
                </div>
            </div>
            <p className="text-sm font-bold leading-tight text-foreground">{baja}</p>
        </div>
    );
}

type TripResultsSheetProps = {
    itineraries: Itinerary[];
    selectedIdx: number;
    onSelect: (idx: number) => void;
    onNewTrip: () => void;
    originLabel?: string;
    destLabel?: string;
};

export function TripResultsSheet({
    itineraries,
    selectedIdx,
    onSelect,
    onNewTrip,
    originLabel,
    destLabel,
}: TripResultsSheetProps) {
    const uses221Selected = useMemo(() => {
        const it = itineraries[selectedIdx];
        if (!it) return false;
        return it.legs.some((l) => l.kind === "ride" && l.codLinea === "221");
    }, [itineraries, selectedIdx]);

    return (
        <Sheet
            isOpen={itineraries.length > 0}
            onClose={() => undefined}
            snapPoints={[0, 0.22, 0.5, 1]}
            initialSnap={1}
            disableDismiss
            disableScrollLocking
        >
            <Sheet.Container className="px-4 pb-safe-area-bottom">
                <Sheet.Header className="text-foreground">
                    <div className="flex h-9 w-full items-center justify-center pb-2 pt-1">
                        <Sheet.DragIndicator />
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <span className="text-base font-bold text-foreground">
                            {itineraries.length} {itineraries.length === 1 ? "opción de viaje" : "opciones de viaje"}
                        </span>
                        <button
                            type="button"
                            className="rounded-full bg-sky-50 dark:bg-sky-950/40 px-3.5 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors"
                            onClick={onNewTrip}
                        >
                            Nuevo viaje +
                        </button>
                    </div>
                </Sheet.Header>
                <Sheet.Content
                    disableDrag={(state) => state.scrollPosition !== "top"}
                    disableScroll={(state) => state.currentSnap !== 3}
                >
                    {uses221Selected ? (
                        <p className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                            Esta opción incluye la línea interurbana <strong className="font-bold">221 Costa Azul</strong>.
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        {itineraries.map((it, idx) => {
                            const expanded = idx === selectedIdx;
                            const legMins = estimateLegMins(it);
                            const totalMins = legMins.reduce((a, b) => a + b, 0);
                            const firstRide = it.legs.find(
                                (leg): leg is RouteLegRide => leg.kind === "ride",
                            );
                            const boardingLabel = firstRide
                                ? firstRide.fromEsquinaLabel?.trim() || `parada ${firstRide.fromParadaId}`
                                : null;

                            return (
                                <div
                                    key={`it-${idx}`}
                                    role="button"
                                    tabIndex={0}
                                    className={cn(
                                        "w-full rounded-2xl border p-4 text-left transition-all cursor-pointer select-none",
                                        expanded
                                            ? "border-emerald-500/50 bg-emerald-50/15 dark:bg-emerald-950/5 ring-1 ring-emerald-500/30"
                                            : "border-border bg-card hover:bg-muted/40 dark:hover:bg-muted/10 shadow-sm",
                                    )}
                                    onClick={() => onSelect(idx)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            onSelect(idx);
                                        }
                                    }}
                                >
                                    {/* Recommended Badge */}
                                    {idx === 0 && (
                                        <div className="mb-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 w-fit px-2 py-0.5 rounded-md border border-emerald-500/10">
                                            <span>★</span>
                                            <span>Recomendada</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        {/* Secuencia de tramos con minutos */}
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                                                {it.legs.map((leg, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        {i > 0 && <SeqArrow />}
                                                        {leg.kind === "walk" ? (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                                <IconWalk size={15} />
                                                                <span className="text-[11px] font-bold">{legMins[i]}′</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <LineBadge size="sm" label={leg.lineaLabel || leg.codLinea} />
                                                                <span className="text-[11px] font-bold text-muted-foreground">{legMins[i]}′</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {boardingLabel ? (
                                                    <>
                                                        Subí en{" "}
                                                        <span className="font-semibold text-foreground/85">{boardingLabel}</span>
                                                        {" · "}
                                                    </>
                                                ) : (
                                                    "Solo caminata · "
                                                )}
                                                {formatWalkDistance(it.totalWalkMeters)} a pie
                                            </p>
                                        </div>

                                        {/* Tiempo total + hora de llegada */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-xl font-black leading-none text-foreground">
                                                {totalMins}
                                                <span className="ml-0.5 text-xs font-bold text-muted-foreground">min</span>
                                            </p>
                                            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                                                Llegás ~{formatArrivalTime(totalMins)}
                                            </p>
                                        </div>

                                        {/* Expand Right Chevron */}
                                        <div className="flex items-center shrink-0 text-muted-foreground/40" aria-hidden>
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                className={cn("transition-transform duration-200", expanded && "rotate-90 text-emerald-500")}
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Detalle expandido: timeline vertical */}
                                    {expanded && (
                                        <div
                                            className="mt-4 cursor-default border-t border-border/40 pt-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TimelinePoint
                                                dotClass="bg-blue-500 ring-4 ring-blue-500/25"
                                                label={originLabel?.trim() || "Origen"}
                                            />
                                            {it.legs.map((leg, i) => {
                                                if (leg.kind === "walk") {
                                                    return <TimelineWalk key={i} leg={leg} mins={legMins[i]!} />;
                                                }
                                                const rideCountBefore = it.legs
                                                    .slice(0, i)
                                                    .filter((x) => x.kind === "ride").length;
                                                return (
                                                    <TimelineRide
                                                        key={i}
                                                        leg={leg}
                                                        mins={legMins[i]!}
                                                        rideColor={RIDE_COLORS[rideCountBefore % RIDE_COLORS.length]!}
                                                    />
                                                );
                                            })}
                                            <TimelinePoint
                                                dotClass="bg-red-500 ring-4 ring-red-500/25"
                                                label={destLabel?.trim() || "Tu destino"}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Caption Footer */}
                        <p className="text-center text-[10px] text-muted-foreground/60 mt-4 leading-relaxed max-w-xs mx-auto">
                            Tiempos estimados según el tránsito y horarios del transporte público. Datos de recorridos: Google Maps.
                        </p>
                    </div>
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop />
        </Sheet>
    );
}
