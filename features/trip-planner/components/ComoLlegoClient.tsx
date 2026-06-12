"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PickingMode } from "@features/trip-planner/components/ComoLlegoMap";
import { Button } from "@shared/ui/Button";
import { Modal } from "@shared/ui/Modal";
import { Spinner } from "@shared/ui/Spinner";
import type { ItineraryMapView } from "@features/trip-planner/lib/itineraryMapPayload";
import type { Itinerary } from "@features/trip-planner/types";
import {
    loadRecentPlaces,
    saveRecentPlace,
    type RecentPlace,
} from "@features/trip-planner/lib/recentPlaces";
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

/**
 * react-modal-sheet (+ motion) solo se necesita cuando hay resultados:
 * import dinámico para sacarlo del bundle inicial de la página.
 */
const TripResultsSheet = dynamic(
    () =>
        import("@features/trip-planner/components/TripResultsSheet").then(
            (m) => m.TripResultsSheet,
        ),
    { ssr: false },
);

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

const IconClock = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-muted-foreground shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
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
    const [recents, setRecents] = useState<RecentPlace[]>([]);
    /** Una vez que hubo una búsqueda, el sheet queda montado (animaciones de entrada/salida). */
    const [sheetWanted, setSheetWanted] = useState(false);
    const searchCardRef = useRef<HTMLDivElement | null>(null);
    const lastAutoPlanKey = useRef<string | null>(null);

    const canPlan = origin.coords != null && dest.coords != null;

    useEffect(() => {
        document.body.classList.add("como-llego-overlay-open");
        return () => document.body.classList.remove("como-llego-overlay-open");
    }, []);

    /**
     * Warm-up: el grafo de routing se construye lazy en el server con el
     * primer plan. Dispararlo al montar hace que, mientras el usuario tipea,
     * el server ya lo tenga listo y la primera búsqueda sea inmediata.
     */
    useEffect(() => {
        void fetch("/api/geo/plan").catch(() => undefined);
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

    /** Tocar fuera de la tarjeta de búsqueda cierra el panel de sugerencias. */
    useEffect(() => {
        if (!activeField) return;
        const onPointerDown = (e: PointerEvent) => {
            if (searchCardRef.current?.contains(e.target as Node)) return;
            setActiveField(null);
            setOrigin((o) => ({ ...o, expanded: false }));
            setDest((d) => ({ ...d, expanded: false }));
        };
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [activeField]);

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
                setActiveField(null);
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

    /** Selección de una sugerencia o un lugar reciente para un campo. */
    const selectPlace = useCallback(
        (which: "origin" | "dest", place: Suggestion | RecentPlace) => {
            const upd: SearchField = {
                text: place.label,
                coords: { lat: place.lat, lng: place.lng },
                suggestions: [],
                loading: false,
                expanded: false,
            };
            if (which === "origin") setOrigin(upd);
            else setDest(upd);
            setActiveField(null);
            setItineraries([]);
            setMapViews([]);
            setSelectedIdx(0);
            setPickingMode("none");
            setRecents(
                saveRecentPlace({
                    label: place.label,
                    fullLabel: place.fullLabel,
                    lat: place.lat,
                    lng: place.lng,
                }),
            );
        },
        [],
    );

    const plan = useCallback(() => {
        const o = origin.coords;
        const d = dest.coords;
        if (!o || !d) return;
        setPlanning(true);
        setSheetWanted(true);
        setErrorMsg("");
        setPickingMode("none");
        // Bajar el teclado en mobile para que se vea el mapa/resultado.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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

    /**
     * Auto-búsqueda: en cuanto origen y destino quedan definidos se planifica
     * solo, sin tap extra. La ref evita re-planificar el mismo par (p. ej.
     * tras un error o un "Nuevo viaje").
     */
    useEffect(() => {
        const o = origin.coords;
        const d = dest.coords;
        if (!o || !d || planning) return;
        const key = `${o.lat},${o.lng}|${d.lat},${d.lng}`;
        if (lastAutoPlanKey.current === key) return;
        lastAutoPlanKey.current = key;
        plan();
    }, [origin.coords, dest.coords, planning, plan]);

    const activeMapView = mapViews[selectedIdx] ?? null;

    const field = activeField === "origin" ? origin : activeField === "dest" ? dest : null;
    const showQuickPanel =
        field?.expanded === true && field.text.trim().length < 3 &&
        (activeField === "origin" || recents.length > 0);
    const showSuggestions =
        field?.expanded === true && field.text.trim().length >= 3 &&
        (field.suggestions.length > 0 || field.loading);

    const suggestionPanel = showQuickPanel || showSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl">
            {showQuickPanel ? (
                <>
                    {activeField === "origin" ? (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2.5 border-b border-border/40 px-3.5 py-3 text-left text-sm font-semibold text-foreground last:border-0 hover:bg-muted/70 dark:hover:bg-muted/20 transition-colors"
                            onClick={useMyLocation}
                            disabled={gettingGps}
                        >
                            {gettingGps ? (
                                <Spinner className="h-4 w-4 shrink-0" />
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-500 shrink-0" aria-hidden>
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                                </svg>
                            )}
                            <span>Usar mi ubicación</span>
                        </button>
                    ) : null}
                    {recents.length > 0 ? (
                        <p className="px-3.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
                            Recientes
                        </p>
                    ) : null}
                    {recents.map((r) => (
                        <button
                            key={`recent-${r.lat},${r.lng},${r.label}`}
                            type="button"
                            className="flex w-full items-center gap-2.5 border-b border-border/40 px-3.5 py-2.5 text-left text-sm text-foreground last:border-0 hover:bg-muted/70 dark:hover:bg-muted/20 transition-colors"
                            onClick={() => {
                                if (activeField) selectPlace(activeField, r);
                            }}
                        >
                            <IconClock />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">{r.label}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{r.fullLabel}</span>
                            </span>
                        </button>
                    ))}
                </>
            ) : (
                <>
                    {field!.loading && field!.suggestions.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground">Buscando…</p>
                    ) : null}
                    {field!.suggestions.map((s) => (
                        <button
                            key={`${s.lat},${s.lng},${s.label}`}
                            type="button"
                            className="block w-full border-b border-border/40 px-3.5 py-3 text-left text-sm text-foreground last:border-0 hover:bg-muted/70 dark:hover:bg-muted/20 transition-colors"
                            onClick={() => {
                                if (activeField) selectPlace(activeField, s);
                            }}
                        >
                            <span className="font-semibold block">{s.label}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.fullLabel}</span>
                        </button>
                    ))}
                </>
            )}
        </div>
    ) : null;

    /** Enter elige la primera sugerencia disponible del campo activo. */
    const onInputEnter = useCallback(
        (which: "origin" | "dest") => {
            const f = which === "origin" ? origin : dest;
            const first = f.suggestions[0];
            if (first) selectPlace(which, first);
        },
        [origin, dest, selectPlace],
    );

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
                    ref={searchCardRef}
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
                                        enterKeyHint="search"
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
                                            setRecents(loadRecentPlaces());
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                onInputEnter("origin");
                                            }
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
                                        enterKeyHint="search"
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
                                            setRecents(loadRecentPlaces());
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                onInputEnter("dest");
                                            }
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

            {sheetWanted ? (
                <TripResultsSheet
                    key={tripKey}
                    itineraries={itineraries}
                    selectedIdx={selectedIdx}
                    onSelect={setSelectedIdx}
                    onNewTrip={resetTrip}
                />
            ) : null}

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
