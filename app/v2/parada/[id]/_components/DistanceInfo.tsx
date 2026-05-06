"use client";

import { useEffect, useRef, useState } from "react";
import { useGeolocation } from "../../../_components/useGeolocation";
import { fetchWalkRoute, type WalkRoute } from "@/lib/osrm";

const WALKING_SPEED_M_PER_MIN = 83;
/** Umbral mínimo de movimiento para refetch — evita refrescos por jitter de GPS. */
const REFETCH_THRESHOLD_M = 25;

function haversineMts(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
) {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function bearingCardinal(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
): string {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const toDeg = (x: number) => (x * 180) / Math.PI;
    const dLng = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const angle = (toDeg(Math.atan2(y, x)) + 360) % 360;
    const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    return dirs[Math.round(angle / 45) % 8];
}

function formatMts(mts: number) {
    if (mts < 1000) return `${mts} m`;
    return `${(mts / 1000).toFixed(mts < 10000 ? 1 : 0)} km`;
}

function formatMinutes(mins: number) {
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function DistanceInfo({
    stopLat,
    stopLng,
    onRouteChange,
}: {
    stopLat: number;
    stopLng: number;
    onRouteChange?: (route: WalkRoute | null) => void;
}) {
    const geo = useGeolocation();
    const [route, setRoute] = useState<WalkRoute | null>(null);
    const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "ok" | "error">(
        "idle",
    );
    const lastFetchedRef = useRef<{ lat: number; lng: number } | null>(null);

    const granted = geo.status === "granted";
    const lat = granted ? geo.coords.lat : 0;
    const lng = granted ? geo.coords.lng : 0;

    useEffect(() => {
        if (!granted) {
            setRoute(null);
            setRouteStatus("idle");
            onRouteChange?.(null);
            lastFetchedRef.current = null;
            return;
        }
        const here = { lat, lng };
        const last = lastFetchedRef.current;
        // Saltamos refetch sólo si el último fue exitoso y estamos cerca; si el
        // último falló, queremos reintentar.
        if (last && haversineMts(last, here) < REFETCH_THRESHOLD_M) return;

        const ctrl = new AbortController();
        setRouteStatus((prev) => (prev === "ok" ? prev : "loading"));
        fetchWalkRoute(here, { lat: stopLat, lng: stopLng }, ctrl.signal).then((r) => {
            if (ctrl.signal.aborted) return;
            setRoute(r);
            setRouteStatus(r ? "ok" : "error");
            onRouteChange?.(r);
            // Sólo memorizamos el lugar si la ruta resolvió OK — así un fallo
            // (network, OSRM aún cargando, primer fix raro) no nos deja clavados.
            lastFetchedRef.current = r ? here : null;
        });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [granted, lat, lng, stopLat, stopLng]);

    if (geo.status === "idle" || geo.status === "requesting") {
        return (
            <div className="rounded-2xl border border-[#E8E2D2] bg-white/70 p-4">
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                    Distancia
                </p>
                <p className="mt-2 font-display text-[14px] text-[#6B7080]">
                    Buscando tu ubicación…
                </p>
            </div>
        );
    }

    if (geo.status === "denied" || geo.status === "unavailable") {
        return (
            <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-4">
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                    Distancia
                </p>
                <p className="mt-2 font-display text-[14px] text-[#0F1115]">
                    Activá tu ubicación para ver cuánto falta caminando.
                </p>
            </div>
        );
    }

    const target = { lat: stopLat, lng: stopLng };
    const dir = bearingCardinal(geo.coords, target);

    // Si OSRM respondió, usamos su distancia y duración reales
    const useReal = routeStatus === "ok" && route !== null;
    const dist = useReal ? route.distanceMts : haversineMts(geo.coords, target);
    const minutesReal = useReal ? route.durationSec / 60 : null;
    const minutesEst = dist / WALKING_SPEED_M_PER_MIN;

    return (
        <div className="rounded-2xl border border-[#E8E2D2] bg-white p-4 v2-card-shadow">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                Desde tu ubicación
            </p>
            <div className="mt-2 flex items-baseline gap-2">
                <p className="font-display text-[36px] font-semibold leading-none tracking-tight text-[#0F1115]">
                    {formatMts(dist)}
                </p>
                <p className="font-mono text-[12px] text-[#6B7080]">hacia {dir}</p>
            </div>
            <p className="mt-2 flex items-center gap-2 font-display text-[13px] text-[#0F1115]">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#0099FF]">
                    <path
                        d="M13 2v4l-3 3v5l4 4v4M9 2l-3 3v4l3 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                Caminando ≈{" "}
                <span className="font-semibold">
                    {formatMinutes(minutesReal ?? minutesEst)}
                </span>
            </p>
            <p className="mt-1 font-mono text-[10px] text-[#6B7080]">
                {routeStatus === "loading"
                    ? "Calculando ruta peatonal…"
                    : useReal
                      ? `Ruta real por calles · GPS ± ${geo.accuracyMts} m`
                      : `Línea recta (OSRM no disponible) · GPS ± ${geo.accuracyMts} m`}
            </p>
        </div>
    );
}
