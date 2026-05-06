/**
 * Cliente para el OSRM self-hosted (perfil foot).
 * Pega al endpoint Next /api/walk-route, que del lado server proxea a OSRM
 * en localhost:5000. Esto evita exponer OSRM y permite que el celu
 * (que llega por túnel HTTPS) use rutas reales.
 */

export type WalkRoute = {
    distanceMts: number;
    durationSec: number;
    /** Lista de [lat, lng] pares — Leaflet espera lat,lng (ya invertido en el server). */
    polyline: Array<[number, number]>;
};

export async function fetchWalkRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    signal?: AbortSignal,
): Promise<WalkRoute | null> {
    const params = new URLSearchParams({
        fromLat: from.lat.toString(),
        fromLng: from.lng.toString(),
        toLat: to.lat.toString(),
        toLng: to.lng.toString(),
    });
    try {
        const res = await fetch(`/api/walk-route?${params.toString()}`, {
            signal,
            cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as WalkRoute;
    } catch (e) {
        if ((e as Error).name === "AbortError") return null;
        console.warn("[osrm] fetch falló:", e);
        return null;
    }
}
