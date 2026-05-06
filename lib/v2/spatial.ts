import type { Stop } from "@/lib/static/stops";

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;

export function haversineMts(a: LatLng, b: LatLng): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(x)));
}

export type StopWithDist = { stop: Stop; dist: number };

export function stopsWithinRadius(
    stops: Stop[],
    center: LatLng,
    radiusMts: number,
): StopWithDist[] {
    // Pre-filtro grosero por bbox (más rápido que haversine sobre todas)
    const latDelta = radiusMts / 111320;
    const lngDelta = radiusMts / (111320 * Math.cos((center.lat * Math.PI) / 180));
    const minLat = center.lat - latDelta;
    const maxLat = center.lat + latDelta;
    const minLng = center.lng - lngDelta;
    const maxLng = center.lng + lngDelta;

    const out: StopWithDist[] = [];
    for (const s of stops) {
        if (s.lat < minLat || s.lat > maxLat || s.lng < minLng || s.lng > maxLng) continue;
        const dist = haversineMts(center, { lat: s.lat, lng: s.lng });
        if (dist <= radiusMts) out.push({ stop: s, dist });
    }
    out.sort((a, b) => a.dist - b.dist);
    return out;
}
