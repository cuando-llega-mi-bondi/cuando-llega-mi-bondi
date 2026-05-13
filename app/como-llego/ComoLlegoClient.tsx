"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet } from "react-modal-sheet";
import type { PickingMode } from "@/components/map/ComoLlegoMap";
import { Button, Modal, Spinner } from "@/components/ui";
import type { ItineraryMapView } from "@/lib/routing/itineraryMapPayload";
import type { Itinerary, RouteLeg } from "@/lib/routing/types";
import { cn } from "@/lib/utils";

const ComoLlegoMap = dynamic(() => import("@/components/map/ComoLlegoMap"), {
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

function summaryLine(it: Itinerary): string {
    const rides = it.totalRides;
    const walk = it.totalWalkMeters;
    if (rides === 0) return `Solo caminata · ${walk} m`;
    if (rides === 1) return `1 bondi · ${walk} m caminando`;
    return `${rides} bondis · ${walk} m caminando`;
}

function LegBlock({ leg, rideColor, dark }: { leg: RouteLeg; rideColor: string; dark?: boolean }) {
    if (leg.kind === "walk") {
        return (
            <div className={cn("flex gap-2 text-sm", dark ? "text-slate-300" : "text-muted-foreground")}>
                <span aria-hidden>🚶</span>
                <span>Caminá {leg.meters} m</span>
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
            className={cn(
                "flex gap-2 rounded-lg p-2",
                dark ? "border border-white/10 bg-white/5" : "border border-border/60",
            )}
            style={{ borderLeftColor: rideColor, borderLeftWidth: 3 }}
        >
            <span className="text-lg" aria-hidden>
                🚌
            </span>
            <div className={cn("min-w-0 flex-1 text-sm", dark && "text-slate-100")}>
                <p className="font-bold">
                    Tomá {leg.lineaLabel?.trim() || `Línea ${leg.codLinea}`}
                </p>
                {leg.ramalLabel?.trim() ? (
                    <p className={cn("text-xs", dark ? "text-slate-400" : "text-muted-foreground")}>Ramal {leg.ramalLabel}</p>
                ) : null}
                <p className={cn("text-xs", dark ? "text-slate-400" : "text-muted-foreground")}>{subi}</p>
                <p className={cn("text-xs", dark ? "text-slate-400" : "text-muted-foreground")}>
                    {baja} · {numParadas} paradas
                </p>
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
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/15 bg-[#0c1f35] py-1 shadow-xl">
                {field.loading && field.suggestions.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400">Buscando…</p>
                ) : null}
                {field.suggestions.map((s) => (
                    <button
                        key={`${s.lat},${s.lng},${s.label}`}
                        type="button"
                        className="block w-full border-b border-white/10 px-3 py-2.5 text-left text-sm text-slate-100 last:border-0 hover:bg-white/10"
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
                        <span className="font-medium">{s.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-400">{s.fullLabel}</span>
                    </button>
                ))}
            </div>
        );
    }, [activeField, dest, origin]);

    return (
        <div className="como-llego-overlay fixed inset-0 z-80 min-h-pwa-shell overflow-hidden bg-[#0a1628]">
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

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 px-3 pt-[max(calc(env(safe-area-inset-top)+10px),14px)]">
                <div className="pointer-events-auto flex items-center justify-between gap-2">
                    <Link
                        href="/consultar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0c1f35]/95 text-white shadow-lg backdrop-blur-md"
                        aria-label="Volver"
                    >
                        <IconChevronBack />
                    </Link>
                    <h1 className="min-w-0 flex-1 truncate text-center text-base font-black tracking-tight text-white drop-shadow-md">
                        ¿Cómo llego?
                    </h1>
                    <Link
                        href="/consultar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0c1f35]/95 text-white shadow-lg backdrop-blur-md"
                        aria-label="Cerrar"
                    >
                        <IconClose />
                    </Link>
                </div>

                <div className="pointer-events-auto relative rounded-2xl border border-white/12 bg-[#0f2744]/96 p-3 shadow-2xl backdrop-blur-md">
                    <div className="space-y-2.5">
                        <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-1">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                    Origen
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="mb-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-sm" aria-hidden />
                                    <input
                                        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
                                        placeholder="Dirección, lugar o GPS"
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
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg text-white hover:bg-white/15 disabled:opacity-50"
                                aria-label="Usar mi ubicación como origen"
                                disabled={gettingGps}
                                onClick={useMyLocation}
                            >
                                {gettingGps ? <Spinner /> : "📍"}
                            </button>
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-1">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                    Destino
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="mb-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-sm" aria-hidden />
                                    <input
                                        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
                                        placeholder="Dirección o lugar"
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
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg text-white hover:bg-white/15 disabled:opacity-40"
                                aria-label="Intercambiar origen y destino"
                                disabled={!origin.coords && !dest.coords}
                                onClick={swap}
                            >
                                ⇅
                            </button>
                        </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2.5">
                        <button
                            type="button"
                            className="text-xs font-semibold text-sky-300 hover:underline"
                            onClick={() => {
                                setPickingMode("origin");
                                setLongPressMenu(null);
                                setActiveField(null);
                            }}
                        >
                            Origen en mapa
                        </button>
                        <button
                            type="button"
                            className="text-xs font-semibold text-sky-300 hover:underline"
                            onClick={() => {
                                setPickingMode("dest");
                                setLongPressMenu(null);
                                setActiveField(null);
                            }}
                        >
                            Destino en mapa
                        </button>
                    </div>

                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                        El planificador incluye la línea{" "}
                        <Link href="/recorrido?linea=221" className="font-semibold text-sky-300 hover:underline">
                            221 Costa Azul
                        </Link>{" "}
                        (recorrido manual Serena–Mar Chiquita; ver mapa en Recorridos).
                    </p>

                    {planning ? (
                        <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-xs text-slate-300">
                            <Spinner />
                            Buscando rutas…
                        </div>
                    ) : null}

                    {errorMsg ? (
                        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-950/40 px-2.5 py-2 text-xs text-red-100">
                            {errorMsg}
                        </p>
                    ) : null}

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
                <Sheet.Container className="!border-0 !bg-[#0c1f35] px-4 !shadow-[0_-16px_48px_rgba(0,0,0,0.5)]">
                    <Sheet.Header className="!bg-[#0c1f35] !pb-0 text-slate-100">
                        <div className="flex h-9 w-full items-center justify-center pb-2 pt-1">
                            <Sheet.DragIndicator />
                        </div>
                        <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
                            <span className="text-sm font-bold text-slate-300">
                                {itineraries.length} {itineraries.length === 1 ? "opción" : "opciones"}
                            </span>
                            <button
                                type="button"
                                className="text-sm font-bold text-[#f9cd4a] hover:underline"
                                onClick={resetTrip}
                            >
                                Nuevo viaje
                            </button>
                        </div>
                    </Sheet.Header>
                    <Sheet.Content
                        disableDrag={(state) => state.scrollPosition !== "top"}
                        disableScroll={(state) => state.currentSnap !== 3}
                        className="!bg-[#0c1f35]"
                    >
                        {uses221Selected ? (
                            <p className="mb-2 rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-2.5 py-2 text-[11px] text-emerald-100">
                                Esta opción incluye el <strong className="font-bold">221 Costa Azul</strong>.
                            </p>
                        ) : null}
                        <div className="flex flex-col gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                            {itineraries.map((it, idx) => {
                                const expanded = idx === selectedIdx;
                                return (
                                    <button
                                        key={`it-${idx}`}
                                        type="button"
                                        className={cn(
                                            "w-full rounded-xl border p-3 text-left transition-colors",
                                            expanded
                                                ? "border-sky-500/60 bg-sky-950/40"
                                                : "border-white/10 bg-white/5 hover:bg-white/10",
                                        )}
                                        onClick={() => setSelectedIdx(idx)}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-400">Opción {idx + 1}</span>
                                            <span className="text-xs font-semibold text-slate-200">{summaryLine(it)}</span>
                                        </div>
                                        {expanded ? (
                                            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                                                {it.legs.map((leg, i) => {
                                                    const rideCountBefore = it.legs
                                                        .slice(0, i)
                                                        .filter((x) => x.kind === "ride").length;
                                                    const color =
                                                        leg.kind === "ride"
                                                            ? rideColors[rideCountBefore % rideColors.length]!
                                                            : "#94a3b8";
                                                    return <LegBlock key={i} leg={leg} rideColor={color} dark />;
                                                })}
                                            </div>
                                        ) : null}
                                    </button>
                                );
                            })}
                            <p className="text-center text-[10px] text-slate-500">
                                Tocá otra opción para ver el recorrido en el mapa. Tiles: Google Maps.
                            </p>
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
                <Sheet.Backdrop />
            </Sheet>

            <Modal open={longPressMenu != null} onClose={() => setLongPressMenu(null)}>
                <p className="text-sm font-bold">¿Usar este punto como…?</p>
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
