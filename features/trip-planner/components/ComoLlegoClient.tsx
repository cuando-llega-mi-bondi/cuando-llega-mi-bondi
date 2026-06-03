"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet } from "react-modal-sheet";
import type { PickingMode } from "@features/trip-planner/components/ComoLlegoMap";
import { Button } from "@shared/ui/Button";
import { Modal } from "@shared/ui/Modal";
import { Spinner } from "@shared/ui/Spinner";
import type { ItineraryMapView } from "@features/trip-planner/lib/itineraryMapPayload";
import type { Itinerary, RouteLeg, RouteLegRide } from "@features/trip-planner/types";
import { cn } from "@shared/utils";
import { IconX } from "@shared/icons/IconX";

const ComoLlegoMap = dynamic(() => import("@features/trip-planner/components/ComoLlegoMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[50vh] w-full items-center justify-center bg-[#0a1628]">
            <Spinner />
        </div>
    ),
});

type Suggestion = { label: string; fullLabel: string; lat: number; lng: number };

type SearchField = {
    text: string;
    coords: { lat: number; lng: number } | null;
    suggestions: Suggestion[];
    loading: boolean;
    expanded: boolean;
};

const emptyField = (): SearchField => ({
    text: "",
    coords: null,
    suggestions: [],
    loading: false,
    expanded: false,
});

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
    let text = "text-white";
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

const IconChevronBack = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const IconClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

export function ComoLlegoClient() {
    const [origin, setOrigin] = useState<SearchField>(emptyField);
    const [dest, setDest] = useState<SearchField>(emptyField);
    const [activeField, setActiveField] = useState<"origin" | "dest" | null>(null);
    const [planning, setPlanning] = useState(false);
    const [gettingGps, setGettingGps] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [mapViews, setMapViews] = useState<ItineraryMapView[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [pickingMode, setPickingMode] = useState<PickingMode>("none");
    const [longPressMenu, setLongPressMenu] = useState<{ lat: number; lng: number } | null>(null);
    const [tripKey, setTripKey] = useState(0);
    const rideColors = ["#0ea5e9", "#a855f7", "#f59e0b", "#10b981"];

    const canPlan = origin.coords != null && dest.coords != null;

    useEffect(() => {
        document.body.classList.add("como-llego-overlay-open");
        return () => document.body.classList.remove("como-llego-overlay-open");
    }, []);

    useEffect(() => {
        if (itineraries.length > 0) {
            document.body.classList.add("como-llego-sheet-open");
            return () => document.body.classList.remove("como-llego-sheet-open");
        }
        return undefined;
    }, [itineraries.length]);

    const resetTrip = useCallback(() => {
        setItineraries([]);
        setMapViews([]);
        setSelectedIdx(0);
        setErrorMsg("");
    }, []);

    const runSearch = useCallback(async (q: string, which: "origin" | "dest") => {
        const t = q.trim();
        if (t.length < 3) {
            if (which === "origin") {
                setOrigin((o) => ({ ...o, suggestions: [], loading: false }));
            } else {
                setDest((d) => ({ ...d, suggestions: [], loading: false }));
            }
            return;
        }
        if (which === "origin") {
            setOrigin((o) => ({ ...o, loading: true }));
        } else {
            setDest((d) => ({ ...d, loading: true }));
        }
        try {
            const res = await fetch(`/api/geo/nominatim?q=${encodeURIComponent(t)}`);
            const data = (await res.json()) as { results?: Suggestion[] };
            const results = data.results ?? [];
            if (which === "origin") {
                setOrigin((o) => {
                    if (o.text.trim() !== t) return o;
                    return { ...o, suggestions: results, loading: false };
                });
            } else {
                setDest((d) => {
                    if (d.text.trim() !== t) return d;
                    return { ...d, suggestions: results, loading: false };
                });
            }
        } catch {
            if (which === "origin") setOrigin((o) => ({ ...o, loading: false }));
            else setDest((d) => ({ ...d, loading: false }));
        }
    }, []);

    useEffect(() => {
        const q = origin.text.trim();
        if (q.length < 3) return;
        const t = setTimeout(() => void runSearch(q, "origin"), 320);
        return () => clearTimeout(t);
    }, [origin.text, runSearch]);

    useEffect(() => {
        const q = dest.text.trim();
        if (q.length < 3) return;
        const t = setTimeout(() => void runSearch(q, "dest"), 320);
        return () => clearTimeout(t);
    }, [dest.text, runSearch]);

    const useMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setErrorMsg("Tu navegador no soporta geolocalización");
            return;
        }
        setGettingGps(true);
        setErrorMsg("");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGettingGps(false);
                setOrigin({
                    text: "Mi ubicación",
                    coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                    suggestions: [],
                    loading: false,
                    expanded: false,
                });
                setItineraries([]);
                setMapViews([]);
                setSelectedIdx(0);
                setPickingMode("none");
            },
            () => {
                setGettingGps(false);
                setErrorMsg("No pudimos obtener tu ubicación");
            },
            { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
        );
    }, []);

    const swap = useCallback(() => {
        setOrigin(dest);
        setDest(origin);
        setItineraries([]);
        setMapViews([]);
        setSelectedIdx(0);
        setPickingMode("none");
    }, [dest, origin]);

    const applyMapPoint = useCallback((which: "origin" | "dest", lat: number, lng: number) => {
        const upd: SearchField = {
            text: "Punto en el mapa",
            coords: { lat, lng },
            suggestions: [],
            loading: false,
            expanded: false,
        };
        if (which === "origin") setOrigin(upd);
        else setDest(upd);
        setItineraries([]);
        setMapViews([]);
        setSelectedIdx(0);
        setPickingMode("none");
        setLongPressMenu(null);
        setActiveField(null);
    }, []);

    const onTapPick = useCallback(
        (mode: "origin" | "dest", lat: number, lng: number) => {
            applyMapPoint(mode, lat, lng);
        },
        [applyMapPoint],
    );

    const onLongPressMap = useCallback((lat: number, lng: number) => {
        setLongPressMenu({ lat, lng });
    }, []);

    const onCancelPicking = useCallback(() => setPickingMode("none"), []);

    const plan = useCallback(() => {
        const o = origin.coords;
        const d = dest.coords;
        if (!o || !d) return;
        setPlanning(true);
        setErrorMsg("");
        setPickingMode("none");
        void (async () => {
            try {
                const res = await fetch("/api/geo/plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        originLat: o.lat,
                        originLng: o.lng,
                        destLat: d.lat,
                        destLng: d.lng,
                        max: 5,
                    }),
                });
                const data = (await res.json()) as {
                    itineraries?: Itinerary[];
                    mapViews?: ItineraryMapView[];
                    error?: string;
                };
                if (!res.ok) {
                    setErrorMsg(data.error ?? "No se pudo planificar");
                    setItineraries([]);
                    setMapViews([]);
                } else {
                    const list = data.itineraries ?? [];
                    const maps = data.mapViews ?? [];
                    if (list.length === 0) {
                        setErrorMsg("No encontramos un camino. Probá puntos más cerca de paradas.");
                        setItineraries([]);
                        setMapViews([]);
                    } else {
                        setErrorMsg("");
                        setItineraries(list);
                        setMapViews(
                            maps.length === list.length
                                ? maps
                                : list.map((_, i) =>
                                      maps[i] ?? {
                                          segments: [],
                                          origin: { lat: o.lat, lng: o.lng },
                                          dest: { lat: d.lat, lng: d.lng },
                                      },
                                  ),
                        );
                        setSelectedIdx(0);
                        setTripKey((k) => k + 1);
                    }
                }
            } catch {
                setErrorMsg("Error de red");
                setItineraries([]);
                setMapViews([]);
            } finally {
                setPlanning(false);
            }
        })();
    }, [dest.coords, origin.coords]);

    const activeMapView = mapViews[selectedIdx] ?? null;
    const tripActive = itineraries.length > 0;

    const uses221Selected = useMemo(() => {
        const it = itineraries[selectedIdx];
        if (!it) return false;
        return it.legs.some((l) => l.kind === "ride" && l.codLinea === "221");
    }, [itineraries, selectedIdx]);

    const suggestionPanel = useMemo(() => {
        const field = activeField === "origin" ? origin : activeField === "dest" ? dest : null;
        if (!field?.expanded) return null;
        if (field.suggestions.length === 0 && !field.loading) return null;
        return (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl">
                {field.loading && field.suggestions.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">Buscando…</p>
                ) : null}
                {field.suggestions.map((s) => (
                    <button
                        key={`${s.lat},${s.lng},${s.label}`}
                        type="button"
                        className="block w-full border-b border-border/40 px-3.5 py-3 text-left text-sm text-foreground last:border-0 hover:bg-muted/70 dark:hover:bg-muted/20 transition-colors"
                        onClick={() => {
                            const upd = {
                                text: s.label,
                                coords: { lat: s.lat, lng: s.lng },
                                suggestions: [],
                                loading: false,
                                expanded: false,
                            };
                            if (activeField === "origin") setOrigin(upd);
                            else setDest(upd);
                            setActiveField(null);
                            setItineraries([]);
                            setMapViews([]);
                            setSelectedIdx(0);
                            setPickingMode("none");
                        }}
                    >
                        <span className="font-semibold block">{s.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.fullLabel}</span>
                    </button>
                ))}
            </div>
        );
    }, [activeField, dest, origin]);

    return (
        <div className="como-llego-overlay fixed inset-0 z-80 min-h-pwa-shell overflow-hidden bg-background">
            <div className="absolute inset-0 z-0">
                <ComoLlegoMap
                    variant="fullscreen"
                    routeView={itineraries.length > 0 ? activeMapView : null}
                    draftOrigin={origin.coords}
                    draftDest={dest.coords}
                    pickingMode={pickingMode}
                    onCancelPicking={onCancelPicking}
                    onTapPick={onTapPick}
                    onLongPress={onLongPressMap}
                />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 px-3 pt-[max(calc(env(safe-area-inset-top)+10px),14px)]">
                <div className="pointer-events-auto flex items-center justify-between gap-2">
                    <Link
                        href="/consultar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur-md hover:bg-muted dark:hover:bg-muted/10 active:scale-95 transition-all"
                        aria-label="Volver"
                    >
                        <IconChevronBack />
                    </Link>
                    <h1 className="min-w-0 flex-1 truncate text-center text-base font-black tracking-tight text-foreground drop-shadow-sm">
                        ¿Cómo llego?
                    </h1>
                    <Link
                        href="/consultar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur-md hover:bg-muted dark:hover:bg-muted/10 active:scale-95 transition-all"
                        aria-label="Cerrar"
                    >
                        <IconClose />
                    </Link>
                </div>

                <div
                    className={cn(
                        "pointer-events-auto relative border border-border bg-card/95 shadow-xl backdrop-blur-md rounded-2xl p-4 transition-all"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {/* Inputs Column */}
                        <div className="relative min-w-0 flex-1 flex flex-col gap-3">
                            {/* Connector Line */}
                            <div className="absolute left-[11px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-650" aria-hidden />

                            {/* Origen Input Row */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
                                    <span className="h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/25" />
                                </div>
                                <div className="relative min-w-0 flex-1 flex items-center">
                                    <input
                                        className="min-w-0 w-full rounded-xl border border-border bg-muted/40 dark:bg-muted/10 px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-sky-500/40 focus:outline-none transition-all"
                                        placeholder="Origen: Dirección, lugar o GPS"
                                        value={origin.text}
                                        onChange={(e) => {
                                            setOrigin({
                                                text: e.target.value,
                                                coords: null,
                                                suggestions: [],
                                                loading: false,
                                                expanded: true,
                                            });
                                            setActiveField("origin");
                                            setItineraries([]);
                                            setMapViews([]);
                                            setPickingMode("none");
                                        }}
                                        onFocus={() => {
                                            setActiveField("origin");
                                            setOrigin((o) => ({ ...o, expanded: true }));
                                        }}
                                    />
                                    {origin.text && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOrigin(emptyField());
                                                resetTrip();
                                            }}
                                            className="absolute right-2.5 p-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted dark:hover:bg-muted/20 transition-colors"
                                            aria-label="Borrar origen"
                                        >
                                            <IconX size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Destino Input Row */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
                                    <span className="h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-500/25" />
                                </div>
                                <div className="relative min-w-0 flex-1 flex items-center">
                                    <input
                                        className="min-w-0 w-full rounded-xl border border-border bg-muted/40 dark:bg-muted/10 px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-sky-500/40 focus:outline-none transition-all"
                                        placeholder="Destino: Dirección o lugar"
                                        value={dest.text}
                                        onChange={(e) => {
                                            setDest({
                                                text: e.target.value,
                                                coords: null,
                                                suggestions: [],
                                                loading: false,
                                                expanded: true,
                                            });
                                            setActiveField("dest");
                                            setItineraries([]);
                                            setMapViews([]);
                                            setPickingMode("none");
                                        }}
                                        onFocus={() => {
                                            setActiveField("dest");
                                            setDest((d) => ({ ...d, expanded: true }));
                                        }}
                                    />
                                    {dest.text && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDest(emptyField());
                                                resetTrip();
                                            }}
                                            className="absolute right-2.5 p-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted dark:hover:bg-muted/20 transition-colors"
                                            aria-label="Borrar destino"
                                        >
                                            <IconX size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Side Column (GPS / Swap) */}
                        <div className="flex flex-col gap-2 shrink-0">
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted dark:hover:bg-muted/10 disabled:opacity-50 shadow-sm active:scale-95 transition-all"
                                aria-label="Usar mi ubicación como origen"
                                disabled={gettingGps}
                                onClick={useMyLocation}
                            >
                                {gettingGps ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted dark:hover:bg-muted/10 disabled:opacity-40 shadow-sm active:scale-95 transition-all"
                                aria-label="Intercambiar origen y destino"
                                disabled={!origin.coords && !dest.coords}
                                onClick={swap}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 21V3M7 3l4 4M7 3L3 7M17 3v18M17 21l-4-4M17 21l4-4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Choose on Map Chips */}
                    <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-border/40">
                        <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-muted/10 transition-colors shadow-sm"
                            onClick={() => {
                                setPickingMode("origin");
                                setLongPressMenu(null);
                                setActiveField(null);
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-500">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>Elegir origen en mapa</span>
                        </button>
                        <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-muted/10 transition-colors shadow-sm"
                            onClick={() => {
                                setPickingMode("dest");
                                setLongPressMenu(null);
                                setActiveField(null);
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-500">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>Elegir destino en mapa</span>
                        </button>
                    </div>

                    {planning && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                            <Spinner className="h-3.5 w-3.5" />
                            <span>Buscando mejores rutas…</span>
                        </div>
                    )}

                    {errorMsg && (
                        <p className="mt-3 px-3 py-2 text-xs rounded-xl border border-red-500/30 bg-red-550/10 text-red-650 dark:text-red-400">
                            {errorMsg}
                        </p>
                    )}

                    {suggestionPanel}
                </div>
            </div>

            {!planning && canPlan && itineraries.length === 0 ? (
                <div className="pointer-events-auto fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-4 right-4 z-20 mx-auto max-w-lg">
                    <Button type="button" variant="primary" className="w-full shadow-lg" onClick={plan}>
                        Buscar ruta
                    </Button>
                </div>
            ) : null}

            <Sheet
                key={tripKey}
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
                                onClick={resetTrip}
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
                                        onClick={() => setSelectedIdx(idx)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                setSelectedIdx(idx);
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
                                                            ? rideColors[rideCountBefore % rideColors.length]!
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

            <Modal open={longPressMenu != null} onClose={() => setLongPressMenu(null)}>
                <p className="text-sm font-bold text-foreground">¿Usar este punto como…?</p>
                <p className="mt-1 text-xs text-muted-foreground">Coordenadas aproximadas en el mapa.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                        type="button"
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                            if (!longPressMenu) return;
                            applyMapPoint("origin", longPressMenu.lat, longPressMenu.lng);
                        }}
                    >
                        Origen
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                            if (!longPressMenu) return;
                            applyMapPoint("dest", longPressMenu.lat, longPressMenu.lng);
                        }}
                    >
                        Destino
                    </Button>
                </div>
                <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => setLongPressMenu(null)}>
                    Cancelar
                </Button>
            </Modal>
        </div>
    );
}
