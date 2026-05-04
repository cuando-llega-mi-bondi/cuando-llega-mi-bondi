#!/usr/bin/env bun

/**
 * Genera un GTFS estático completo a partir de los datasets públicos en
 * data/raw/ (todos publicados por la muni en datos.mardelplata.gob.ar bajo CC 3.0).
 *
 * Entradas:
 *   - lineas-transporte-urbano.csv  → empresas operadoras + líneas
 *   - paradas.geojson               → 10081 paradas (deduplicadas por coords)
 *   - recorridos.geojson            → 128 trazas MultiLineString por línea/sentido
 *   - frecuencias-2024.csv          → matriz hora×línea (servicios por hora)
 *
 * Salidas (public/gtfs/*.txt):
 *   - agency.txt        ✅
 *   - routes.txt        ✅
 *   - stops.txt         ✅
 *   - calendar.txt      ✅ servicio diario placeholder
 *   - shapes.txt        ✅ geometría real de cada recorrido
 *   - trips.txt         ✅ un trip por feature de recorridos.geojson
 *   - frequencies.txt   ✅ del CSV 2024
 *
 * Pendiente: stop_times.txt requiere matching geométrico parada↔recorrido
 * (proyectar cada parada al recorrido más cercano y ordenarla por progreso
 * sobre el shape). Trabajo geo no trivial; queda para una iteración futura.
 *
 * Uso:
 *   node --experimental-strip-types scripts/generate-gtfs.ts
 *   (cd public/gtfs && zip ../gtfs.zip *.txt)
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
type RecorridoFeature = {
    geometry: { type: "MultiLineString"; coordinates: [number, number][][] }
        | { type: "LineString"; coordinates: [number, number][] };
    properties: { cartodb_id: number; col1: string; col2?: string };
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
    return raw.split(/\r?\n/).filter(Boolean).slice(1).map((row) => {
        const [empresa, numero] = row.split(";");
        return { empresa: empresa!.trim(), numero: numero!.trim() };
    });
}

/** Parsea matriz transpuesta `Hora/Linea;511;512;...` → array de
 *  {linea, hora_from, hora_to, servicios}. */
async function readFrecuencias(): Promise<
    { linea: string; from: string; to: string; servicios: number }[]
> {
    const raw = await fs.readFile(
        path.join(RAW, "frecuencias-2024.csv"),
        "utf-8",
    );
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const header = lines[0]!.split(";");
    const lineNames = header.slice(1).map((s) => s.trim());

    const out: { linea: string; from: string; to: string; servicios: number }[] = [];
    for (const row of lines.slice(1)) {
        const cols = row.split(";");
        const franja = cols[0]!.trim();
        const [from, to] = franja.split(/\s*a\s*/);
        for (let i = 0; i < lineNames.length; i++) {
            const servicios = Number(cols[i + 1]!.trim());
            if (!Number.isFinite(servicios) || servicios <= 0) continue;
            out.push({
                linea: lineNames[i]!,
                from: `${from!.trim()}:00`,
                to: `${to!.trim()}:00`,
                servicios,
            });
        }
    }
    return out;
}

async function readParadas(): Promise<StopRow[]> {
    const raw = await fs.readFile(path.join(RAW, "paradas.geojson"), "utf-8");
    const fc = JSON.parse(raw) as {
        features: Array<{
            geometry: { coordinates: [number, number] };
            properties: { cartodb_id: number; linea: string };
        }>;
    };
    // Dedup por coord redondeada a 5 decimales (~1m).
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

async function readRecorridos(): Promise<RecorridoFeature[]> {
    const raw = await fs.readFile(
        path.join(RAW, "recorridos.geojson"),
        "utf-8",
    );
    const fc = JSON.parse(raw) as { features: RecorridoFeature[] };
    return fc.features;
}

async function writeFile(name: string, content: string): Promise<void> {
    await fs.writeFile(path.join(OUT, name), content, "utf-8");
    console.log(`  ✓ ${name} (${content.split("\n").length - 1} rows)`);
}

async function main() {
    await fs.mkdir(OUT, { recursive: true });

    const lineas = await readLineas();
    const stops = await readParadas();
    const frecuencias = await readFrecuencias();
    const recorridos = await readRecorridos();

    // ── agency.txt ───────────────────────────────────────────────────────
    const empresas = new Map<string, string>();
    for (const l of lineas) {
        if (!empresas.has(l.empresa)) empresas.set(l.empresa, slugify(l.empresa));
    }
    await writeFile(
        "agency.txt",
        [
            "agency_id,agency_name,agency_url,agency_timezone,agency_lang",
            ...Array.from(empresas).map(([name, id]) =>
                csvLine([id, name, AGENCY_URL, TIMEZONE, "es-AR"]),
            ),
        ].join("\n") + "\n",
    );

    // ── routes.txt ───────────────────────────────────────────────────────
    // El CSV de líneas es base, pero recorridos.geojson tiene variantes que
    // no están ahí (ej "BATAN", "COSTA AZUL", "593CORTA"). Mergeamos ambos.
    const routesByName = new Map<
        string,
        { agency_id: string; route_short_name: string }
    >();
    for (const l of lineas) {
        routesByName.set(l.numero, {
            agency_id: empresas.get(l.empresa)!,
            route_short_name: l.numero,
        });
    }
    const recorridoLines = new Set(recorridos.map((r) => r.properties.col1));
    const fallbackAgency = empresas.values().next().value ?? "muni";
    for (const linea of recorridoLines) {
        if (!routesByName.has(linea)) {
            routesByName.set(linea, {
                agency_id: fallbackAgency,
                route_short_name: linea,
            });
        }
    }
    await writeFile(
        "routes.txt",
        [
            "route_id,agency_id,route_short_name,route_long_name,route_type",
            ...Array.from(routesByName).map(([linea, r]) =>
                csvLine([
                    `r${slugify(linea)}`,
                    r.agency_id,
                    r.route_short_name,
                    `Línea ${linea}`,
                    3,
                ]),
            ),
        ].join("\n") + "\n",
    );

    // ── stops.txt ────────────────────────────────────────────────────────
    await writeFile(
        "stops.txt",
        [
            "stop_id,stop_name,stop_lat,stop_lon",
            ...stops.map((s) =>
                csvLine([s.stop_id, s.stop_name, s.stop_lat, s.stop_lon]),
            ),
        ].join("\n") + "\n",
    );

    // ── calendar.txt ─────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const oneYearLater = new Date(Date.now() + 365 * 86_400_000)
        .toISOString().slice(0, 10).replace(/-/g, "");
    await writeFile(
        "calendar.txt",
        `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
everyday,1,1,1,1,1,1,1,${today},${oneYearLater}
`,
    );

    // ── shapes.txt ───────────────────────────────────────────────────────
    // Cada feature de recorridos.geojson genera un shape con el mismo id
    // que su trip. MultiLineString se aplana a un solo shape (con jumps los
    // puntos quedarían discontinuos, asumimos que son trazas continuas).
    const shapeRows = ["shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence"];
    for (const r of recorridos) {
        const id = `s${r.properties.cartodb_id}`;
        const lines =
            r.geometry.type === "MultiLineString"
                ? r.geometry.coordinates
                : [r.geometry.coordinates];
        let seq = 1;
        for (const line of lines) {
            for (const [lon, lat] of line) {
                shapeRows.push(csvLine([id, lat, lon, seq++]));
            }
        }
    }
    await writeFile("shapes.txt", shapeRows.join("\n") + "\n");

    // ── trips.txt ────────────────────────────────────────────────────────
    // Un trip por feature. trip_headsign = parte después del ";" en col2.
    const tripRows = [
        "route_id,service_id,trip_id,trip_headsign,shape_id",
    ];
    for (const r of recorridos) {
        const linea = r.properties.col1;
        const headsign = r.properties.col2?.split(";").pop()?.trim() ?? linea;
        tripRows.push(
            csvLine([
                `r${slugify(linea)}`,
                "everyday",
                `t${r.properties.cartodb_id}`,
                headsign,
                `s${r.properties.cartodb_id}`,
            ]),
        );
    }
    await writeFile("trips.txt", tripRows.join("\n") + "\n");

    // ── frequencies.txt ──────────────────────────────────────────────────
    // Mapea cada (línea, franja, servicios) a headway_secs sobre el primer
    // trip de esa línea. No es perfecto (lo correcto sería distribuir entre
    // ramales), pero da una primera aproximación válida.
    const firstTripByLinea = new Map<string, string>();
    for (const r of recorridos) {
        if (!firstTripByLinea.has(r.properties.col1)) {
            firstTripByLinea.set(r.properties.col1, `t${r.properties.cartodb_id}`);
        }
    }
    const freqRows = [
        "trip_id,start_time,end_time,headway_secs,exact_times",
    ];
    let unmapped = 0;
    for (const f of frecuencias) {
        const tripId = firstTripByLinea.get(f.linea);
        if (!tripId) {
            unmapped++;
            continue;
        }
        const headway = Math.round(3600 / f.servicios);
        freqRows.push(csvLine([tripId, f.from, f.to, headway, 0]));
    }
    await writeFile("frequencies.txt", freqRows.join("\n") + "\n");

    if (unmapped > 0) {
        console.log(
            `  ⚠ ${unmapped} entradas de frecuencias sin trip (línea no aparece en recorridos.geojson)`,
        );
    }

    console.log("\nGenerado en", OUT);
    console.log("Empaquetar con: (cd public/gtfs && zip ../gtfs.zip *.txt)");
    console.log(
        "\nFalta solo stop_times.txt (matching geométrico parada↔recorrido).",
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
