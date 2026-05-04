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
 *   - stop_times.txt    ✅ matching geométrico parada↔shape (ver buildStopTimes)
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
    linea: string; // sin slugify, tal cual viene del geojson
};
type RecorridoFeature = {
    geometry: { type: "MultiLineString"; coordinates: [number, number][][] }
        | { type: "LineString"; coordinates: [number, number][] };
    properties: { cartodb_id: number; col1: string; col2?: string };
};

// ── Geo helpers ──────────────────────────────────────────────────────────
const EARTH_R = 6_371_000;

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/** Distancia en metros entre dos puntos lat/lng (haversine). */
function haversine(
    a: { lat: number; lon: number },
    b: { lat: number; lon: number },
): number {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

/** Proyecta `p` sobre el segmento `a→b` y devuelve {distance, t}.
 *  `t` ∈ [0,1] indica progreso a lo largo del segmento. */
function projectOnSegment(
    p: { lat: number; lon: number },
    a: { lat: number; lon: number },
    b: { lat: number; lon: number },
): { distance: number; t: number } {
    // Aproximación equirectangular local — para distancias cortas (~km) es
    // suficiente y mucho más rápido que proyectar correctamente al elipsoide.
    const cosLat = Math.cos(toRad((a.lat + b.lat) / 2));
    const ax = a.lon * cosLat, ay = a.lat;
    const bx = b.lon * cosLat, by = b.lat;
    const px = p.lon * cosLat, py = p.lat;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) {
        return { distance: haversine(p, a), t: 0 };
    }
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const projLat = a.lat + t * (b.lat - a.lat);
    const projLon = a.lon + t * (b.lon - a.lon);
    return { distance: haversine(p, { lat: projLat, lon: projLon }), t };
}

/** Aplana un MultiLineString concatenando las sub-líneas. */
function flattenShape(
    geom: RecorridoFeature["geometry"],
): { lat: number; lon: number }[] {
    const lines =
        geom.type === "MultiLineString" ? geom.coordinates : [geom.coordinates];
    return lines.flat().map(([lon, lat]) => ({ lat, lon }));
}

/** Largo total acumulado de una polilínea, y largos por segmento. */
function shapeLengths(pts: { lat: number; lon: number }[]): {
    cumulative: number[]; // [0, len(0→1), len(0→2), ...]
    total: number;
} {
    const cumulative = [0];
    for (let i = 1; i < pts.length; i++) {
        cumulative.push(cumulative[i - 1]! + haversine(pts[i - 1]!, pts[i]!));
    }
    return { cumulative, total: cumulative[cumulative.length - 1]! };
}

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

/** Convierte "EMPRESA EL LIBERTADOR S.R.L." → "Empresa El Libertador S.R.L."
 *  Las MGP las publica en MAYÚSCULAS pero el GTFS validator pide Mixed Case
 *  para `agency_name`. Mantenemos siglas (todas las letras de un token <=4)
 *  como están. */
function titleCase(s: string): string {
    return s
        .toLowerCase()
        .split(/\s+/)
        .map((w) => {
            if (w.length === 0) return w;
            // Siglas tipo "S.R.L.", "S.A." mantienen mayúsculas
            if (/^[a-z](\.[a-z])+\.?$/.test(w)) return w.toUpperCase();
            return w[0]!.toUpperCase() + w.slice(1);
        })
        .join(" ");
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
        const [fromRaw, toRaw] = franja.split(/\s*a\s*/);
        const from = fromRaw!.trim();
        let to = toRaw!.trim();
        // GTFS exige end_time > start_time. Si la franja cierra a las 00:00
        // (última franja del día), debe expresarse como 24:00:00 según spec.
        if (to === "00:00") to = "24:00";
        for (let i = 0; i < lineNames.length; i++) {
            const servicios = Number(cols[i + 1]!.trim());
            if (!Number.isFinite(servicios) || servicios <= 0) continue;
            out.push({
                linea: lineNames[i]!,
                from: `${from}:00`,
                to: `${to}:00`,
                servicios,
            });
        }
    }
    return out;
}

type RawParada = { lat: number; lon: number; linea: string };

async function readRawParadas(): Promise<RawParada[]> {
    const raw = await fs.readFile(path.join(RAW, "paradas.geojson"), "utf-8");
    const fc = JSON.parse(raw) as {
        features: Array<{
            geometry: { coordinates: [number, number] };
            properties: { cartodb_id: number; linea: string };
        }>;
    };
    return fc.features.map((f) => ({
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        linea: f.properties.linea,
    }));
}

/** Dedup por coord (~1m). Mantiene la línea de la primera ocurrencia para
 *  el nombre, pero stop_times necesita revisar todas las líneas asociadas;
 *  por eso `stopByCoord` mapea coord → stop_id y `linesByStop` a qué líneas
 *  pertenece (varias líneas pueden compartir físicamente la parada). */
function dedupParadas(raw: RawParada[]): {
    stops: StopRow[];
    linesByStop: Map<string, Set<string>>;
} {
    const byCoord = new Map<string, StopRow>();
    const linesByStop = new Map<string, Set<string>>();
    for (const p of raw) {
        const key = `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
        let stop = byCoord.get(key);
        if (!stop) {
            stop = {
                stop_id: `s${byCoord.size + 1}`,
                stop_name: `Parada ${p.linea}`,
                stop_lat: p.lat,
                stop_lon: p.lon,
                linea: p.linea,
            };
            byCoord.set(key, stop);
            linesByStop.set(stop.stop_id, new Set());
        }
        linesByStop.get(stop.stop_id)!.add(p.linea);
    }
    return { stops: Array.from(byCoord.values()), linesByStop };
}

/** Calcula stop_times.txt rows haciendo matching geométrico parada↔shape.
 *  - Solo considera paradas cuya `linea` matchee con `col1` del recorrido
 *  - Proyecta cada parada sobre cada segmento del shape; se queda con la más cercana
 *  - Filtra paradas a más de `MAX_DIST_M` del shape (no son de ese ramal)
 *  - Ordena por progreso a lo largo del shape
 *  - Asigna tiempo asumiendo velocidad media constante */
const MAX_DIST_M = 80;
const AVG_SPEED_MPS = 6.94; // 25 km/h, razonable urbano con paradas

function secondsToHHMMSS(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function buildStopTimesForTrip(
    trip: RecorridoFeature,
    stops: StopRow[],
    linesByStop: Map<string, Set<string>>,
): { trip_id: string; stop_id: string; arrival: string; sequence: number }[] {
    const linea = trip.properties.col1;
    const shape = flattenShape(trip.geometry);
    if (shape.length < 2) return [];
    const { cumulative } = shapeLengths(shape);

    const candidates = stops.filter((s) =>
        linesByStop.get(s.stop_id)?.has(linea),
    );

    type Match = { stop_id: string; progress: number; distance: number };
    const matched: Match[] = [];

    for (const stop of candidates) {
        const p = { lat: stop.stop_lat, lon: stop.stop_lon };
        let best: { distance: number; progress: number } = {
            distance: Infinity,
            progress: 0,
        };
        for (let i = 0; i < shape.length - 1; i++) {
            const a = shape[i]!, b = shape[i + 1]!;
            const { distance, t } = projectOnSegment(p, a, b);
            if (distance < best.distance) {
                const segLen = cumulative[i + 1]! - cumulative[i]!;
                best = {
                    distance,
                    progress: cumulative[i]! + t * segLen,
                };
            }
        }
        if (best.distance <= MAX_DIST_M) {
            matched.push({
                stop_id: stop.stop_id,
                progress: best.progress,
                distance: best.distance,
            });
        }
    }

    matched.sort((x, y) => x.progress - y.progress);

    return matched.map((m, i) => ({
        trip_id: `t${trip.properties.cartodb_id}`,
        stop_id: m.stop_id,
        arrival: secondsToHHMMSS(m.progress / AVG_SPEED_MPS),
        sequence: i + 1,
    }));
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
    const rawParadas = await readRawParadas();
    const { stops, linesByStop } = dedupParadas(rawParadas);
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
                csvLine([id, titleCase(name), AGENCY_URL, TIMEZONE, "es-AR"]),
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

    // Pre-calcula stop_times de cada recorrido y descarta aquellos que
    // no tengan ninguna parada matcheada (sea porque su `col1` no aparece
    // en paradas.geojson, o porque ninguna parada de esa línea cae dentro
    // de los MAX_DIST_M del shape). Sin esto, los descartados quedarían
    // en trips.txt como `unusable_trip` para el validator.
    const stopTimesByTrip = new Map<
        number,
        ReturnType<typeof buildStopTimesForTrip>
    >();
    for (const r of recorridos) {
        const rows = buildStopTimesForTrip(r, stops, linesByStop);
        if (rows.length > 0) stopTimesByTrip.set(r.properties.cartodb_id, rows);
    }
    const usableRecorridos = recorridos.filter((r) =>
        stopTimesByTrip.has(r.properties.cartodb_id),
    );
    const skippedRecorridos = recorridos.length - usableRecorridos.length;
    if (skippedRecorridos > 0) {
        console.log(
            `  ℹ ${skippedRecorridos} recorridos descartados (sin paradas matcheadas)`,
        );
    }

    // ── shapes.txt ───────────────────────────────────────────────────────
    // Cada feature de recorridos.geojson genera un shape con el mismo id
    // que su trip. MultiLineString se aplana a un solo shape (con jumps los
    // puntos quedarían discontinuos, asumimos que son trazas continuas).
    const shapeRows = ["shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence"];
    for (const r of usableRecorridos) {
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
    // Un trip por feature usable. trip_headsign = parte después del ";" en col2.
    const tripRows = [
        "route_id,service_id,trip_id,trip_headsign,shape_id",
    ];
    for (const r of usableRecorridos) {
        const linea = r.properties.col1;
        const headsignRaw = r.properties.col2?.split(";").pop()?.trim() ?? linea;
        tripRows.push(
            csvLine([
                `r${slugify(linea)}`,
                "everyday",
                `t${r.properties.cartodb_id}`,
                titleCase(headsignRaw),
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
    for (const r of usableRecorridos) {
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

    // ── stop_times.txt ───────────────────────────────────────────────────
    // Reutilizamos stopTimesByTrip ya calculado al filtrar usableRecorridos.
    const stopTimesRows = [
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence",
    ];
    let totalStops = 0;
    for (const r of usableRecorridos) {
        const rows = stopTimesByTrip.get(r.properties.cartodb_id)!;
        totalStops += rows.length;
        for (const row of rows) {
            stopTimesRows.push(
                csvLine([row.trip_id, row.arrival, row.arrival, row.stop_id, row.sequence]),
            );
        }
    }
    await writeFile("stop_times.txt", stopTimesRows.join("\n") + "\n");
    console.log(
        `  ℹ stop_times: ${usableRecorridos.length} trips, total ${totalStops} stop-times (avg ${(totalStops / Math.max(1, usableRecorridos.length)).toFixed(1)} por trip)`,
    );

    // ── feed_info.txt ────────────────────────────────────────────────────
    // Identifica el origen del feed para apps consumidoras (validators y
    // agregadores tipo MobilityData lo piden).
    const feedVersion = today; // YYYYMMDD
    await writeFile(
        "feed_info.txt",
        [
            "feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,feed_end_date,feed_version,feed_contact_url",
            csvLine([
                "Bondi MDP",
                "https://www.bondimdp.com.ar",
                "es-AR",
                today,
                oneYearLater,
                feedVersion,
                "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi",
            ]),
        ].join("\n") + "\n",
    );

    console.log("\nGenerado en", OUT);
    console.log("Empaquetar con: (cd public/gtfs && zip ../gtfs.zip *.txt)");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
