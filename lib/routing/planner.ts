import { haversineMeters } from "@/lib/geo/haversine";
import type { Itinerary, RouteLeg, RouteLegRide, RoutingGraph } from "@/lib/routing/types";
import { DEST_KEY, ORIGIN_KEY } from "@/lib/routing/types";

const USER_WALK_RADIUS_METERS = 800;
const MAX_RIDES_DEFAULT = 3;
const WALK_COST_FACTOR = 4;

type Query = {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    maxRides: number;
};

type IncomingLink =
    | { type: "origin"; meters: number }
    | { type: "walk"; fromParadaId: string; meters: number }
    | { type: "ride"; sequenceIdx: number; fromPosition: number; toPosition: number };

type Arrival = {
    paradaId: string;
    numRides: number;
    walkMeters: number;
    rideMeters: number;
    incoming: IncomingLink | null;
};

function score(walkM: number, rideM: number): number {
    return walkM * WALK_COST_FACTOR + rideM;
}

function rideKey(r: RouteLegRide): string {
    return `${r.codLinea}|${r.ramalKey}`;
}

function describeItin(it: Itinerary): Set<string> {
    return new Set(
        it.legs.filter((l): l is RouteLegRide => l.kind === "ride").map((l) => rideKey(l)),
    );
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

function directWalkItinerary(
    oLat: number,
    oLng: number,
    dLat: number,
    dLng: number,
    meters: number,
): Itinerary {
    return {
        legs: [
            {
                kind: "walk",
                fromKey: ORIGIN_KEY,
                toKey: DEST_KEY,
                fromLat: oLat,
                fromLng: oLng,
                toLat: dLat,
                toLng: dLng,
                meters,
            },
        ],
        totalRides: 0,
        totalWalkMeters: meters,
        totalRideMeters: 0,
    };
}

function isBetter(candidate: Arrival, current: Arrival | undefined): boolean {
    if (!current) return true;
    if (candidate.numRides !== current.numRides) return candidate.numRides < current.numRides;
    return (
        score(candidate.walkMeters, candidate.rideMeters) <
        score(current.walkMeters, current.rideMeters)
    );
}

function runOnce(
    graph: RoutingGraph,
    q: Query,
    bannedSequences: Set<string>,
    requireFirstLine: string | null,
): Itinerary | null {
    const originStops = walkableStops(graph, q.originLat, q.originLng);
    const destStops = new Map(walkableStops(graph, q.destLat, q.destLng));
    if (originStops.length === 0 || destStops.size === 0) return null;

    const direct = Math.round(
        haversineMeters(q.originLat, q.originLng, q.destLat, q.destLng),
    );
    if (direct <= 800 && bannedSequences.size === 0) {
        return directWalkItinerary(
            q.originLat,
            q.originLng,
            q.destLat,
            q.destLng,
            direct,
        );
    }

    const arrivals = new Map<string, Arrival>();
    for (const [stopId, walkM] of originStops) {
        arrivals.set(stopId, {
            paradaId: stopId,
            numRides: 0,
            walkMeters: walkM,
            rideMeters: 0,
            incoming: { type: "origin", meters: walkM },
        });
    }
    let marked = new Set(originStops.map(([id]) => id));

    for (let k = 1; k <= q.maxRides; k++) {
        const newlyMarked = new Set<string>();
        for (const p of marked) {
            const arrP = arrivals.get(p);
            if (!arrP) continue;
            const refs = graph.sequencesByParada.get(p);
            if (!refs) continue;
            for (const ref of refs) {
                const seq = graph.sequences[ref.sequenceIdx];
                if (!seq) continue;
                const seqId = `${seq.codLinea}|${seq.ramalKey}`;
                if (bannedSequences.has(seqId)) continue;
                if (requireFirstLine != null && k === 1 && seq.codLinea !== requireFirstLine)
                    continue;
                const from = ref.positionInSequence;
                const pCoords = graph.paradas.get(p);
                if (!pCoords) continue;
                let prevLat = pCoords.lat;
                let prevLng = pCoords.lng;
                let rideAccum = 0;
                for (let toPos = from + 1; toPos < seq.paradaIds.length; toPos++) {
                    const target = seq.paradaIds[toPos]!;
                    if (target === p) continue;
                    const targetCoords = graph.paradas.get(target);
                    if (!targetCoords) continue;
                    rideAccum += Math.round(
                        haversineMeters(prevLat, prevLng, targetCoords.lat, targetCoords.lng),
                    );
                    prevLat = targetCoords.lat;
                    prevLng = targetCoords.lng;
                    const candidate: Arrival = {
                        paradaId: target,
                        numRides: k,
                        walkMeters: arrP.walkMeters,
                        rideMeters: arrP.rideMeters + rideAccum,
                        incoming: {
                            type: "ride",
                            sequenceIdx: ref.sequenceIdx,
                            fromPosition: from,
                            toPosition: toPos,
                        },
                    };
                    if (isBetter(candidate, arrivals.get(target))) {
                        arrivals.set(target, candidate);
                        newlyMarked.add(target);
                    }
                }
            }
        }
        for (const p of [...newlyMarked]) {
            const arrP = arrivals.get(p);
            if (!arrP) continue;
            const nbs = graph.walkNeighbors.get(p);
            if (!nbs) continue;
            for (const nb of nbs) {
                const candidate: Arrival = {
                    paradaId: nb.toParadaId,
                    numRides: k,
                    walkMeters: arrP.walkMeters + nb.distMeters,
                    rideMeters: arrP.rideMeters,
                    incoming: { type: "walk", fromParadaId: p, meters: nb.distMeters },
                };
                if (isBetter(candidate, arrivals.get(nb.toParadaId))) {
                    arrivals.set(nb.toParadaId, candidate);
                    newlyMarked.add(nb.toParadaId);
                }
            }
        }
        marked = newlyMarked;
        if (marked.size === 0) break;
    }

    let bestStopId: string | null = null;
    let bestRides = Number.POSITIVE_INFINITY;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const [stopId, walkToDest] of destStops) {
        const arr = arrivals.get(stopId);
        if (!arr || arr.numRides === 0) continue;
        const totalWalk = arr.walkMeters + walkToDest;
        const sc = score(totalWalk, arr.rideMeters);
        if (arr.numRides < bestRides || (arr.numRides === bestRides && sc < bestScore)) {
            bestRides = arr.numRides;
            bestScore = sc;
            bestStopId = stopId;
        }
    }
    if (!bestStopId) return null;
    return reconstruct(
        graph,
        arrivals,
        bestStopId,
        q.originLat,
        q.originLng,
        q.destLat,
        q.destLng,
        destStops.get(bestStopId)!,
    );
}

function reconstruct(
    graph: RoutingGraph,
    arrivals: Map<string, Arrival>,
    finalStopId: string,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    walkToDestMeters: number,
): Itinerary {
    const legs: RouteLeg[] = [];
    const finalParada = graph.paradas.get(finalStopId)!;
    legs.push({
        kind: "walk",
        fromKey: finalStopId,
        toKey: DEST_KEY,
        fromLat: finalParada.lat,
        fromLng: finalParada.lng,
        toLat: destLat,
        toLng: destLng,
        meters: walkToDestMeters,
    });

    let cursor = finalStopId;
    while (true) {
        const arr = arrivals.get(cursor);
        if (!arr) break;
        const link = arr.incoming;
        if (!link) break;
        if (link.type === "origin") {
            const p = graph.paradas.get(cursor)!;
            legs.push({
                kind: "walk",
                fromKey: ORIGIN_KEY,
                toKey: cursor,
                fromLat: originLat,
                fromLng: originLng,
                toLat: p.lat,
                toLng: p.lng,
                meters: link.meters,
            });
            break;
        }
        if (link.type === "walk") {
            const from = graph.paradas.get(link.fromParadaId)!;
            const to = graph.paradas.get(cursor)!;
            legs.push({
                kind: "walk",
                fromKey: link.fromParadaId,
                toKey: cursor,
                fromLat: from.lat,
                fromLng: from.lng,
                toLat: to.lat,
                toLng: to.lng,
                meters: link.meters,
            });
            cursor = link.fromParadaId;
            continue;
        }
        if (link.type === "ride") {
            const seq = graph.sequences[link.sequenceIdx]!;
            const fromId = seq.paradaIds[link.fromPosition]!;
            const along = seq.paradaIds.slice(link.fromPosition, link.toPosition + 1);
            legs.push({
                kind: "ride",
                sequenceIdx: link.sequenceIdx,
                codLinea: seq.codLinea,
                lineaLabel: seq.lineaLabel,
                ramalKey: seq.ramalKey,
                ramalLabel: seq.ramalLabel,
                fromParadaId: fromId,
                toParadaId: cursor,
                fromEsquinaLabel: esquinaOf(graph, fromId),
                toEsquinaLabel: esquinaOf(graph, cursor),
                paradaIdsAlong: along,
            });
            cursor = fromId;
            continue;
        }
        break;
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

export function planMany(
    graph: RoutingGraph,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    maxRides: number = MAX_RIDES_DEFAULT,
    max: number = 5,
): Itinerary[] {
    const baseQuery: Query = { originLat, originLng, destLat, destLng, maxRides };
    const results: Itinerary[] = [];

    const first = runOnce(graph, baseQuery, new Set(), null);
    if (!first) return [];

    results.push(first);
    const ridesInBase = first.legs.filter((l): l is RouteLegRide => l.kind === "ride");
    const seqIdsInBase = new Set(ridesInBase.map((r) => rideKey(r)));
    const lineIdsInBase = new Set(ridesInBase.map((r) => r.codLinea));

    for (const banned of seqIdsInBase) {
        if (results.length >= max) break;
        const variant = runOnce(graph, baseQuery, new Set([banned]), null);
        if (variant) addIfNew(results, variant);
    }

    for (const lineToBan of lineIdsInBase) {
        if (results.length >= max) break;
        const bannedSeqs = new Set(
            graph.sequences
                .filter((s) => s.codLinea === lineToBan)
                .map((s) => `${s.codLinea}|${s.ramalKey}`),
        );
        const variant = runOnce(graph, baseQuery, bannedSeqs, null);
        if (variant) addIfNew(results, variant);
    }

    if (results.length < max && lineIdsInBase.size >= 2) {
        const bannedSeqs = new Set(
            graph.sequences
                .filter((s) => lineIdsInBase.has(s.codLinea))
                .map((s) => `${s.codLinea}|${s.ramalKey}`),
        );
        const variant = runOnce(graph, baseQuery, bannedSeqs, null);
        if (variant) addIfNew(results, variant);
    }

    const originStopsAll = new Set(walkableStops(graph, originLat, originLng).map(([id]) => id));
    const linesNearOrigin = new Set<string>();
    for (const stopId of originStopsAll) {
        const refs = graph.sequencesByParada.get(stopId);
        if (!refs) continue;
        for (const ref of refs) {
            linesNearOrigin.add(graph.sequences[ref.sequenceIdx]!.codLinea);
        }
    }

    for (const line of linesNearOrigin) {
        if (results.length >= max) break;
        const alreadyAsFirst = results.some((it) => {
            const fr = it.legs.find((l) => l.kind === "ride");
            return fr && fr.kind === "ride" && fr.codLinea === line;
        });
        if (alreadyAsFirst) continue;
        const variant = runOnce(graph, baseQuery, new Set(), line);
        if (variant) addIfNew(results, variant);
    }

    return results
        .sort(
            (a, b) =>
                a.totalRides - b.totalRides ||
                score(a.totalWalkMeters, a.totalRideMeters) -
                    score(b.totalWalkMeters, b.totalRideMeters),
        )
        .slice(0, max);
}
