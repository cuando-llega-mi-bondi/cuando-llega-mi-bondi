/**
 * Grafo de transporte para Dijkstra.
 *
 * Nodos: paradas (id = stop.id)
 * Aristas:
 *   - "bus": entre paradas consecutivas dentro de una bandera (sentido único)
 *   - "walk": entre paradas cercanas (≤ 250 m), bidireccional, para transbordos
 *
 * El grafo se construye una sola vez por proceso (memoizado en el módulo).
 */

import { LINES } from "@/lib/static/lines";
import { STOPS, type Stop } from "@/lib/static/stops";
import { haversineMts } from "./spatial";

const WALK_M_PER_MIN = 83;
const BUS_M_PER_MIN = 300;
/** Transbordo entre paradas cercanas: hasta ~3 min caminando */
const WALK_TRANSFER_MAX_M = 250;

export type EdgeBus = {
    type: "bus";
    to: string;
    weightMin: number;
    distMts: number;
    line: string; // descripción (ej. "541")
    bandera: string;
};

export type EdgeWalk = {
    type: "walk";
    to: string;
    weightMin: number;
    distMts: number;
};

export type Edge = EdgeBus | EdgeWalk;

export type Graph = {
    stopIndex: Map<string, Stop>;
    /** stopId → aristas salientes */
    adj: Map<string, Edge[]>;
};

let cached: Graph | null = null;

export function buildGraph(): Graph {
    if (cached) return cached;

    const stopIndex = new Map(STOPS.map((s) => [s.id, s]));
    const adj = new Map<string, Edge[]>();
    for (const s of STOPS) adj.set(s.id, []);

    // Aristas de bondi: por cada bandera, conectar paradas consecutivas
    for (const line of LINES) {
        for (const bandera of line.banderas) {
            const ids = bandera.paradaIds;
            for (let i = 0; i + 1 < ids.length; i++) {
                const a = stopIndex.get(ids[i]);
                const b = stopIndex.get(ids[i + 1]);
                if (!a || !b) continue;
                const dist = haversineMts(
                    { lat: a.lat, lng: a.lng },
                    { lat: b.lat, lng: b.lng },
                );
                const weightMin = dist / BUS_M_PER_MIN;
                adj.get(a.id)!.push({
                    type: "bus",
                    to: b.id,
                    weightMin,
                    distMts: dist,
                    line: line.descripcion,
                    bandera: bandera.nombre,
                });
            }
        }
    }

    // Aristas de transbordo: para cada parada, sus vecinas dentro de WALK_TRANSFER_MAX_M.
    // Pre-filtramos por bbox para no comparar todas-contra-todas (3337²).
    const stopsArr = STOPS;
    const latDelta = WALK_TRANSFER_MAX_M / 111320;
    for (let i = 0; i < stopsArr.length; i++) {
        const a = stopsArr[i];
        const lngDelta =
            WALK_TRANSFER_MAX_M / (111320 * Math.cos((a.lat * Math.PI) / 180));
        for (let j = i + 1; j < stopsArr.length; j++) {
            const b = stopsArr[j];
            if (Math.abs(b.lat - a.lat) > latDelta) continue;
            if (Math.abs(b.lng - a.lng) > lngDelta) continue;
            const dist = haversineMts(
                { lat: a.lat, lng: a.lng },
                { lat: b.lat, lng: b.lng },
            );
            if (dist > WALK_TRANSFER_MAX_M) continue;
            const weightMin = dist / WALK_M_PER_MIN;
            adj.get(a.id)!.push({ type: "walk", to: b.id, weightMin, distMts: dist });
            adj.get(b.id)!.push({ type: "walk", to: a.id, weightMin, distMts: dist });
        }
    }

    cached = { stopIndex, adj };
    return cached;
}
