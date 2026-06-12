/**
 * Modelo de costos único para el planner y la UI: lo que el algoritmo optimiza
 * es exactamente lo que el usuario ve como minutos estimados. Solo aritmética
 * pura — se importa tanto desde el server (planner) como desde el cliente.
 */

import type { Itinerary } from "@features/trip-planner/types";

/** Velocidad de caminata: ~4,2 km/h. */
export const WALK_METERS_PER_MIN = 70;

/** Velocidad media del colectivo en ciudad (incluye semáforos y paradas): ~19 km/h. */
export const RIDE_METERS_PER_MIN = 320;

/** La caminata real por la cuadrícula es más larga que la línea recta. */
export const WALK_DETOUR_FACTOR = 1.3;

/** Espera + abordaje promedio por cada colectivo que se toma. */
export const BOARDING_OVERHEAD_MINS = 4;

/**
 * Molestia extra de cada transbordo al rankear (riesgo de espera, bajarse y
 * volver a subir). No se muestra como tiempo: solo inclina la comparación.
 */
export const TRANSFER_PENALTY_MINS = 3;

/** Metros de caminata estimados a partir de una distancia en línea recta. */
export function walkMetersFromStraight(straightMeters: number): number {
    return Math.round(straightMeters * WALK_DETOUR_FACTOR);
}

/** Minutos en movimiento (caminando + arriba del bondi), sin esperas. */
export function travelMins(walkMeters: number, rideMeters: number): number {
    return walkMeters / WALK_METERS_PER_MIN + rideMeters / RIDE_METERS_PER_MIN;
}

/** Minutos estimados de puerta a puerta (lo que ve el usuario). */
export function estimateMins(
    walkMeters: number,
    rideMeters: number,
    rides: number,
): number {
    return travelMins(walkMeters, rideMeters) + rides * BOARDING_OVERHEAD_MINS;
}

/**
 * Minutos estimados por tramo (para la UI). Los tramos de bondi no traen
 * metros propios, así que `totalRideMeters` se reparte proporcional a la
 * cantidad de paradas.
 */
export function estimateLegMins(it: Itinerary): number[] {
    const totalRideStops = it.legs.reduce(
        (acc, leg) =>
            acc + (leg.kind === "ride" ? Math.max(1, leg.paradaIdsAlong.length - 1) : 0),
        0,
    );
    return it.legs.map((leg) => {
        if (leg.kind === "walk") {
            return Math.max(1, Math.round(leg.meters / WALK_METERS_PER_MIN));
        }
        const stops = Math.max(1, leg.paradaIdsAlong.length - 1);
        const meters = totalRideStops > 0 ? (it.totalRideMeters * stops) / totalRideStops : 0;
        return Math.max(
            1,
            Math.round(meters / RIDE_METERS_PER_MIN + BOARDING_OVERHEAD_MINS),
        );
    });
}

/** Costo con el que el planner compara y ordena itinerarios. */
export function rankCostMins(
    walkMeters: number,
    rideMeters: number,
    rides: number,
): number {
    return (
        estimateMins(walkMeters, rideMeters, rides) +
        Math.max(0, rides - 1) * TRANSFER_PENALTY_MINS
    );
}

export function itineraryRankCost(it: Itinerary): number {
    return rankCostMins(it.totalWalkMeters, it.totalRideMeters, it.totalRides);
}
