/**
 * Líneas que NO están en la API municipal pero tenemos su recorrido como
 * GeoJSON en /public. Las paradas se generaron sampleando el LineString de
 * cada bandera cada ~400m con `node` (regenerable, ver scripts más abajo).
 *
 * Para regenerar manual.json:
 *   node scripts/build-manual-stops.mjs
 */

import type { Line } from "./lines";
import type { Stop } from "./stops";
import data from "./manual.json";

type ManualData = {
    lines: Line[];
    stops: Stop[];
};

const built = data as ManualData;

export const MANUAL_LINES: Line[] = built.lines;
export const MANUAL_STOPS: Stop[] = built.stops;

/** Códigos de líneas que vienen de geojson manual; las usamos para dibujar la
 * polilínea real cuando estamos en /v2/linea/[codigo]. */
export const MANUAL_LINE_GEOJSON: Record<string, string[]> = {
    "221": ["/serena-marChiquita.geojson", "/marChiquita-Serena.geojson"],
};
