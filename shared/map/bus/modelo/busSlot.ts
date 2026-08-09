/**
 * Orientación del bondi en la escena de render.
 *
 * Sólo lo usa `scripts/render-bus-sprites.ts`: es la parte del modelo que
 * decide hacia dónde mira el vehículo en cada cuadro del sprite sheet. No
 * entra en el bundle de la app.
 *
 * Está separado del script porque es pura matemática de rotaciones y es lo
 * más fácil de equivocar sin que se note: un signo invertido deja los bondis
 * andando de culata. Acá se puede testear sin WebGL.
 *
 * Cada rotación vive en su propio nivel porque se aplica en un espacio
 * distinto, y el orden importa:
 *
 *   holder   raíz
 *   └ tilt   inclina la vista a tres cuartos (fijo para todos los cuadros)
 *     └ giro rumbo, sobre el plano del piso
 */

import { Group } from "three";
import { createBusMesh } from "./busMesh";

const RAD = Math.PI / 180;

/** Inclinación de la vista. 52° deja ver techo y lateral sin achatar la planta. */
export const TILT = 52 * RAD;

export type BusSlot = {
    holder: Group;
    giro: Group;
};

export function crearSlot(): BusSlot {
    const holder = new Group();
    const tilt = new Group();
    const giro = new Group();

    tilt.rotation.x = -TILT;
    giro.add(createBusMesh());
    tilt.add(giro);
    holder.add(tilt);

    return { holder, giro };
}

/**
 * Apunta el bondi según su rumbo geográfico.
 *
 * El rumbo (0 = norte, sentido horario) se convierte a una rotación sobre el
 * plano del piso (0 = +X = este, sentido antihorario): de ahí el `π/2 − rumbo`.
 */
export function aplicarOrientacion(slot: BusSlot, bearing: number): void {
    slot.giro.rotation.z = Math.PI / 2 - bearing * RAD;
}
