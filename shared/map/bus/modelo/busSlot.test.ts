import { describe, expect, it } from "vitest";
import { Vector3 } from "three";

import { aplicarOrientacion, crearSlot, TILT } from "@shared/map/bus/modelo/busSlot";
import { BUS_LARGO_MODELO } from "@shared/map/bus/modelo/busMesh";

/**
 * Dónde cae un punto de la malla, en coordenadas de mundo (que son las del
 * cuadro renderizado: +X a la derecha, +Y hacia arriba, +Z hacia el
 * observador).
 *
 * Se le pasa un punto en el espacio local del bondi — donde +X es la trompa,
 * +Y el lado izquierdo y +Z el techo — y devuelve dónde termina después de
 * aplicar el rumbo y la inclinación de la vista.
 */
function aPantalla(bearing: number, local: [number, number, number]): Vector3 {
    const slot = crearSlot();
    aplicarOrientacion(slot, bearing);
    slot.holder.updateMatrixWorld(true);
    return slot.giro.localToWorld(new Vector3(...local));
}

/** Punta de la trompa, sobre el eje longitudinal. */
const TROMPA: [number, number, number] = [BUS_LARGO_MODELO / 2, 0, 0];
/** Un punto del techo, sobre el centro. */
const TECHO: [number, number, number] = [0, 0, 3];

describe("aplicarOrientacion — rumbo", () => {
    it("yendo al este pone la trompa a la derecha", () => {
        const p = aPantalla(90, TROMPA);
        expect(p.x).toBeGreaterThan(1);
        expect(p.y).toBeCloseTo(0, 6);
    });

    it("yendo al oeste pone la trompa a la izquierda", () => {
        const p = aPantalla(270, TROMPA);
        expect(p.x).toBeLessThan(-1);
        expect(p.y).toBeCloseTo(0, 6);
    });

    it("yendo al norte pone la trompa para arriba en pantalla", () => {
        const p = aPantalla(0, TROMPA);
        expect(p.y).toBeGreaterThan(1);
        expect(p.x).toBeCloseTo(0, 6);
    });

    it("yendo al sur pone la trompa para abajo en pantalla", () => {
        const p = aPantalla(180, TROMPA);
        expect(p.y).toBeLessThan(-1);
        expect(p.x).toBeCloseTo(0, 6);
    });

    it("achata el eje norte-sur según la inclinación de la vista", () => {
        // Es el efecto que hace que se lea como perspectiva: lo que va en el
        // sentido de la profundidad se ve más corto que lo que va de costado.
        const alEste = aPantalla(90, TROMPA);
        const alNorte = aPantalla(0, TROMPA);
        expect(alNorte.y).toBeCloseTo(alEste.x * Math.cos(TILT), 6);
        expect(alNorte.y).toBeLessThan(alEste.x);
    });
});

describe("aplicarOrientacion — volumen", () => {
    it("dibuja el techo por encima del piso", () => {
        expect(aPantalla(90, TECHO).y).toBeGreaterThan(0);
    });

    it("deja el techo más cerca del observador que el piso", () => {
        // Es lo que hace que el painter del script dibuje el techo último y
        // no lo tape el chasis.
        const techo = aPantalla(90, TECHO);
        const piso = aPantalla(90, [0, 0, 0]);
        expect(techo.z).toBeGreaterThan(piso.z);
    });
});
