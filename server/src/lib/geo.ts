/** Helpers geográficos. */

const EARTH_R = 6371000;

export function haversineMts(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * EARTH_R * Math.asin(Math.sqrt(x)));
}

/** Mediana sin mutar el array de entrada. */
export function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        const a = sorted[mid - 1] as number;
        const b = sorted[mid] as number;
        return (a + b) / 2;
    }
    return sorted[mid] as number;
}
