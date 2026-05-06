/**
 * Route finder — Fase 1: una sola línea, sin transbordos.
 *
 * Dadas un origen (LatLng) y un destino (LatLng), encuentra los mejores
 * itinerarios "caminar → bondi → caminar" usando exactamente UNA línea.
 *
 * Costo de tiempo:
 *   - Caminata: distancia / 83 m/min (asumimos 5 km/h, OSRM la corrige después)
 *   - Bondi: distancia entre paradas (Haversine) / 300 m/min (~18 km/h en MDP urbano)
 */

import { LINES, type Bandera, type Line } from "@/lib/static/lines";
import { STOPS, type Stop } from "@/lib/static/stops";
import { haversineMts, stopsWithinRadius, type LatLng } from "./spatial";
import { buildGraph } from "./graph";
import { findShortestRoute, type DijkstraResult } from "./dijkstra";

const WALK_M_PER_MIN = 83;
const BUS_M_PER_MIN = 300;
const RADIUS_DEFAULT_M = 500;

export type Itinerary = {
    line: Pick<Line, "codigo" | "descripcion">;
    bandera: string;
    boardStop: Stop;
    alightStop: Stop;
    walkToBoardMts: number;
    walkFromAlightMts: number;
    busDistanceMts: number;
    busStopCount: number;
    estTotalMin: number;
    estWalkMin: number;
    estBusMin: number;
};

export type RouteSearchOptions = {
    radiusMts?: number;
    maxResultsPerLine?: number;
    maxResults?: number;
};

export type RouteSegment =
    | { type: "walk"; mts: number; min: number; toStop?: Stop }
    | {
          type: "bus";
          line: string;
          bandera: string;
          fromStop: Stop;
          toStop: Stop;
          stops: number;
          mts: number;
          min: number;
      }
    | {
          type: "transfer";
          fromStop: Stop;
          toStop: Stop;
          mts: number;
          min: number;
      };

export type MultiLineItinerary = {
    totalMin: number;
    walkMin: number;
    busMin: number;
    transfers: number;
    segments: RouteSegment[];
    boardStop: Stop;
    alightStop: Stop;
};

const stopById: Map<string, Stop> = new Map(STOPS.map((s) => [s.id, s]));

/**
 * Para una bandera dada, encuentra el par (board, alight) que minimiza el tiempo
 * total considerando que ambas paradas existen en la bandera y board viene antes.
 */
function bestPairInBandera(
    bandera: Bandera,
    nearOrigin: Stop[],
    nearDestino: Stop[],
    origin: LatLng,
    destino: LatLng,
): { board: Stop; alight: Stop; cost: number } | null {
    const indexById = new Map<string, number>();
    bandera.paradaIds.forEach((id, i) => indexById.set(id, i));

    let best: { board: Stop; alight: Stop; cost: number } | null = null;
    for (const o of nearOrigin) {
        const oIdx = indexById.get(o.id);
        if (oIdx === undefined) continue;
        for (const d of nearDestino) {
            const dIdx = indexById.get(d.id);
            if (dIdx === undefined) continue;
            if (dIdx <= oIdx) continue; // alight tiene que estar después de board en el recorrido
            const walk1 = haversineMts(origin, { lat: o.lat, lng: o.lng });
            const walk2 = haversineMts({ lat: d.lat, lng: d.lng }, destino);
            const bus = haversineMts(
                { lat: o.lat, lng: o.lng },
                { lat: d.lat, lng: d.lng },
            );
            const cost = walk1 / WALK_M_PER_MIN + bus / BUS_M_PER_MIN + walk2 / WALK_M_PER_MIN;
            if (!best || cost < best.cost) {
                best = { board: o, alight: d, cost };
            }
        }
    }
    return best;
}

export function findRoutes(
    origin: LatLng,
    destino: LatLng,
    opts: RouteSearchOptions = {},
): Itinerary[] {
    const radius = opts.radiusMts ?? RADIUS_DEFAULT_M;

    const originStops = stopsWithinRadius(STOPS, origin, radius).map((s) => s.stop);
    const destinoStops = stopsWithinRadius(STOPS, destino, radius).map((s) => s.stop);

    if (originStops.length === 0 || destinoStops.length === 0) return [];

    // Líneas que tocan al menos una parada cerca del origen Y una cerca del destino
    const linesNearOrigin = new Set<string>();
    for (const s of originStops) for (const l of s.lineas) linesNearOrigin.add(l);
    const linesNearDestino = new Set<string>();
    for (const s of destinoStops) for (const l of s.lineas) linesNearDestino.add(l);
    const candidatas = [...linesNearOrigin].filter((l) => linesNearDestino.has(l));

    const itineraries: Itinerary[] = [];
    for (const lineDesc of candidatas) {
        const line = LINES.find((l) => l.descripcion === lineDesc);
        if (!line) continue;

        // Probamos en cada bandera (sentido) y nos quedamos con el mejor par válido
        let bestForLine: {
            board: Stop;
            alight: Stop;
            bandera: string;
            cost: number;
        } | null = null;
        for (const bandera of line.banderas) {
            const pair = bestPairInBandera(
                bandera,
                originStops,
                destinoStops,
                origin,
                destino,
            );
            if (pair && (!bestForLine || pair.cost < bestForLine.cost)) {
                bestForLine = { ...pair, bandera: bandera.nombre };
            }
        }
        if (!bestForLine) continue;

        const board = bestForLine.board;
        const alight = bestForLine.alight;
        const walkToBoard = haversineMts(origin, { lat: board.lat, lng: board.lng });
        const walkFromAlight = haversineMts(
            { lat: alight.lat, lng: alight.lng },
            destino,
        );
        const busDist = haversineMts(
            { lat: board.lat, lng: board.lng },
            { lat: alight.lat, lng: alight.lng },
        );

        // Cantidad de paradas (en la bandera ganadora)
        const winningBandera = line.banderas.find((b) => b.nombre === bestForLine.bandera);
        const boardIdx = winningBandera?.paradaIds.indexOf(board.id) ?? -1;
        const alightIdx = winningBandera?.paradaIds.indexOf(alight.id) ?? -1;
        const stopCount = boardIdx >= 0 && alightIdx > boardIdx ? alightIdx - boardIdx : 0;

        const walkMin = (walkToBoard + walkFromAlight) / WALK_M_PER_MIN;
        const busMin = busDist / BUS_M_PER_MIN;
        const totalMin = walkMin + busMin;

        itineraries.push({
            line: { codigo: line.codigo, descripcion: line.descripcion },
            bandera: bestForLine.bandera,
            boardStop: board,
            alightStop: alight,
            walkToBoardMts: walkToBoard,
            walkFromAlightMts: walkFromAlight,
            busDistanceMts: busDist,
            busStopCount: stopCount,
            estTotalMin: Math.round(totalMin),
            estWalkMin: Math.round(walkMin),
            estBusMin: Math.round(busMin),
        });
    }

    itineraries.sort((a, b) => a.estTotalMin - b.estTotalMin);
    const maxRes = opts.maxResults ?? 6;
    return itineraries.slice(0, maxRes);
}

/**
 * Fase 2: Dijkstra sobre el grafo completo. Permite transbordos.
 * Devuelve la mejor ruta multimodal (caminata → bondi → [transbordo → bondi]* → caminata)
 * con paradas resueltas a objetos Stop.
 */
export function findBestRoute(
    origin: LatLng,
    destino: LatLng,
    opts: RouteSearchOptions = {},
): MultiLineItinerary | null {
    const radius = opts.radiusMts ?? RADIUS_DEFAULT_M;

    const originNear = stopsWithinRadius(STOPS, origin, radius);
    const destinoNear = stopsWithinRadius(STOPS, destino, radius);
    if (originNear.length === 0 || destinoNear.length === 0) return null;

    const graph = buildGraph();

    const starts = originNear.map(({ stop, dist }) => ({
        stopId: stop.id,
        walkMts: dist,
        walkMin: dist / WALK_M_PER_MIN,
    }));
    const ends = new Map<string, { walkMts: number; walkMin: number }>();
    for (const { stop, dist } of destinoNear) {
        ends.set(stop.id, { walkMts: dist, walkMin: dist / WALK_M_PER_MIN });
    }

    const result: DijkstraResult | null = findShortestRoute(graph, starts, ends);
    if (!result) return null;

    const boardStop = stopById.get(result.boardStopId);
    const alightStop = stopById.get(result.alightStopId);
    if (!boardStop || !alightStop) return null;

    const segments: RouteSegment[] = [];
    for (const step of result.path) {
        if (step.type === "walk") {
            const toStop =
                step.toStopId !== "destino" ? stopById.get(step.toStopId) : undefined;
            segments.push({ type: "walk", mts: step.mts, min: step.min, toStop });
        } else if (step.type === "bus") {
            const from = stopById.get(step.fromStopId);
            const to = stopById.get(step.toStopId);
            if (!from || !to) continue;
            segments.push({
                type: "bus",
                line: step.line,
                bandera: step.bandera,
                fromStop: from,
                toStop: to,
                stops: step.stops,
                mts: step.mts,
                min: step.min,
            });
        } else {
            const from = stopById.get(step.fromStopId);
            const to = stopById.get(step.toStopId);
            if (!from || !to) continue;
            segments.push({
                type: "transfer",
                fromStop: from,
                toStop: to,
                mts: step.mts,
                min: step.min,
            });
        }
    }

    return {
        totalMin: Math.round(result.totalMin),
        walkMin: Math.round(result.totalWalkMin),
        busMin: Math.round(result.totalBusMin),
        transfers: result.transfers,
        segments,
        boardStop,
        alightStop,
    };
}
