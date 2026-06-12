"use client";

import { useMemo } from "react";
import { Sheet } from "react-modal-sheet";
import type { Itinerary, RouteLeg, RouteLegRide } from "@features/trip-planner/types";
import { cn } from "@shared/utils";

const RIDE_COLORS = ["#0ea5e9", "#a855f7", "#f59e0b", "#10b981"];

/** Estimates trip duration in minutes using walking and riding speed heuristics. */
function estimateItineraryMins(it: Itinerary): number {
    const walkSpeedMins = 70; // 70 meters per minute (approx 4.2 km/h)
    const busSpeedMins = 320; // 320 meters per minute (approx 19.2 km/h)

    const walkMins = it.totalWalkMeters / walkSpeedMins;
    const rideMins = it.totalRideMeters / busSpeedMins;

    // Boarding overhead: 3 mins per bus ride
    const overhead = it.totalRides * 3;

    return Math.round(walkMins + rideMins + overhead);
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
            "relative overflow-hidden font-sans font-extrabold flex items-center justify-center select-none shadow-sm rounded-lg shrink-0",
            isSm ? "h-6 px-1.5 text-[10px]" : "h-11 w-11 text-base",
            bg,
            text
        )}>
            <span className={isSm ? "mb-0" : "mb-0.5"}>{cleanLine}</span>
            {extra}
        </span>
    );
}

function LegBlock({ leg, rideColor }: { leg: RouteLeg; rideColor: string }) {
    if (leg.kind === "walk") {
        return (
            <div className="flex gap-3 items-center py-2.5 px-3 rounded-xl bg-muted/40 dark:bg-slate-800/40 text-sm text-foreground/80">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground shrink-0" aria-hidden>
                    <circle cx="12" cy="4" r="2" />
                    <path d="M12 7.5V13l-3 4M15 13l-1.5-4-1.5-1.5" />
                    <path d="M10 9.5l2-1.5 3 2.5" />
                </svg>
                <span>Caminá <strong className="font-bold">{leg.meters} m</strong></span>
            </div>
        );
    }
    const numParadas = leg.paradaIdsAlong.length - 1;
    const subi =
        leg.fromEsquinaLabel != null && leg.fromEsquinaLabel.length > 0
            ? `Subí en ${leg.fromEsquinaLabel}`
            : `Subí en parada ${leg.fromParadaId}`;
    const baja =
        leg.toEsquinaLabel != null && leg.toEsquinaLabel.length > 0
            ? `Bajate en ${leg.toEsquinaLabel}`
            : `Bajate después de ${numParadas} paradas`;

    return (
        <div
            className="flex gap-3 rounded-xl p-3 bg-muted/50 dark:bg-slate-850/50 border border-border/50"
            style={{ borderLeftColor: rideColor, borderLeftWidth: 4 }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: rideColor }} className="shrink-0 mt-0.5" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M4 9h16M9 13h6M8 4v5M16 4v5M6 20v2M18 20v2" />
                <circle cx="8" cy="16" r="1" />
                <circle cx="16" cy="16" r="1" />
            </svg>
            <div className="min-w-0 flex-1 text-xs text-foreground/80 space-y-1">
                <p className="font-bold text-sm text-foreground">
                    Tomá {leg.lineaLabel?.trim() || `Línea ${leg.codLinea}`}
                </p>
                {leg.ramalLabel?.trim() ? (
                    <p className="text-xs text-muted-foreground">Ramal {leg.ramalLabel}</p>
                ) : null}
                <div className="pt-1.5 mt-1 border-t border-border/40 space-y-0.5">
                    <p className="text-[11px]"><span className="text-emerald-500 font-bold mr-1">●</span> {subi}</p>
                    <p className="text-[11px]"><span className="text-red-500 font-bold mr-1">●</span> {baja} · {numParadas} paradas</p>
                </div>
            </div>
        </div>
    );
}

type TripResultsSheetProps = {
    itineraries: Itinerary[];
    selectedIdx: number;
    onSelect: (idx: number) => void;
    onNewTrip: () => void;
};

export function TripResultsSheet({
    itineraries,
    selectedIdx,
    onSelect,
    onNewTrip,
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
                            const rides = it.legs.filter((leg): leg is RouteLegRide => leg.kind === "ride");

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

                                    <div className="flex items-center gap-4">
                                        {/* Badges Block */}
                                        <div className="flex items-center shrink-0">
                                            {rides.length === 0 ? (
                                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold shadow-sm">
                                                    🚶
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    {rides.map((r, i) => (
                                                        <div key={i} className="flex items-center gap-1.5">
                                                            {i > 0 && <span className="text-xs font-bold text-muted-foreground/60">+</span>}
                                                            <LineBadge label={r.lineaLabel || r.codLinea} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Central Detail Info */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            {/* Summary icons row */}
                                            <div className="flex items-center gap-4 text-xs font-bold text-foreground/80">
                                                <span className="flex items-center gap-1">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
                                                        <rect x="4" y="4" width="16" height="16" rx="2" />
                                                        <path d="M4 9h16M9 13h6M8 4v5M16 4v5M6 20v2M18 20v2" />
                                                        <circle cx="8" cy="16" r="1" />
                                                        <circle cx="16" cy="16" r="1" />
                                                    </svg>
                                                    {it.totalRides === 0 ? "Solo caminata" : `${it.totalRides} bondi${it.totalRides === 1 ? "" : "s"}`}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground" aria-hidden>
                                                        <circle cx="12" cy="4" r="2" />
                                                        <path d="M12 7.5V13l-3 4M15 13l-1.5-4-1.5-1.5" />
                                                    </svg>
                                                    {it.totalWalkMeters >= 1000 ? `${(it.totalWalkMeters / 1000).toFixed(1)} km` : `${it.totalWalkMeters} m`}
                                                </span>
                                                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-extrabold">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-sky-500" aria-hidden>
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {estimateItineraryMins(it)} min
                                                </span>
                                            </div>

                                            {/* Sequence visual path */}
                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground font-medium">
                                                {it.legs.map((leg, i) => {
                                                    const isLast = i === it.legs.length - 1;
                                                    return (
                                                        <div key={i} className="flex items-center gap-1.5">
                                                            {leg.kind === "walk" ? (
                                                                <span>Caminá {leg.meters} m</span>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <span>Tomá</span>
                                                                    <LineBadge size="sm" label={leg.lineaLabel || leg.codLinea} />
                                                                </div>
                                                            )}
                                                            {!isLast && (
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-muted-foreground/30" aria-hidden>
                                                                    <polyline points="9 18 15 12 9 6" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Expand Right Chevron */}
                                        <div className="flex items-center shrink-0 text-muted-foreground/40 pl-1" aria-hidden>
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

                                    {/* Expanded Step Details */}
                                    {expanded && (
                                        <div className="mt-4 space-y-2 border-t border-border/40 pt-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                                            {it.legs.map((leg, i) => {
                                                const rideCountBefore = it.legs
                                                    .slice(0, i)
                                                    .filter((x) => x.kind === "ride").length;
                                                const color =
                                                    leg.kind === "ride"
                                                        ? RIDE_COLORS[rideCountBefore % RIDE_COLORS.length]!
                                                        : "#94a3b8";
                                                return <LegBlock key={i} leg={leg} rideColor={color} />;
                                            })}
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
