import { describe, expect, it } from "vitest";

import { haversineMeters } from "@shared/geo/haversine";
import { itineraryRankCost } from "@features/trip-planner/lib/costModel";
import { planMany } from "@features/trip-planner/lib/planner";
import type {
    Itinerary,
    ParadaGeo,
    RouteLegRide,
    RoutingGraph,
    SequenceRef,
    StopSequence,
    WalkNeighbor,
} from "@features/trip-planner/types";
import { DEST_KEY, ORIGIN_KEY } from "@features/trip-planner/types";

/**
 * Grafo fixture: dos líneas que se cruzan en A7 (misma parada física).
 *
 *   Línea A (norte→sur, lng -57.55):  A1 A2 A3 A4 A5 A6 A7   (~222 m entre paradas)
 *   Línea B (oeste→este, lat -38.012):       A7 B2 B3 B4 B5  (~219 m entre paradas)
 *
 * Las distancias replican el catálogo real: paradas consecutivas quedan a menos
 * de los 300 m de radio de transbordo a pie.
 */
const STOPS: Record<string, { lat: number; lng: number }> = {
    A1: { lat: -38.0, lng: -57.55 },
    A2: { lat: -38.002, lng: -57.55 },
    A3: { lat: -38.004, lng: -57.55 },
    A4: { lat: -38.006, lng: -57.55 },
    A5: { lat: -38.008, lng: -57.55 },
    A6: { lat: -38.01, lng: -57.55 },
    A7: { lat: -38.012, lng: -57.55 },
    B2: { lat: -38.012, lng: -57.5475 },
    B3: { lat: -38.012, lng: -57.545 },
    B4: { lat: -38.012, lng: -57.5425 },
    B5: { lat: -38.012, lng: -57.54 },
};

const LINE_A = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
const LINE_B = ["A7", "B2", "B3", "B4", "B5"];

const WALK_RADIUS_METERS = 300;

function buildFixtureGraph(): RoutingGraph {
    const paradas = new Map<string, ParadaGeo>(
        Object.entries(STOPS).map(([id, { lat, lng }]) => [
            id,
            {
                identificador: id,
                lat,
                lng,
                abreviaturaBandera: null,
                calleLabel: null,
                interseccionLabel: null,
                lineas: [],
            },
        ]),
    );

    const sequences: StopSequence[] = [
        {
            codLinea: "A",
            lineaLabel: "Línea A",
            ramalKey: "a-ida",
            ramalLabel: "Ida",
            paradaIds: LINE_A,
            polylineLatLng: LINE_A.map((id) => [STOPS[id]!.lat, STOPS[id]!.lng]),
        },
        {
            codLinea: "B",
            lineaLabel: "Línea B",
            ramalKey: "b-ida",
            ramalLabel: "Ida",
            paradaIds: LINE_B,
            polylineLatLng: LINE_B.map((id) => [STOPS[id]!.lat, STOPS[id]!.lng]),
        },
    ];

    const sequencesByParada = new Map<string, SequenceRef[]>();
    sequences.forEach((seq, sequenceIdx) => {
        seq.paradaIds.forEach((paradaId, positionInSequence) => {
            const list = sequencesByParada.get(paradaId) ?? [];
            list.push({ sequenceIdx, positionInSequence });
            sequencesByParada.set(paradaId, list);
        });
    });

    // Vecinos a pie por fuerza bruta: el fixture es chico, no hace falta grilla.
    const walkNeighbors = new Map<string, WalkNeighbor[]>();
    for (const [id, p] of Object.entries(STOPS)) {
        const neighbors: WalkNeighbor[] = [];
        for (const [otherId, q] of Object.entries(STOPS)) {
            if (otherId === id) continue;
            const d = haversineMeters(p.lat, p.lng, q.lat, q.lng);
            if (d <= WALK_RADIUS_METERS) {
                neighbors.push({ toParadaId: otherId, distMeters: Math.round(d) });
            }
        }
        if (neighbors.length > 0) {
            neighbors.sort((a, b) => a.distMeters - b.distMeters);
            walkNeighbors.set(id, neighbors);
        }
    }

    return { sequences, sequencesByParada, walkNeighbors, paradas };
}

const GRAPH = buildFixtureGraph();

/** A metros del id dado (para armar origen/destino pegados a una parada). */
function near(id: string): { lat: number; lng: number } {
    const p = STOPS[id]!;
    return { lat: p.lat - 0.0001, lng: p.lng - 0.0001 };
}

function rides(it: Itinerary): RouteLegRide[] {
    return it.legs.filter((l): l is RouteLegRide => l.kind === "ride");
}

describe("planMany — un colectivo directo", () => {
    const origin = near("A1");
    const dest = near("A5");
    const results = planMany(GRAPH, origin.lat, origin.lng, dest.lat, dest.lng);

    it("encuentra al menos un itinerario", () => {
        expect(results.length).toBeGreaterThan(0);
    });

    it("el mejor toma la línea A de A1 a A5, sin transbordos", () => {
        const best = results[0]!;
        expect(best.totalRides).toBe(1);
        const [ride] = rides(best);
        expect(ride!.codLinea).toBe("A");
        expect(ride!.fromParadaId).toBe("A1");
        expect(ride!.toParadaId).toBe("A5");
        expect(ride!.paradaIdsAlong).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    });

    it("los legs van de ORIGIN_KEY a DEST_KEY", () => {
        const best = results[0]!;
        expect(best.legs[0]).toMatchObject({ kind: "walk", fromKey: ORIGIN_KEY });
        expect(best.legs[best.legs.length - 1]).toMatchObject({
            kind: "walk",
            toKey: DEST_KEY,
        });
    });

    it("ofrece caminar directo como alternativa (~890 m, dentro del umbral)", () => {
        expect(results.some((it) => it.totalRides === 0)).toBe(true);
    });

    it("devuelve los itinerarios ordenados por costo de ranking", () => {
        const costs = results.map(itineraryRankCost);
        expect(costs).toEqual([...costs].sort((a, b) => a - b));
    });

    it("los totales son consistentes con los legs", () => {
        for (const it of results) {
            expect(it.totalRides).toBe(rides(it).length);
            const walkSum = it.legs.reduce(
                (s, l) => s + (l.kind === "walk" ? l.meters : 0),
                0,
            );
            expect(it.totalWalkMeters).toBe(walkSum);
            const rideSum = rides(it).reduce((s, l) => s + l.meters, 0);
            expect(it.totalRideMeters).toBe(rideSum);
        }
    });
});

describe("planMany — transbordo entre líneas", () => {
    const origin = near("A1");
    const dest = near("B5");
    const results = planMany(GRAPH, origin.lat, origin.lng, dest.lat, dest.lng);

    it("el mejor itinerario combina la línea A y la B", () => {
        const best = results[0]!;
        expect(best.totalRides).toBe(2);
        expect(rides(best).map((r) => r.codLinea)).toEqual(["A", "B"]);
    });

    it("el transbordo es en A7, la parada compartida", () => {
        const [primero, segundo] = rides(results[0]!);
        expect(primero!.toParadaId).toBe("A7");
        expect(segundo!.fromParadaId).toBe("A7");
        expect(segundo!.toParadaId).toBe("B5");
    });

    it("no ofrece caminar directo: el destino queda a más de 1200 m", () => {
        expect(results.every((it) => it.totalRides > 0)).toBe(true);
    });

    it("no repite combinaciones de líneas entre alternativas", () => {
        const keys = results.map((it) =>
            rides(it)
                .map((r) => `${r.codLinea}|${r.ramalKey}`)
                .sort()
                .join(","),
        );
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("planMany — límites", () => {
    it("con maxRides=1 ningún itinerario usa dos colectivos", () => {
        const origin = near("A1");
        const dest = near("B5");
        const results = planMany(GRAPH, origin.lat, origin.lng, dest.lat, dest.lng, 1);
        expect(results.length).toBeGreaterThan(0);
        for (const it of results) {
            expect(it.totalRides).toBeLessThanOrEqual(1);
        }
    });

    it("en distancias cortas gana caminar: el abordaje no amortiza", () => {
        const origin = near("A1");
        const dest = near("A2");
        const results = planMany(GRAPH, origin.lat, origin.lng, dest.lat, dest.lng);
        expect(results[0]!.totalRides).toBe(0);
    });

    it("sin paradas alcanzables ni caminata posible devuelve vacío", () => {
        const dest = near("A1");
        // Origen a ~11 km de la red.
        const results = planMany(GRAPH, -37.9, -57.55, dest.lat, dest.lng);
        expect(results).toEqual([]);
    });
});
