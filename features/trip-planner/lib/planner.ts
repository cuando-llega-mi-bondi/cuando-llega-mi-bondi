/**
 * Planner de "Cómo llego": búsqueda estilo RAPTOR por rondas, donde la ronda k
 * explora itinerarios de exactamente k colectivos.
 *
 *  - El costo se mide en minutos estimados (mismo modelo que muestra la UI,
 *    ver `costModel.ts`) más una penalidad por transbordo: "menos colectivos"
 *    ya no gana automáticamente si implica caminar o rodear mucho.
 *  - Cada ronda escanea cada secuencia una sola vez desde la primera parada
 *    marcada, manteniendo el mejor abordaje visto ("onboard").
 *  - De una sola corrida salen el mejor itinerario de 1, 2 y 3 colectivos;
 *    las re-corridas con líneas baneadas solo aportan diversidad extra.
 */

import { haversineMeters } from "@shared/geo/haversine";
import {
    itineraryRankCost,
    rankCostMins,
    travelMins,
    walkMetersFromStraight,
} from "@features/trip-planner/lib/costModel";
import type {
    Itinerary,
    RouteLeg,
    RouteLegRide,
    RoutingGraph,
} from "@features/trip-planner/types";
import { DEST_KEY, ORIGIN_KEY } from "@features/trip-planner/types";

/** Radio (línea recta) de paradas alcanzables a pie desde origen/destino. */
const USER_WALK_RADIUS_METERS = 800;
const MAX_RIDES_DEFAULT = 3;
/** Hasta esta distancia en línea recta se ofrece "ir caminando" como alternativa. */
const DIRECT_WALK_MAX_METERS = 1200;
/** Una alternativa que excede al mejor itinerario en esto no aporta: se descarta. */
const PRUNE_EXTRA_MINS = 15;
const PRUNE_FACTOR = 1.5;

type Query = {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    maxRides: number;
};

type Via =
    | { type: "origin" }
    | { type: "walk"; meters: number }
    | { type: "ride"; sequenceIdx: number; fromPosition: number; toPosition: number };

/** Arribo a una parada en la ronda `rides`. Inmutable: encadena a su padre. */
type Label = {
    paradaId: string;
    rides: number;
    /** Metros de caminata acumulados (ya con factor de desvío). */
    walkMeters: number;
    rideMeters: number;
    costMins: number;
    parent: Label | null;
    via: Via;
};

function rideKey(r: RouteLegRide): string {
    return `${r.codLinea}|${r.ramalKey}`;
}

function ridesOf(it: Itinerary): RouteLegRide[] {
    return it.legs.filter((l): l is RouteLegRide => l.kind === "ride");
}

function describeItin(it: Itinerary): Set<string> {
    return new Set(ridesOf(it).map((l) => rideKey(l)));
}

function addIfNew(results: Itinerary[], candidate: Itinerary): boolean {
    const candKey = describeItin(candidate);
    if (
        results.some((existing) => {
            const a = describeItin(existing);
            return a.size === candKey.size && [...a].every((x) => candKey.has(x));
        })
    ) {
        return false;
    }
    results.push(candidate);
    return true;
}

const MDP_REGEX = /[,/-]?\s*mar\s+del\s+plata\s*$/i;

function cleanCalle(raw: string): string {
    const noMdp = raw.replace(MDP_REGEX, "").trim().replace(/[,/-]+$/, "").trim();
    return noMdp
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
        .join(" ");
}

function esquinaOf(graph: RoutingGraph, paradaId: string): string | null {
    const p = graph.paradas.get(paradaId);
    if (!p) return null;
    const calle = p.calleLabel?.trim() ? cleanCalle(p.calleLabel) : null;
    const inter = p.interseccionLabel?.trim() ? cleanCalle(p.interseccionLabel) : null;
    if (calle && inter) return `${calle} y ${inter}`;
    if (calle) return calle;
    if (inter) return inter;
    return null;
}

/** Paradas a ≤ radio del punto, con su distancia en línea recta, más cercana primero. */
function walkableStops(
    graph: RoutingGraph,
    lat: number,
    lng: number,
): [string, number][] {
    return [...graph.paradas.values()]
        .map((p) => {
            const d = haversineMeters(lat, lng, p.lat, p.lng);
            if (d <= USER_WALK_RADIUS_METERS) return [p.identificador, Math.round(d)] as const;
            return null;
        })
        .filter((x): x is [string, number] => x != null)
        .sort((a, b) => a[1] - b[1]);
}

function directWalkItinerary(q: Query, meters: number): Itinerary {
    return {
        legs: [
            {
                kind: "walk",
                fromKey: ORIGIN_KEY,
                toKey: DEST_KEY,
                fromLat: q.originLat,
                fromLng: q.originLng,
                toLat: q.destLat,
                toLng: q.destLng,
                meters,
            },
        ],
        totalRides: 0,
        totalWalkMeters: meters,
        totalRideMeters: 0,
    };
}

/**
 * Una corrida RAPTOR completa. Devuelve a lo sumo un itinerario por ronda
 * (el mejor de exactamente k colectivos), sin ordenar.
 */
function runRaptor(
    graph: RoutingGraph,
    q: Query,
    originStops: [string, number][],
    destStops: Map<string, number>,
    bannedSequences: Set<string>,
): Itinerary[] {
    if (originStops.length === 0 || destStops.size === 0) return [];

    /** Mejor costo conocido por parada en cualquier ronda ya explorada. */
    const bestCost = new Map<string, number>();
    /** Mejor etiqueta por parada con ≤ rondas completadas (candidatas a abordar). */
    const bestLabel = new Map<string, Label>();
    let marked = new Set<string>();

    for (const [stopId, straightM] of originStops) {
        const walkM = walkMetersFromStraight(straightM);
        const label: Label = {
            paradaId: stopId,
            rides: 0,
            walkMeters: walkM,
            rideMeters: 0,
            costMins: rankCostMins(walkM, 0, 0),
            parent: null,
            via: { type: "origin" },
        };
        bestCost.set(stopId, label.costMins);
        bestLabel.set(stopId, label);
        marked.add(stopId);
    }

    const results: Itinerary[] = [];

    for (let k = 1; k <= q.maxRides; k++) {
        /** Etiquetas creadas en esta ronda (la mejor por parada). */
        const improved = new Map<string, Label>();

        // Secuencias que pasan por alguna parada marcada, desde la posición
        // marcada más temprana: cada secuencia se escanea una sola vez.
        const toScan = new Map<number, number>();
        for (const p of marked) {
            const refs = graph.sequencesByParada.get(p);
            if (!refs) continue;
            for (const ref of refs) {
                const seq = graph.sequences[ref.sequenceIdx];
                if (!seq) continue;
                if (bannedSequences.has(`${seq.codLinea}|${seq.ramalKey}`)) continue;
                const cur = toScan.get(ref.sequenceIdx);
                if (cur == null || ref.positionInSequence < cur) {
                    toScan.set(ref.sequenceIdx, ref.positionInSequence);
                }
            }
        }

        for (const [seqIdx, startPos] of toScan) {
            const seq = graph.sequences[seqIdx]!;
            let onboard: { board: Label; boardPos: number; rideAccum: number } | null =
                null;
            let prevLat = 0;
            let prevLng = 0;
            for (let pos = startPos; pos < seq.paradaIds.length; pos++) {
                const stopId = seq.paradaIds[pos]!;
                const coords = graph.paradas.get(stopId);
                if (!coords) continue;

                if (onboard) {
                    onboard.rideAccum += Math.round(
                        haversineMeters(prevLat, prevLng, coords.lat, coords.lng),
                    );
                    const b = onboard.board;
                    const rideM = b.rideMeters + onboard.rideAccum;
                    const cost = rankCostMins(b.walkMeters, rideM, k);
                    if (cost < (bestCost.get(stopId) ?? Number.POSITIVE_INFINITY)) {
                        const label: Label = {
                            paradaId: stopId,
                            rides: k,
                            walkMeters: b.walkMeters,
                            rideMeters: rideM,
                            costMins: cost,
                            parent: b,
                            via: {
                                type: "ride",
                                sequenceIdx: seqIdx,
                                fromPosition: onboard.boardPos,
                                toPosition: pos,
                            },
                        };
                        bestCost.set(stopId, cost);
                        improved.set(stopId, label);
                    }
                }

                // ¿Conviene abordar acá? Solo etiquetas de rondas anteriores
                // (bestLabel se actualiza recién al cerrar la ronda).
                const cand = bestLabel.get(stopId);
                if (
                    cand &&
                    (!onboard ||
                        travelMins(cand.walkMeters, cand.rideMeters) <
                            travelMins(
                                onboard.board.walkMeters,
                                onboard.board.rideMeters + onboard.rideAccum,
                            ))
                ) {
                    onboard = { board: cand, boardPos: pos, rideAccum: 0 };
                }

                prevLat = coords.lat;
                prevLng = coords.lng;
            }
        }

        // Transbordos a pie (un salto) desde los arribos en colectivo de la ronda.
        const afterRides = [...improved.values()];
        for (const lab of afterRides) {
            const nbs = graph.walkNeighbors.get(lab.paradaId);
            if (!nbs) continue;
            for (const nb of nbs) {
                const stepM = walkMetersFromStraight(nb.distMeters);
                const walkM = lab.walkMeters + stepM;
                const cost = rankCostMins(walkM, lab.rideMeters, k);
                if (cost < (bestCost.get(nb.toParadaId) ?? Number.POSITIVE_INFINITY)) {
                    const label: Label = {
                        paradaId: nb.toParadaId,
                        rides: k,
                        walkMeters: walkM,
                        rideMeters: lab.rideMeters,
                        costMins: cost,
                        parent: lab,
                        via: { type: "walk", meters: stepM },
                    };
                    bestCost.set(nb.toParadaId, cost);
                    improved.set(nb.toParadaId, label);
                }
            }
        }

        // Mejor llegada al destino con exactamente k colectivos.
        let roundBest: { lab: Label; walkToDest: number; cost: number } | null = null;
        for (const [stopId, straightToDest] of destStops) {
            const lab = improved.get(stopId);
            if (!lab) continue;
            const walkToDest = walkMetersFromStraight(straightToDest);
            const cost = rankCostMins(lab.walkMeters + walkToDest, lab.rideMeters, k);
            if (!roundBest || cost < roundBest.cost) {
                roundBest = { lab, walkToDest, cost };
            }
        }
        if (roundBest) {
            results.push(reconstruct(graph, roundBest.lab, q, roundBest.walkToDest));
        }

        for (const [stopId, lab] of improved) bestLabel.set(stopId, lab);
        marked = new Set(improved.keys());
        if (marked.size === 0) break;
    }

    return results;
}

function reconstruct(
    graph: RoutingGraph,
    finalLab: Label,
    q: Query,
    walkToDestMeters: number,
): Itinerary {
    const legs: RouteLeg[] = [];
    const finalParada = graph.paradas.get(finalLab.paradaId)!;
    legs.push({
        kind: "walk",
        fromKey: finalLab.paradaId,
        toKey: DEST_KEY,
        fromLat: finalParada.lat,
        fromLng: finalParada.lng,
        toLat: q.destLat,
        toLng: q.destLng,
        meters: walkToDestMeters,
    });

    let cur: Label | null = finalLab;
    while (cur) {
        const via = cur.via;
        if (via.type === "origin") {
            const p = graph.paradas.get(cur.paradaId)!;
            legs.push({
                kind: "walk",
                fromKey: ORIGIN_KEY,
                toKey: cur.paradaId,
                fromLat: q.originLat,
                fromLng: q.originLng,
                toLat: p.lat,
                toLng: p.lng,
                meters: cur.walkMeters,
            });
            break;
        }
        if (via.type === "walk") {
            const from = graph.paradas.get(cur.parent!.paradaId)!;
            const to = graph.paradas.get(cur.paradaId)!;
            legs.push({
                kind: "walk",
                fromKey: cur.parent!.paradaId,
                toKey: cur.paradaId,
                fromLat: from.lat,
                fromLng: from.lng,
                toLat: to.lat,
                toLng: to.lng,
                meters: via.meters,
            });
        } else {
            const seq = graph.sequences[via.sequenceIdx]!;
            const fromId = seq.paradaIds[via.fromPosition]!;
            legs.push({
                kind: "ride",
                sequenceIdx: via.sequenceIdx,
                codLinea: seq.codLinea,
                lineaLabel: seq.lineaLabel,
                ramalKey: seq.ramalKey,
                ramalLabel: seq.ramalLabel,
                fromParadaId: fromId,
                toParadaId: cur.paradaId,
                fromEsquinaLabel: esquinaOf(graph, fromId),
                toEsquinaLabel: esquinaOf(graph, cur.paradaId),
                paradaIdsAlong: seq.paradaIds.slice(via.fromPosition, via.toPosition + 1),
            });
        }
        cur = cur.parent;
    }

    legs.reverse();
    const totalRides = legs.filter((l) => l.kind === "ride").length;
    const totalWalk = legs.reduce((s, l) => s + (l.kind === "walk" ? l.meters : 0), 0);
    let totalRide = 0;
    for (const l of legs) {
        if (l.kind !== "ride") continue;
        for (let i = 0; i < l.paradaIdsAlong.length - 1; i++) {
            const a = graph.paradas.get(l.paradaIdsAlong[i]!);
            const b = graph.paradas.get(l.paradaIdsAlong[i + 1]!);
            if (a && b) {
                totalRide += Math.round(haversineMeters(a.lat, a.lng, b.lat, b.lng));
            }
        }
    }
    return { legs, totalRides, totalWalkMeters: totalWalk, totalRideMeters: totalRide };
}

function sortByCost(itins: Itinerary[]): Itinerary[] {
    return [...itins].sort((a, b) => itineraryRankCost(a) - itineraryRankCost(b));
}

export function planMany(
    graph: RoutingGraph,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    maxRides: number = MAX_RIDES_DEFAULT,
    max: number = 5,
): Itinerary[] {
    const q: Query = { originLat, originLng, destLat, destLng, maxRides };
    const results: Itinerary[] = [];

    // Paradas caminables desde origen/destino: una sola pasada sobre el grafo,
    // compartida por todas las corridas RAPTOR de esta búsqueda.
    const originStops = walkableStops(graph, originLat, originLng);
    const destStops = new Map(walkableStops(graph, destLat, destLng));

    // Caminar directo compite como un itinerario más; el ranking decide.
    const direct = Math.round(haversineMeters(originLat, originLng, destLat, destLng));
    if (direct <= DIRECT_WALK_MAX_METERS) {
        results.push(directWalkItinerary(q, walkMetersFromStraight(direct)));
    }

    const base = sortByCost(runRaptor(graph, q, originStops, destStops, new Set()));
    for (const it of base) addIfNew(results, it);

    const seqIdsOfLines = (lines: Set<string>) =>
        new Set(
            graph.sequences
                .filter((s) => lines.has(s.codLinea))
                .map((s) => `${s.codLinea}|${s.ramalKey}`),
        );

    // Diversidad: re-correr baneando cada línea del mejor itinerario en colectivo.
    const bestTransit = base[0];
    if (bestTransit) {
        const lineIds = new Set(ridesOf(bestTransit).map((r) => r.codLinea));
        for (const line of lineIds) {
            if (results.length >= max) break;
            const variants = runRaptor(
                graph,
                q,
                originStops,
                destStops,
                seqIdsOfLines(new Set([line])),
            );
            const best = sortByCost(variants)[0];
            if (best) addIfNew(results, best);
        }
    }

    // Más diversidad: variar la primera línea que se toma, baneando las ya vistas.
    for (let i = 0; i < 4 && results.length < max; i++) {
        const firstLines = new Set(
            results
                .map((it) => ridesOf(it)[0]?.codLinea)
                .filter((x): x is string => x != null),
        );
        if (firstLines.size === 0) break;
        const variants = runRaptor(graph, q, originStops, destStops, seqIdsOfLines(firstLines));
        const best = sortByCost(variants)[0];
        if (!best || !addIfNew(results, best)) break;
    }

    // Una alternativa muchísimo peor que la mejor solo mete ruido.
    const sorted = sortByCost(results);
    const bestCost = sorted[0] ? itineraryRankCost(sorted[0]) : 0;
    return sorted
        .filter(
            (it) =>
                itineraryRankCost(it) <= bestCost + PRUNE_EXTRA_MINS ||
                itineraryRankCost(it) <= bestCost * PRUNE_FACTOR,
        )
        .slice(0, max);
}
