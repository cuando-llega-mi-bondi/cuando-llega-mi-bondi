import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { headingFromRoute, type LatLngTuple } from "@shared/map/bus/busHeading";

/**
 * Regresión sobre datos reales: orientar todos los bondis contra una sola
 * traza deja a los de la bandera contraria mirando 180° al revés.
 *
 * Se usa el dump estático de la 522, que es el caso que lo destapó: cuatro
 * banderas en dos pares antiparalelos sobre la misma avenida.
 */

type Punto = { Latitud: number; Longitud: number };
type Ramal = { key: string; label: string; puntos: Punto[] };

/** 101 es el `CodigoLineaParada` de la línea 522. */
const LINEA_522 = "./data/static/linea/101.json";

function ramalesDe522(): Ramal[] {
    const raw = JSON.parse(readFileSync(LINEA_522, "utf8"));
    return raw.recorrido.ramales as Ramal[];
}

function puntosDe(ramales: Ramal[], label: string): LatLngTuple[] {
    const r = ramales.find((x) => x.label === label);
    if (!r) throw new Error(`no está la bandera ${label} en el dump`);
    return r.puntos.map((p) => [p.Latitud, p.Longitud] as LatLngTuple);
}

/** Diferencia angular absoluta entre dos rumbos, en [0, 180]. */
function separacion(a: number, b: number): number {
    return Math.abs(((b - a + 540) % 360) - 180);
}

/** El vértice de `a` que cae más cerca de algún vértice de `b`. */
function puntoCompartido(a: LatLngTuple[], b: LatLngTuple[]): LatLngTuple {
    let mejor = a[0];
    let mejorDist = Infinity;
    for (const p of a) {
        for (const q of b) {
            const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
            if (d < mejorDist) {
                mejorDist = d;
                mejor = p;
            }
        }
    }
    return mejor;
}

describe("rumbo según la bandera del arribo (522)", () => {
    const ramales = ramalesDe522();
    const ida = puntosDe(ramales, "AL FARO");
    const vuelta = puntosDe(ramales, "A BERUTI Y 228");

    it("las dos banderas del par recorren el mismo corredor", () => {
        const p = puntoCompartido(ida, vuelta);
        expect(p).toBeDefined();
    });

    it("un mismo punto da rumbos opuestos según la bandera", () => {
        // Es exactamente el bug: el bondi está sobre la avenida y su rumbo
        // depende de por cuál de las dos banderas viene.
        const p = puntoCompartido(ida, vuelta);
        const hIda = headingFromRoute(p, ida);
        const hVuelta = headingFromRoute(p, vuelta);

        expect(hIda).not.toBeNull();
        expect(hVuelta).not.toBeNull();
        expect(
            separacion(hIda ?? 0, hVuelta ?? 0),
        ).toBeGreaterThan(135);
    });

    it("cada bandera avanza hacia su destino", () => {
        // "AL FARO" baja hacia el sur y "A BERUTI Y 228" sube hacia el norte:
        // si el orden crudo de los vértices dejara de ser el de circulación,
        // esto se rompe y con eso se cae la premisa del cálculo de rumbo.
        expect(ida[ida.length - 1][0]).toBeLessThan(ida[0][0]);
        expect(vuelta[vuelta.length - 1][0]).toBeGreaterThan(vuelta[0][0]);

        const medioIda = ida[Math.floor(ida.length / 2)];
        const hIda = headingFromRoute(medioIda, ida);
        // Rumbo sur: entre sudeste y sudoeste.
        expect(hIda).toBeGreaterThan(90);
        expect(hIda).toBeLessThan(270);

        const medioVuelta = vuelta[Math.floor(vuelta.length / 2)];
        const hVuelta = headingFromRoute(medioVuelta, vuelta);
        // Rumbo norte: fuera del arco sur.
        expect(
            (hVuelta ?? 0) < 90 || (hVuelta ?? 0) > 270,
        ).toBe(true);
    });
});
