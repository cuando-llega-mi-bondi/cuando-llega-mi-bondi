import { apiFetch } from "./client";

export type LiveBus = {
    sessionId: string;
    ramal: string | null;
    lat: number;
    lng: number;
    velocityKmh: number | null;
    avgVelocityKmh: number | null;
    lastSeenAt: string;
    ageSec: number;
    etaMin: number | null;
    etaSource: "gps_route" | "gps_fallback" | null;
};

export type MuniArribo = {
    etaMin: number | null;
    etaText: string;
    ramal: string | null;
    busLat: number | null;
    busLng: number | null;
};

export type ArribosResponse = {
    source: "muni" | "muni_unavailable";
    arribos: MuniArribo[];
    error?: string;
};

export function getLineaEnVivo(linea: string, paradaId?: string) {
    const qs = paradaId ? `?paradaId=${encodeURIComponent(paradaId)}` : "";
    return apiFetch<{ buses: LiveBus[] }>(
        `/lineas/${encodeURIComponent(linea)}/en-vivo${qs}`,
    );
}

export function getLineaArribos(linea: string, paradaId: string) {
    return apiFetch<ArribosResponse>(
        `/lineas/${encodeURIComponent(linea)}/arribos?paradaId=${encodeURIComponent(paradaId)}`,
    );
}
