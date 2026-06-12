import { describe, expect, it } from "vitest";

import {
    BOARDING_OVERHEAD_MINS,
    TRANSFER_PENALTY_MINS,
    estimateLegMins,
    estimateMins,
    itineraryRankCost,
    rankCostMins,
    travelMins,
    walkMetersFromStraight,
} from "@features/trip-planner/lib/costModel";
import type { Itinerary, RouteLeg } from "@features/trip-planner/types";

function walkLeg(meters: number): RouteLeg {
    return {
        kind: "walk",
        fromKey: "a",
        toKey: "b",
        fromLat: 0,
        fromLng: 0,
        toLat: 0,
        toLng: 0,
        meters,
    };
}

function rideLeg(stops: number, meters = 0): RouteLeg {
    return {
        kind: "ride",
        sequenceIdx: 0,
        codLinea: "X",
        lineaLabel: "Línea X",
        ramalKey: "x",
        ramalLabel: "Ramal X",
        fromParadaId: "p0",
        toParadaId: `p${stops}`,
        fromEsquinaLabel: null,
        toEsquinaLabel: null,
        paradaIdsAlong: Array.from({ length: stops + 1 }, (_, i) => `p${i}`),
        meters,
    };
}

function itinerary(legs: RouteLeg[]): Itinerary {
    return {
        legs,
        totalRides: legs.filter((l) => l.kind === "ride").length,
        totalWalkMeters: legs.reduce(
            (s, l) => s + (l.kind === "walk" ? l.meters : 0),
            0,
        ),
        totalRideMeters: legs.reduce(
            (s, l) => s + (l.kind === "ride" ? l.meters : 0),
            0,
        ),
    };
}

describe("walkMetersFromStraight", () => {
    it("aplica el factor de desvío por cuadrícula y redondea", () => {
        expect(walkMetersFromStraight(100)).toBe(130);
        expect(walkMetersFromStraight(0)).toBe(0);
    });
});

describe("travelMins", () => {
    it("suma caminata a 70 m/min y viaje a 320 m/min", () => {
        expect(travelMins(70, 320)).toBe(2);
        expect(travelMins(0, 0)).toBe(0);
    });
});

describe("estimateMins", () => {
    it("agrega el overhead de abordaje por cada colectivo", () => {
        expect(estimateMins(140, 640, 2)).toBe(2 + 2 + 2 * BOARDING_OVERHEAD_MINS);
        expect(estimateMins(140, 0, 0)).toBe(2);
    });
});

describe("rankCostMins", () => {
    it("no penaliza el primer colectivo: penalidad solo por transbordo", () => {
        expect(rankCostMins(0, 0, 0)).toBe(0);
        expect(rankCostMins(0, 0, 1)).toBe(BOARDING_OVERHEAD_MINS);
        expect(rankCostMins(0, 0, 2)).toBe(
            2 * BOARDING_OVERHEAD_MINS + TRANSFER_PENALTY_MINS,
        );
        expect(rankCostMins(0, 0, 3)).toBe(
            3 * BOARDING_OVERHEAD_MINS + 2 * TRANSFER_PENALTY_MINS,
        );
    });

    it("la penalidad de transbordo no se muestra: estimateMins queda igual", () => {
        expect(estimateMins(0, 0, 2)).toBe(2 * BOARDING_OVERHEAD_MINS);
        expect(rankCostMins(0, 0, 2)).toBeGreaterThan(estimateMins(0, 0, 2));
    });
});

describe("itineraryRankCost", () => {
    it("coincide con rankCostMins sobre los totales del itinerario", () => {
        const it7 = itinerary([walkLeg(140), rideLeg(2, 640), walkLeg(70)]);
        expect(itineraryRankCost(it7)).toBe(rankCostMins(210, 640, 1));
    });
});

describe("estimateLegMins", () => {
    it("estima cada caminata con un piso de 1 minuto", () => {
        const it = itinerary([walkLeg(35)]);
        expect(estimateLegMins(it)).toEqual([1]);

        const larga = itinerary([walkLeg(700)]);
        expect(estimateLegMins(larga)).toEqual([10]);
    });

    it("usa los metros reales de cada tramo de bondi", () => {
        const it = itinerary([walkLeg(140), rideLeg(2, 640), rideLeg(1, 320), walkLeg(70)]);
        expect(estimateLegMins(it)).toEqual([
            2,
            Math.round(640 / 320 + BOARDING_OVERHEAD_MINS),
            Math.round(320 / 320 + BOARDING_OVERHEAD_MINS),
            1,
        ]);
    });

    it("un tramo largo de pocas paradas no se subestima frente a uno corto de muchas", () => {
        // 8 paradas céntricas en 1,5 km vs 4 paradas interurbanas en 12 km.
        const it = itinerary([rideLeg(8, 1500), rideLeg(3, 12_000)]);
        expect(estimateLegMins(it)).toEqual([
            Math.round(1500 / 320 + BOARDING_OVERHEAD_MINS),
            Math.round(12_000 / 320 + BOARDING_OVERHEAD_MINS),
        ]);
    });

    it("sin metros de viaje, un ride vale al menos el overhead de abordaje", () => {
        const it = itinerary([rideLeg(1)]);
        expect(estimateLegMins(it)).toEqual([BOARDING_OVERHEAD_MINS]);
    });
});
