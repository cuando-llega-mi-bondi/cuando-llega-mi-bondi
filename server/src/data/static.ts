/**
 * Catálogo de líneas y paradas. Vienen del frontend (lib/static/) montado
 * read-only en /app/static-data — single source of truth.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type Stop = {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    lineas: string[];
    banderas: string[];
};

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

const STATIC_DIR =
    process.env.STATIC_DATA_DIR ??
    resolve(process.cwd(), "static-data");

let cached: { lines: Line[]; stops: Stop[] } | null = null;

async function load(): Promise<{ lines: Line[]; stops: Stop[] }> {
    if (cached) return cached;
    const [linesRaw, stopsRaw] = await Promise.all([
        readFile(resolve(STATIC_DIR, "lines.json"), "utf8"),
        readFile(resolve(STATIC_DIR, "stops.json"), "utf8"),
    ]);
    cached = {
        lines: JSON.parse(linesRaw) as Line[],
        stops: JSON.parse(stopsRaw) as Stop[],
    };
    return cached;
}

export async function getLines(): Promise<Line[]> {
    return (await load()).lines;
}

export async function getStops(): Promise<Stop[]> {
    return (await load()).stops;
}

export async function getStopIndex(): Promise<Map<string, Stop>> {
    const stops = await getStops();
    return new Map(stops.map((s) => [s.id, s]));
}

export async function findLine(linea: string): Promise<Line | undefined> {
    const lines = await getLines();
    return lines.find((l) => l.descripcion === linea || l.codigo === linea);
}
