import { describe, expect, it } from "vitest";

import {
    bearingBetween,
    headingFromRoute,
    headingHaciaParada,
    type LatLngTuple,
} from "@shared/map/bus/busHeading";

/** Punto de referencia en Mar del Plata: todas las trazas salen de acá. */
const LAT = -38.0;
const LNG = -57.55;

describe("bearingBetween", () => {
    it("da 0 hacia el norte y 180 hacia el sur", () => {
        expect(bearingBetween([LAT, LNG], [LAT + 0.01, LNG])).toBeCloseTo(0, 4);
        expect(bearingBetween([LAT, LNG], [LAT - 0.01, LNG])).toBeCloseTo(180, 4);
    });

    it("da 90 hacia el este y 270 hacia el oeste", () => {
        expect(bearingBetween([LAT, LNG], [LAT, LNG + 0.01])).toBeCloseTo(90, 2);
        expect(bearingBetween([LAT, LNG], [LAT, LNG - 0.01])).toBeCloseTo(270, 2);
    });

    it("normaliza siempre a [0, 360)", () => {
        for (const destino of [
            [LAT + 0.01, LNG - 0.01],
            [LAT - 0.01, LNG - 0.01],
            [LAT - 0.01, LNG + 0.01],
        ] as LatLngTuple[]) {
            const b = bearingBetween([LAT, LNG], destino);
            expect(b).toBeGreaterThanOrEqual(0);
            expect(b).toBeLessThan(360);
        }
    });
});

describe("headingFromRoute", () => {
    /** Traza recta hacia el este. */
    const recta: LatLngTuple[] = [
        [LAT, LNG - 0.01],
        [LAT, LNG],
        [LAT, LNG + 0.01],
    ];

    it("devuelve null si la traza no tiene al menos un segmento", () => {
        expect(headingFromRoute([LAT, LNG], [])).toBeNull();
        expect(headingFromRoute([LAT, LNG], [[LAT, LNG]])).toBeNull();
    });

    it("toma el rumbo del segmento en una recta", () => {
        expect(headingFromRoute([LAT - 0.0001, LNG - 0.005], recta)).toBeCloseTo(
            90,
            2,
        );
    });

    it("elige el segmento más cercano y no el primero", () => {
        // Traza en U: este por arriba, baja, y vuelve al oeste por abajo.
        const enU: LatLngTuple[] = [
            [LAT, LNG - 0.01],
            [LAT, LNG + 0.01],
            [LAT - 0.02, LNG + 0.01],
            [LAT - 0.02, LNG - 0.01],
        ];
        // El bondi está sobre el tramo de vuelta, que va hacia el oeste.
        // La tolerancia es de una décima porque el rumbo inicial de un círculo
        // máximo sobre un paralelo no da 270 exacto: se desvía unas milésimas
        // de grado, y acá el segmento mide 0,02°.
        expect(headingFromRoute([LAT - 0.0201, LNG], enU)).toBeCloseTo(270, 1);
    });

    it("corrige la longitud por coseno de la latitud al medir distancias", () => {
        // Dos segmentos paralelos: uno al norte separado en latitud, otro al
        // sur separado en longitud. A esta latitud un grado de longitud mide
        // ~79% de uno de latitud, así que sin corregir se elegiría mal.
        const paralelos: LatLngTuple[] = [
            // Segmento 0: hacia el este, 0.004° al norte del bondi.
            [LAT + 0.004, LNG - 0.01],
            [LAT + 0.004, LNG + 0.01],
        ];
        expect(headingFromRoute([LAT, LNG], paralelos)).toBeCloseTo(90, 1);

        // Con la corrección, 0.0045° de longitud (~0.00355° de latitud
        // equivalentes) queda más cerca que 0.004° de latitud.
        const conRamalOeste: LatLngTuple[] = [
            ...paralelos,
            [LAT - 0.02, LNG - 0.0045],
            [LAT + 0.02, LNG - 0.0045],
        ];
        expect(headingFromRoute([LAT, LNG], conRamalOeste)).toBeCloseTo(0, 2);
    });
});

describe("headingHaciaParada", () => {
    it("apunta el bondi a la parada", () => {
        expect(headingHaciaParada([LAT, LNG], [LAT + 0.01, LNG])).toBeCloseTo(0, 4);
    });

    it("sin parada no inventa un rumbo raro", () => {
        const b = headingHaciaParada([LAT, LNG], null);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
    });
});
