/**
 * Lugares elegidos recientemente en "Cómo llego" (localStorage).
 * Se muestran como accesos rápidos al enfocar un input vacío.
 */

export type RecentPlace = {
    label: string;
    fullLabel: string;
    lat: number;
    lng: number;
};

const STORAGE_KEY = "bondimdp:como-llego:recientes";
const MAX_RECENTS = 6;

export function loadRecentPlaces(): RecentPlace[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (p): p is RecentPlace =>
                    p != null &&
                    typeof p === "object" &&
                    typeof (p as RecentPlace).label === "string" &&
                    typeof (p as RecentPlace).lat === "number" &&
                    typeof (p as RecentPlace).lng === "number",
            )
            .slice(0, MAX_RECENTS);
    } catch {
        return [];
    }
}

export function saveRecentPlace(place: RecentPlace): RecentPlace[] {
    const current = loadRecentPlaces();
    const next = [
        place,
        ...current.filter(
            (p) =>
                !(
                    p.label === place.label &&
                    Math.abs(p.lat - place.lat) < 1e-6 &&
                    Math.abs(p.lng - place.lng) < 1e-6
                ),
        ),
    ].slice(0, MAX_RECENTS);
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Storage lleno o bloqueado: ignorar, los recientes son best-effort.
    }
    return next;
}
