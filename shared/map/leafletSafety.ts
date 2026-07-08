import type { Map as LeafletMap } from "leaflet";

/**
 * True si el mapa sigue montado y usable.
 *
 * Leaflet borra `_mapPane` en `map.remove()`; si una animación de paneo o un
 * `invalidateSize` diferido corre después (timeout, rAF, efecto tardío),
 * `getPosition(_mapPane)` explota con "Cannot read properties of undefined
 * (reading '_leaflet_pos')". Chequear esto antes de mover el mapa evita el
 * crash en cierres/desmontajes rápidos.
 */
export function isMapUsable(map: LeafletMap | null | undefined): map is LeafletMap {
    const m = map as unknown as { _loaded?: boolean; _mapPane?: unknown } | null | undefined;
    return Boolean(m && m._loaded && m._mapPane);
}

/** Cancela cualquier animación de paneo/zoom en vuelo (seguro si ya se desmontó). */
export function stopMapSafely(map: LeafletMap | null | undefined): void {
    if (isMapUsable(map)) {
        try {
            map.stop();
        } catch {
            /* mapa a mitad de teardown: ignorar */
        }
    }
}
