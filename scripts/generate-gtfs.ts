#!/usr/bin/env bun

/**
 * Genera un GTFS estático parcial a partir de los datasets públicos en
 * data/raw/ y de las fixtures grabadas (cuando existan) en fixtures/.
 *
 * Lo que genera hoy con solo los datasets públicos:
 *   - agency.txt        ✅ del CSV de empresas operadoras
 *   - routes.txt        ✅ del CSV de líneas
 *   - stops.txt         ✅ del geojson (deduplicado por coords)
 *   - calendar.txt      ✅ servicio diario placeholder
 *   - frequencies.txt   ✅ del CSV 2013 (datos viejos pero plausibles)
 *
 * Lo que NO genera todavía (requiere fixtures de la API muni):
 *   - trips.txt         orden parada → trip
 *   - stop_times.txt    paradas por trip y orden
 *   - shapes.txt        geometría WKT del recorrido por línea
 *
 * Uso:
 *   bun scripts/generate-gtfs.ts
 *   # genera public/gtfs/*.txt
 *   # zipear con: (cd public/gtfs && zip ../gtfs.zip *.txt)
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const RAW = path.join(ROOT, "data/raw");
const OUT = path.join(ROOT, "public/gtfs");
const AGENCY_URL = "https://www.mardelplata.gob.ar";
const TIMEZONE = "America/Argentina/Buenos_Aires";

type Linea = { empresa: string; numero: string };
type StopRow = {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
};

function escape(s: string): string {
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function csvLine(fields: (string | number)[]): string {
    return fields.map((f) => escape(String(f))).join(",");
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function readLineas(): Promise<Linea[]> {
    const raw = await fs.readFile(
        path.join(RAW, "lineas-transporte-urbano.csv"),
        "utf-8",
    );
    const lines = raw.split(/\r?\n/).filter(Boolean);
    return lines.slice(1).map((row) => {
        const [empresa, numero] = row.split(";");
        return { empresa: empresa!.trim(), numero: numero!.trim() };
    });
}

async function readFrecuencias(): Promise<
    { linea: string; from: string; to: string; servicios: number }[]
> {
    const raw = await fs.readFile(
        path.join(RAW, "frecuencias-2013.csv"),
        "utf-8",
    );
    const lines = raw.split(/\r?\n/).filter(Boolean);
    return lines.slice(1).map((row) => {
        const [linea, franja, n] = row.split(";");
        const [from, to] = franja!.split(" - ");
        return {
            linea: linea!.trim(),
            from: `${from!.trim()}:00`,
            to: `${to!.trim()}:00`,
            servicios: Number(n!.trim()),
        };
    });
}

async function readParadas(): Promise<StopRow[]> {
    const raw = await fs.readFile(path.join(RAW, "paradas.geojson"), "utf-8");
    const fc = JSON.parse(raw) as {
        features: Array<{
            geometry: { coordinates: [number, number] };
            properties: { cartodb_id: number; linea: string };
        }>;
    };
    // El geojson trae 10081 paradas, muchas duplicadas (misma coord para cada
    // línea que pasa). Las deduplicamos por coord redondeada a 5 decimales
    // (~1m) — eso colapsa filas que son la misma parada física.
    const seen = new Map<string, StopRow>();
    for (const f of fc.features) {
        const [lon, lat] = f.geometry.coordinates;
        const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
        if (seen.has(key)) continue;
        seen.set(key, {
            stop_id: `s${seen.size + 1}`,
            stop_name: `Parada ${f.properties.linea}`,
            stop_lat: lat,
            stop_lon: lon,
        });
    }
    return Array.from(seen.values());
}

async function writeFile(name: string, content: string): Promise<void> {
    await fs.writeFile(path.join(OUT, name), content, "utf-8");
    console.log(
        `  ✓ ${name} (${content.split("\n").length - 1} rows)`,
    );
}

async function main() {
    await fs.mkdir(OUT, { recursive: true });

    const lineas = await readLineas();
    const stops = await readParadas();
    const frecuencias = await readFrecuencias();

    // ── agency.txt ───────────────────────────────────────────────────────
    const empresas = new Map<string, string>();
    for (const l of lineas) {
        if (!empresas.has(l.empresa)) empresas.set(l.empresa, slugify(l.empresa));
    }
    const agencyRows = [
        "agency_id,agency_name,agency_url,agency_timezone,agency_lang",
        ...Array.from(empresas).map(([name, id]) =>
            csvLine([id, name, AGENCY_URL, TIMEZONE, "es-AR"]),
        ),
    ];
    await writeFile("agency.txt", agencyRows.join("\n") + "\n");

    // ── routes.txt ───────────────────────────────────────────────────────
    const routeRows = [
        "route_id,agency_id,route_short_name,route_long_name,route_type",
        ...lineas.map((l) =>
            csvLine([
                `r${l.numero}`,
                empresas.get(l.empresa)!,
                l.numero,
                `Línea ${l.numero}`,
                3, // 3 = bus en spec GTFS
            ]),
        ),
    ];
    await writeFile("routes.txt", routeRows.join("\n") + "\n");

    // ── stops.txt ────────────────────────────────────────────────────────
    const stopRows = [
        "stop_id,stop_name,stop_lat,stop_lon",
        ...stops.map((s) => csvLine([s.stop_id, s.stop_name, s.stop_lat, s.stop_lon])),
    ];
    await writeFile("stops.txt", stopRows.join("\n") + "\n");

    // ── calendar.txt ─────────────────────────────────────────────────────
    // Placeholder: un único service_id "everyday" activo todos los días.
    // Cuando tengamos data por día (fines de semana, feriados), se expande.
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const oneYearLater = new Date(Date.now() + 365 * 86_400_000)
        .toISOString().slice(0, 10).replace(/-/g, "");
    await writeFile(
        "calendar.txt",
        `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
everyday,1,1,1,1,1,1,1,${today},${oneYearLater}
`,
    );

    // ── frequencies.txt ──────────────────────────────────────────────────
    // Mapea cada franja del CSV 2013 a un headway_secs = 3600 / servicios_por_hora.
    // En GTFS frequencies se asocia a un trip, no a una route. Como todavía no
    // generamos trips reales, asumimos un trip placeholder por línea: t{linea}.
    // Cuando trips.txt esté completo, este mapeo se reusa con los trip_id reales.
    const freqRows = [
        "trip_id,start_time,end_time,headway_secs,exact_times",
        ...frecuencias
            .filter((f) => f.servicios > 0)
            .map((f) => {
                const headway = Math.round(3600 / f.servicios);
                return csvLine([`t${f.linea}`, f.from, f.to, headway, 0]);
            }),
    ];
    await writeFile("frequencies.txt", freqRows.join("\n") + "\n");

    console.log("\nGenerado en", OUT);
    console.log("Empaquetar con: (cd public/gtfs && zip ../gtfs.zip *.txt)");
    console.log(
        "\nFaltan trips.txt, stop_times.txt, shapes.txt: requieren fixtures",
        "grabadas con MGP_USE_FIXTURES=record (rama dx/local-fixtures-and-mocks).",
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
