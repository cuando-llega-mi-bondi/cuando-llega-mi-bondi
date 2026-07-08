"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Circle,
    CircleMarker,
    MapContainer,
    Marker,
    TileLayer,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@shared/map/leaflet.css";
import { useLeafletMapReady } from "@shared/map/useLeafletMapReady";
import { isMapUsable, stopMapSafely } from "@shared/map/leafletSafety";
import { cn } from "@shared/utils";

export type NearLinea = { codigoLineaParada: string; descripcion: string };

export type NearStop = {
    identificador: string;
    lat: number;
    lng: number;
    distanciaMetros: number;
    abreviaturaBandera: string | null;
    calleLabel: string | null;
    interseccionLabel: string | null;
    lineas: NearLinea[];
};

export type NearUser = { lat: number; lng: number };

const ACCENT = "#0099ff";
const STOP_FILL = "#f59e0b";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEsquina(s: NearStop): string | null {
    const calle = s.calleLabel?.trim();
    const inter = s.interseccionLabel?.trim();
    if (calle && inter) return `${calle} y ${inter}`;
    if (calle) return calle;
    if (inter) return inter;
    return null;
}

function formatDist(m: number): string {
    if (m < 1000) return `${m} m`;
    return `${(m / 1000).toFixed(1)} km`;
}

function stopTitle(s: NearStop): string {
    return formatEsquina(s) ?? s.abreviaturaBandera ?? `Parada ${s.identificador}`;
}

// "Tu ubicación": punto azul con halo pulsante (reutiliza .marker-stop del CSS compartido).
const userIcon = L.divIcon({
    className: "custom-user-icon",
    html: `<div class="marker-stop"></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
});

// ─── Recenter / fit-to-bounds controller ────────────────────────────────────────

function MapController({
    user,
    stops,
    trigger,
}: {
    user: NearUser;
    stops: NearStop[];
    trigger: number;
}) {
    const map = useMap();
    const fitted = useRef(false);
    const lastTrigger = useRef(trigger);

    useEffect(() => {
        const timers = [
            setTimeout(() => { if (isMapUsable(map)) map.invalidateSize({ animate: false }); }, 100),
            setTimeout(() => { if (isMapUsable(map)) map.invalidateSize({ animate: false }); }, 300),
        ];
        return () => timers.forEach(clearTimeout);
    }, [map]);

    // Cancela animaciones en vuelo antes de que react-leaflet destruya el mapa.
    useEffect(() => () => stopMapSafely(map), [map]);

    useEffect(() => {
        if (fitted.current && lastTrigger.current === trigger) return;
        fitted.current = true;
        lastTrigger.current = trigger;

        const bounds = L.latLngBounds([[user.lat, user.lng]]);
        for (const s of stops) bounds.extend([s.lat, s.lng]);

        const timer = setTimeout(() => {
            if (!isMapUsable(map)) return;
            try {
                map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16, animate: true });
            } catch {
                /* map torn down during navigation */
            }
        }, 120);
        return () => clearTimeout(timer);
    }, [map, user, stops, trigger]);

    return null;
}

// ─── Icons ──────────────────────────────────────────────────────────────────────

const IconTarget = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Main component ──────────────────────────────────────────────────────────────

type NearStopsMapProps = {
    user: NearUser;
    stops: NearStop[];
    radioMetros: number;
    onPickLinea: (paradaId: string, codLinea: string) => void;
};

export default function NearStopsMap({ user, stops, radioMetros, onPickLinea }: NearStopsMapProps) {
    const mapReady = useLeafletMapReady();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [recenter, setRecenter] = useState(0);

    const center = useMemo<[number, number]>(() => [user.lat, user.lng], [user.lat, user.lng]);
    const selected = stops.find((s) => s.identificador === selectedId) ?? null;

    return (
        <div className="relative h-full w-full">
            {/* Recenter control */}
            <div className="absolute right-3 top-3 z-[500]">
                <button
                    type="button"
                    onClick={() => setRecenter((r) => r + 1)}
                    title="Centrar en mi ubicación"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-lg transition hover:border-primary"
                >
                    <IconTarget />
                </button>
            </div>

            {mapReady ? (
                <MapContainer
                    center={center}
                    zoom={15}
                    scrollWheelZoom
                    className="h-full w-full"
                    style={{ height: "100%", width: "100%", background: "#090909" }}
                >
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        attribution="&copy; Google Maps"
                    />

                    <MapController user={user} stops={stops} trigger={recenter} />

                    {/* Radio de búsqueda */}
                    <Circle
                        center={center}
                        radius={radioMetros}
                        pathOptions={{
                            color: ACCENT,
                            weight: 1,
                            opacity: 0.5,
                            fillColor: ACCENT,
                            fillOpacity: 0.06,
                        }}
                    />

                    {/* Tu ubicación */}
                    <Marker position={center} icon={userIcon} zIndexOffset={1000} interactive={false} />

                    {/* Paradas cercanas */}
                    {stops.map((s) => {
                        const isSel = s.identificador === selectedId;
                        return (
                            <CircleMarker
                                key={s.identificador}
                                center={[s.lat, s.lng]}
                                radius={isSel ? 12 : 8}
                                pathOptions={{
                                    color: "#ffffff",
                                    weight: isSel ? 3 : 2,
                                    fillColor: STOP_FILL,
                                    fillOpacity: 1,
                                }}
                                eventHandlers={{
                                    click: () => setSelectedId(isSel ? null : s.identificador),
                                }}
                            />
                        );
                    })}
                </MapContainer>
            ) : (
                <div className="h-full w-full bg-[#090909]" aria-hidden />
            )}

            {/* Panel de parada seleccionada */}
            {selected ? (
                <div className="absolute inset-x-0 bottom-0 z-[500] animate-slide-up border-t border-border bg-card p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-snug text-foreground">{stopTitle(selected)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                A {formatDist(selected.distanciaMetros)} de tu ubicación
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedId(null)}
                            title="Cerrar"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                        >
                            <IconClose />
                        </button>
                    </div>
                    {selected.lineas.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {selected.lineas.map((ln) => (
                                <button
                                    key={`${selected.identificador}-${ln.codigoLineaParada}`}
                                    type="button"
                                    className={cn(
                                        "rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold",
                                        "text-primary transition-colors hover:bg-primary/25",
                                        "min-h-[44px] min-w-[44px]",
                                    )}
                                    onClick={() => onPickLinea(selected.identificador, ln.codigoLineaParada)}
                                >
                                    {ln.descripcion?.trim() || ln.codigoLineaParada}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-xs text-muted-foreground">Sin líneas registradas en esta parada.</p>
                    )}
                </div>
            ) : (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] flex justify-center p-4">
                    <span className="rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow backdrop-blur-sm">
                        Tocá una parada para ver las líneas
                    </span>
                </div>
            )}
        </div>
    );
}
