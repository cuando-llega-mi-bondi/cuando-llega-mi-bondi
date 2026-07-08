import { describe, expect, it } from "vitest";

import { haversineMeters } from "@shared/geo/haversine";

/** 1° de latitud sobre la esfera de 6371 km: 6_371_000 · π / 180. */
const METERS_PER_DEG_LAT = (6_371_000 * Math.PI) / 180;

describe("haversineMeters", () => {
    it("da 0 entre un punto y sí mismo", () => {
        expect(haversineMeters(-38.0, -57.55, -38.0, -57.55)).toBe(0);
    });

    it("mide 1° de latitud como ~111,19 km", () => {
        expect(haversineMeters(-38.0, -57.55, -39.0, -57.55)).toBeCloseTo(
            METERS_PER_DEG_LAT,
            0,
        );
    });

    it("mide 0,001° de latitud como ~111 m (escala de cuadra)", () => {
        expect(haversineMeters(-38.0, -57.55, -38.001, -57.55)).toBeCloseTo(
            METERS_PER_DEG_LAT / 1000,
            1,
        );
    });

    it("acorta la longitud según el coseno de la latitud", () => {
        const enEcuador = haversineMeters(0, 0, 0, 0.001);
        const enMdp = haversineMeters(-38.0, -57.55, -38.0, -57.549);
        expect(enMdp / enEcuador).toBeCloseTo(Math.cos((38 * Math.PI) / 180), 3);
    });

    it("es simétrica", () => {
        const ida = haversineMeters(-38.0, -57.55, -38.01, -57.54);
        const vuelta = haversineMeters(-38.01, -57.54, -38.0, -57.55);
        expect(ida).toBe(vuelta);
    });
});
