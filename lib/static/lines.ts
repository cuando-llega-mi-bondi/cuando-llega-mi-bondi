import linesData from "./lines.json";

export type Bandera = {
    nombre: string;
    paradaIds: string[];
};

export type Line = {
    codigo: string;
    descripcion: string;
    paradas: number;
    banderas: Bandera[];
};

const API_LINES: Line[] = linesData as Line[];

// Importación tardía para evitar ciclo (manual.ts importa Line/Bandera/Stop).
import { MANUAL_LINES } from "./manual";

/**
 * Catálogo completo: las que vienen de la API muni + manuales (geojson).
 * Si la API también lista una manual, gana la manual (más datos).
 */
const manualDescr = new Set(MANUAL_LINES.map((m) => m.descripcion));
export const LINES: Line[] = [
    ...API_LINES.filter((l) => !manualDescr.has(l.descripcion)),
    ...MANUAL_LINES,
];
