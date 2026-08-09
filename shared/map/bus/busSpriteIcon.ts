/**
 * Marcador del bondi: un cuadro del sprite sheet elegido según el rumbo.
 *
 * El sprite lo genera `scripts/render-bus-sprites.ts` proyectando el modelo
 * 3D a 16 orientaciones. Acá no hay nada tridimensional en runtime — es un
 * `background-position` sobre un SVG cacheado — pero se ve igual que si lo
 * hubiera, y sin los ~150KB de una biblioteca de render.
 *
 * El punto GPS cae en el centro del cuadro: el modelo se proyecta centrado en
 * su origen, que está sobre el piso del vehículo. Por eso el ancla es siempre
 * el centro, sin importar hacia dónde mire.
 */

import L from "leaflet";
import { SPRITE } from "./spriteMeta";

/**
 * Largo del bondi en pantalla.
 *
 * Fijo y no atado al zoom: a escala real el bondi mide 6px a zoom 16 —el que
 * queda al elegir una parada— así que cualquier fórmula terminaba recortada
 * contra el mínimo en todos los zooms usables. Un tamaño constante además es
 * coherente con el resto de los marcadores del mapa, que tampoco escalan.
 */
const LARGO_PX = 48;

/** Cuánto ocupa el cuadro completo para un bondi de `LARGO_PX` de largo. */
const CELDA_PX = (LARGO_PX * SPRITE.celda) / SPRITE.largoBus;

const PASO = 360 / SPRITE.angulos;

/** Índice del cuadro que corresponde a un rumbo geográfico. */
export function cuadroPara(bearing: number): number {
    const normalizado = ((bearing % 360) + 360) % 360;
    return Math.round(normalizado / PASO) % SPRITE.angulos;
}

/** Posición del cuadro dentro de la hoja, en píxeles ya escalados. */
export function offsetDelCuadro(indice: number): { x: number; y: number } {
    return {
        x: -(indice % SPRITE.columnas) * CELDA_PX,
        y: -Math.floor(indice / SPRITE.columnas) * CELDA_PX,
    };
}

/** Tamaño en pantalla del marcador, en píxeles. */
export const TAMANO_MARCADOR = CELDA_PX;

/**
 * Área sensible al mouse, centrada en el punto GPS.
 *
 * La celda tiene que ser grande para que entre el bondi en diagonal, pero el
 * vehículo ocupa bastante menos que eso. Si el marcador entero recibiera los
 * eventos, dos bondis a menos de una celda de distancia se taparían el click
 * con puro margen transparente. El recorte va apenas por fuera del dibujo.
 */
/**
 * El piso de 44px no es decorativo: DESIGN.md lo fija como mínimo táctil, y
 * a este tamaño de bondi el alto del dibujo queda por debajo.
 */
const MINIMO_TACTIL = 44;
const HIT_W = Math.max(LARGO_PX + 6, MINIMO_TACTIL);
const HIT_H = Math.max(LARGO_PX * 0.72, MINIMO_TACTIL);

export function createBusSpriteIcon(bearing: number): L.DivIcon {
    const { x, y } = offsetDelCuadro(cuadroPara(bearing));

    return L.divIcon({
        className: "bondi-sprite",
        // Dos capas: el dibujo ocupa la celda entera y no recibe eventos, y un
        // recuadro más chico en el centro es el que los captura. Ambos van
        // adentro y no en la raíz, porque a la raíz la posiciona Leaflet con su
        // propio `transform` y pisarlo la despegaría de sus coordenadas.
        html:
            `<div class="bondi-sprite-img" style="` +
            `width:${CELDA_PX}px;height:${CELDA_PX}px;` +
            `background-image:url('${SPRITE.url}');` +
            `background-size:${CELDA_PX * SPRITE.columnas}px ${CELDA_PX * SPRITE.filas}px;` +
            `background-position:${x}px ${y}px;` +
            `filter:drop-shadow(0 3px 4px rgba(0,0,0,0.55));` +
            `"></div>` +
            `<div class="bondi-sprite-hit" style="` +
            `width:${HIT_W}px;height:${HIT_H}px;` +
            `margin-left:${-HIT_W / 2}px;margin-top:${-HIT_H / 2}px;` +
            `"></div>`,
        iconSize: [CELDA_PX, CELDA_PX],
        iconAnchor: [CELDA_PX / 2, CELDA_PX / 2],
        popupAnchor: [0, -CELDA_PX / 3],
    });
}
