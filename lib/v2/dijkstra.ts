/**
 * Dijkstra clásico con min-heap (binary).
 * Aplicado a rutas: encuentra el camino de menor tiempo desde un set de
 * "puntos de subida" (paradas cerca del origen, con un costo de caminata previo)
 * hasta un set de "puntos de bajada" (paradas cerca del destino, con un costo de
 * caminata posterior). Penaliza transbordos entre líneas.
 */

import type { Edge, Graph } from "./graph";

const TRANSFER_PENALTY_MIN = 5; // espera estimada al cambiar de bondi

type EntryFromCost = { stopId: string; walkMts: number; walkMin: number };

export type RoutePathStep =
    | { type: "walk"; fromCoord?: string; toStopId: string; mts: number; min: number }
    | { type: "bus"; line: string; bandera: string; fromStopId: string; toStopId: string; stops: number; mts: number; min: number }
    | { type: "transfer"; fromStopId: string; toStopId: string; mts: number; min: number };

export type DijkstraResult = {
    totalMin: number;
    totalWalkMin: number;
    totalBusMin: number;
    transfers: number;
    path: RoutePathStep[];
    boardStopId: string;
    alightStopId: string;
};

type DistEntry = {
    distMin: number;
    prev: string | null;
    via: Edge | null;
    /** Línea actualmente "en uso" (último bus). Cambia de línea = penalty */
    currentLine: string | null;
    /** caminata inicial usada para llegar a este nodo (origen virtual) */
    initialWalkMts: number;
    initialWalkMin: number;
};

/**
 * Min-heap muy básico (suficiente para grafos chicos).
 */
class MinHeap<T extends { key: number }> {
    private items: T[] = [];
    push(it: T) {
        this.items.push(it);
        this.items.sort((a, b) => a.key - b.key);
    }
    pop(): T | undefined {
        return this.items.shift();
    }
    get size() {
        return this.items.length;
    }
}

export function findShortestRoute(
    graph: Graph,
    starts: EntryFromCost[],
    ends: Map<string, { walkMts: number; walkMin: number }>,
): DijkstraResult | null {
    if (starts.length === 0 || ends.size === 0) return null;

    const dist = new Map<string, DistEntry>();
    const heap = new MinHeap<{
        key: number;
        stopId: string;
        currentLine: string | null;
    }>();

    for (const s of starts) {
        const cur = dist.get(s.stopId);
        if (!cur || s.walkMin < cur.distMin) {
            dist.set(s.stopId, {
                distMin: s.walkMin,
                prev: null,
                via: null,
                currentLine: null,
                initialWalkMts: s.walkMts,
                initialWalkMin: s.walkMin,
            });
            heap.push({ key: s.walkMin, stopId: s.stopId, currentLine: null });
        }
    }

    let bestEnd: { stopId: string; total: number; finalWalk: { mts: number; min: number } } | null = null;

    while (heap.size > 0) {
        const { key, stopId, currentLine } = heap.pop()!;
        const cur = dist.get(stopId);
        if (!cur || key > cur.distMin) continue;

        const endWalk = ends.get(stopId);
        if (endWalk) {
            const total = cur.distMin + endWalk.walkMin;
            if (!bestEnd || total < bestEnd.total) {
                bestEnd = {
                    stopId,
                    total,
                    finalWalk: { mts: endWalk.walkMts, min: endWalk.walkMin },
                };
            }
        }

        // Poda: no expandir nodos peor que el mejor end conocido
        if (bestEnd && cur.distMin >= bestEnd.total) continue;

        const edges = graph.adj.get(stopId) ?? [];
        for (const e of edges) {
            let cost = e.weightMin;
            let nextLine: string | null = currentLine;
            if (e.type === "bus") {
                if (currentLine !== null && currentLine !== e.line) {
                    cost += TRANSFER_PENALTY_MIN;
                }
                nextLine = e.line;
            } else {
                // walk transbordo: si venía en bondi, ya el penalty lo paga al subirse al próximo
                nextLine = null;
            }
            const newDist = cur.distMin + cost;
            const existing = dist.get(e.to);
            if (!existing || newDist < existing.distMin) {
                dist.set(e.to, {
                    distMin: newDist,
                    prev: stopId,
                    via: e,
                    currentLine: nextLine,
                    initialWalkMts: cur.initialWalkMts,
                    initialWalkMin: cur.initialWalkMin,
                });
                heap.push({ key: newDist, stopId: e.to, currentLine: nextLine });
            }
        }
    }

    if (!bestEnd) return null;

    // Reconstruir path
    const stepsRev: RoutePathStep[] = [];
    let cursor: string | null = bestEnd.stopId;
    let walkMin = 0;
    let busMin = 0;
    let transfers = 0;
    let firstStopId: string = bestEnd.stopId;
    while (cursor !== null) {
        const entry: DistEntry = dist.get(cursor)!;
        const e = entry.via;
        if (e === null) {
            firstStopId = cursor;
            break;
        }
        if (e.type === "bus") {
            stepsRev.push({
                type: "bus",
                line: e.line,
                bandera: e.bandera,
                fromStopId: entry.prev!,
                toStopId: cursor,
                stops: 1,
                mts: e.distMts,
                min: e.weightMin,
            });
            busMin += e.weightMin;
        } else {
            stepsRev.push({
                type: "transfer",
                fromStopId: entry.prev!,
                toStopId: cursor,
                mts: e.distMts,
                min: e.weightMin,
            });
            walkMin += e.weightMin;
        }
        cursor = entry.prev;
    }

    // El path está al revés. Lo invertimos y agrupamos consecutivas de la misma línea
    const stepsForward = stepsRev.reverse();
    const merged: RoutePathStep[] = [];
    for (const step of stepsForward) {
        const last = merged[merged.length - 1];
        if (
            step.type === "bus" &&
            last &&
            last.type === "bus" &&
            last.line === step.line &&
            last.bandera === step.bandera
        ) {
            last.toStopId = step.toStopId;
            last.stops += 1;
            last.mts += step.mts;
            last.min += step.min;
        } else {
            merged.push({ ...step });
        }
    }

    // Caminatas iniciales y finales
    const startEntry = dist.get(firstStopId)!;
    const initialWalk: RoutePathStep = {
        type: "walk",
        toStopId: firstStopId,
        mts: startEntry.initialWalkMts,
        min: startEntry.initialWalkMin,
    };
    const finalWalk: RoutePathStep = {
        type: "walk",
        toStopId: "destino",
        mts: bestEnd.finalWalk.mts,
        min: bestEnd.finalWalk.min,
    };
    walkMin += startEntry.initialWalkMin + bestEnd.finalWalk.min;

    // Contar transbordos: cada transition entre buses distintos cuenta uno
    let prevLine: string | null = null;
    for (const s of merged) {
        if (s.type === "bus") {
            if (prevLine !== null && prevLine !== s.line) transfers++;
            prevLine = s.line;
        }
    }

    return {
        totalMin: bestEnd.total,
        totalWalkMin: walkMin,
        totalBusMin: busMin,
        transfers,
        path: [initialWalk, ...merged, finalWalk],
        boardStopId: firstStopId,
        alightStopId: bestEnd.stopId,
    };
}
