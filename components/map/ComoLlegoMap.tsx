"use client";

import { useCallback, useEffect, useRef } from "react";
import {
    CircleMarker,
    MapContainer,
    Polyline,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import type { ItineraryMapView } from "@/lib/routing/itineraryMapPayload";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const MDP_CENTER: [number, number] = [-38.0, -57.55];

export type PickingMode = "none" | "origin" | "dest";

type ComoLlegoMapProps = {
    className?: string;
    /** `fullscreen`: mapa llena el contenedor padre (p. ej. pantalla completa). */
    variant?: "embedded" | "fullscreen";
    /** Itinerario seleccionado (polilíneas de la ruta). Si es null, solo vista previa origen/destino. */
    routeView: ItineraryMapView | null;
    /** Marcadores y línea punteada previa a buscar ruta */
    draftOrigin: { lat: number; lng: number } | null;
    draftDest: { lat: number; lng: number } | null;
    pickingMode: PickingMode;
    onCancelPicking: () => void;
    /** Tap en mapa cuando `pickingMode` es origin o dest */
    onTapPick: (mode: "origin" | "dest", lat: number, lng: number) => void;
    /** Long-press (solo si `pickingMode === "none"`) */
    onLongPress: (lat: number, lng: number) => void;
};

function MapFitter({
    routeView,
    draftOrigin,
    draftDest,
}: {
    routeView: ItineraryMapView | null;
    draftOrigin: { lat: number; lng: number } | null;
    draftDest: { lat: number; lng: number } | null;
}) {
    const map = useMap();
    useEffect(() => {
        const run = () => {
            if (routeView) {
                const b = L.latLngBounds([]);
                let any = false;
                for (const seg of routeView.segments) {
                    for (const pt of seg.positions) {
                        b.extend(pt);
                        any = true;
                    }
                }
                b.extend([routeView.origin.lat, routeView.origin.lng]);
                b.extend([routeView.dest.lat, routeView.dest.lng]);
                try {
                    if (any) {
                        map.fitBounds(b, { padding: [32, 32], maxZoom: 15 });
                    } else {
                        map.setView([routeView.origin.lat, routeView.origin.lng], 14);
                    }
                } catch {
                    map.setView([routeView.origin.lat, routeView.origin.lng], 14);
                }
                return;
            }

            const b = L.latLngBounds([]);
            if (draftOrigin) b.extend([draftOrigin.lat, draftOrigin.lng]);
            if (draftDest) b.extend([draftDest.lat, draftDest.lng]);
            try {
                if (draftOrigin && draftDest) {
                    map.fitBounds(b, { padding: [40, 40], maxZoom: 15 });
                } else if (draftOrigin) {
                    map.setView([draftOrigin.lat, draftOrigin.lng], 15);
                } else if (draftDest) {
                    map.setView([draftDest.lat, draftDest.lng], 15);
                } else {
                    map.setView(MDP_CENTER, 13);
                }
            } catch {
                map.setView(MDP_CENTER, 13);
            }
        };
        run();
        const t = requestAnimationFrame(() => map.invalidateSize());
        return () => cancelAnimationFrame(t);
    }, [map, routeView, draftOrigin, draftDest]);
    return null;
}

function MapPickLayer({
    pickingMode,
    onTapPick,
    onLongPress,
}: {
    pickingMode: PickingMode;
    onTapPick: (mode: "origin" | "dest", lat: number, lng: number) => void;
    onLongPress: (lat: number, lng: number) => void;
}) {
    const map = useMap();
    const suppressClick = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startRef = useRef<{ px: number; py: number; ll: L.LatLng } | null>(null);

    const clearLongPress = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        startRef.current = null;
    }, []);

    useMapEvents({
        click(e) {
            if (suppressClick.current) {
                suppressClick.current = false;
                return;
            }
            if (pickingMode === "origin" || pickingMode === "dest") {
                onTapPick(pickingMode, e.latlng.lat, e.latlng.lng);
            }
        },
    });

    useEffect(() => {
        const container = map.getContainer();

        const fromPointer = (ev: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;
            return {
                px: ev.clientX,
                py: ev.clientY,
                ll: map.containerPointToLatLng(L.point(x, y)),
            };
        };

        const onDown = (ev: PointerEvent) => {
            if (pickingMode !== "none") return;
            if (ev.pointerType === "mouse" && ev.button !== 0) return;
            clearLongPress();
            startRef.current = fromPointer(ev);
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                const s = startRef.current;
                if (!s) return;
                suppressClick.current = true;
                onLongPress(s.ll.lat, s.ll.lng);
                startRef.current = null;
            }, 520);
        };

        const onMove = (ev: PointerEvent) => {
            const s = startRef.current;
            if (!s || !timerRef.current) return;
            if ((ev.clientX - s.px) ** 2 + (ev.clientY - s.py) ** 2 > 100) {
                clearLongPress();
            }
        };

        const onUp = () => {
            clearLongPress();
        };

        container.addEventListener("pointerdown", onDown);
        container.addEventListener("pointermove", onMove);
        container.addEventListener("pointerup", onUp);
        container.addEventListener("pointercancel", onUp);
        return () => {
            clearLongPress();
            container.removeEventListener("pointerdown", onDown);
            container.removeEventListener("pointermove", onMove);
            container.removeEventListener("pointerup", onUp);
            container.removeEventListener("pointercancel", onUp);
        };
    }, [map, pickingMode, onLongPress, clearLongPress]);

    return null;
}

export default function ComoLlegoMap({
    className,
    variant = "embedded",
    routeView,
    draftOrigin,
    draftDest,
    pickingMode,
    onCancelPicking,
    onTapPick,
    onLongPress,
}: ComoLlegoMapProps) {
    const isFs = variant === "fullscreen";
    const center: [number, number] = draftOrigin
        ? [draftOrigin.lat, draftOrigin.lng]
        : draftDest
          ? [draftDest.lat, draftDest.lng]
          : routeView
            ? [routeView.origin.lat, routeView.origin.lng]
            : MDP_CENTER;

    const showDraftLine =
        !routeView && draftOrigin && draftDest
            ? ([
                  [draftOrigin.lat, draftOrigin.lng],
                  [draftDest.lat, draftDest.lng],
              ] as [number, number][])
            : null;

    const oLat = routeView?.origin.lat ?? draftOrigin?.lat;
    const oLng = routeView?.origin.lng ?? draftOrigin?.lng;
    const dLat = routeView?.dest.lat ?? draftDest?.lat;
    const dLng = routeView?.dest.lng ?? draftDest?.lng;

    return (
        <div
            className={cn(
                "relative z-0 overflow-hidden",
                isFs ? "h-full min-h-0 w-full rounded-none border-0" : "rounded-xl border border-border",
                className,
            )}
        >
            {pickingMode !== "none" ? (
                <div className="absolute left-2 right-2 top-2 z-500 flex items-center justify-between gap-2 rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-white shadow-md backdrop-blur-sm">
                    <span className="text-xs font-bold">
                        {pickingMode === "origin"
                            ? "Tocá el mapa para elegir el ORIGEN"
                            : "Tocá el mapa para elegir el DESTINO"}
                    </span>
                    <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onCancelPicking}>
                        Cancelar
                    </Button>
                </div>
            ) : null}

            <MapContainer
                center={center}
                zoom={13}
                className={cn(
                    "w-full",
                    isFs ? "h-full min-h-[200px]" : "h-[42vh] max-h-[420px] min-h-[240px]",
                )}
                scrollWheelZoom
                attributionControl
            >
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Maps"
                />
                <MapFitter routeView={routeView} draftOrigin={draftOrigin} draftDest={draftDest} />
                <MapPickLayer pickingMode={pickingMode} onTapPick={onTapPick} onLongPress={onLongPress} />

                {routeView
                    ? routeView.segments.map((seg, i) => (
                          <Polyline
                              key={`${seg.kind}-${i}`}
                              positions={seg.positions}
                              pathOptions={{
                                  color: seg.color,
                                  weight: seg.kind === "ride" ? 7 : 3,
                                  opacity: 0.92,
                                  dashArray: seg.dashArray ?? undefined,
                                  lineCap: "round",
                                  lineJoin: "round",
                              }}
                          />
                      ))
                    : null}

                {showDraftLine ? (
                    <Polyline
                        positions={showDraftLine}
                        pathOptions={{
                            color: "#94a3b8",
                            weight: 2,
                            opacity: 0.75,
                            dashArray: "6 10",
                            lineCap: "round",
                        }}
                    />
                ) : null}

                {oLat != null && oLng != null ? (
                    <CircleMarker
                        center={[oLat, oLng]}
                        radius={9}
                        pathOptions={{
                            color: "#ffffff",
                            weight: 3,
                            fillColor: "#22c55e",
                            fillOpacity: 1,
                        }}
                    />
                ) : null}
                {dLat != null && dLng != null ? (
                    <CircleMarker
                        center={[dLat, dLng]}
                        radius={9}
                        pathOptions={{
                            color: "#ffffff",
                            weight: 3,
                            fillColor: "#ef4444",
                            fillOpacity: 1,
                        }}
                    />
                ) : null}
            </MapContainer>

            <div
                className={cn(
                    "pointer-events-none absolute left-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide",
                    isFs ? "bottom-24" : "bottom-2",
                )}
            >
                <span className="rounded bg-background/90 px-2 py-1 text-emerald-600 shadow">Origen</span>
                <span className="rounded bg-background/90 px-2 py-1 text-red-500 shadow">Destino</span>
                {pickingMode === "none" ? (
                    <span className="rounded bg-background/90 px-2 py-1 text-muted-foreground shadow">
                        Mantené presionado: menú
                    </span>
                ) : null}
            </div>
        </div>
    );
}
