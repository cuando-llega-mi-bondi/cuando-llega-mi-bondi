/**
 * Recorre el catálogo del MGP y deja todas las respuestas grabadas como fixtures.
 * Requiere `MGP_USE_FIXTURES=record` activo en el dev server (las graba el handler).
 *
 * Uso:
 *   tsx scripts/prefetch-reference.ts                # default: shallow (líneas + 3 calls/línea)
 *   tsx scripts/prefetch-reference.ts --full         # incluye calles → intersecciones → paradas
 *   tsx scripts/prefetch-reference.ts --full-banderas # full + banderas por cada parada (caro)
 *   tsx scripts/prefetch-reference.ts --lines 541 107  # restringe a líneas dadas (Descripcion o CodigoLineaParada)
 *   tsx scripts/prefetch-reference.ts --throttle 3000  # ms entre calls reales (default 1500)
 *   tsx scripts/prefetch-reference.ts --backoff 60000  # ms a esperar tras un 429/502 (default 30000)
 *   API_URL=http://localhost:3000/api/cuando tsx ...   # override target
 *   FIXTURES_DIR=fixtures tsx ...                       # override carpeta de fixtures
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

const API = process.env.API_URL ?? "http://localhost:3000/api/cuando";
const FIXTURES_DIR = process.env.FIXTURES_DIR ?? path.join(process.cwd(), "fixtures");
const FULL = process.argv.includes("--full") || process.argv.includes("--full-banderas");
const FULL_BANDERAS = process.argv.includes("--full-banderas");
const LINES_FLAG = process.argv.indexOf("--lines");
const LINES_FILTER = LINES_FLAG >= 0 ? new Set(process.argv.slice(LINES_FLAG + 1).filter((a) => !a.startsWith("--"))) : null;

function numFlag(name: string, def: number): number {
    const i = process.argv.indexOf(name);
    if (i < 0) return def;
    const v = Number(process.argv[i + 1]);
    return Number.isFinite(v) ? v : def;
}
const THROTTLE_MS = numFlag("--throttle", 1500);
const BACKOFF_MS = numFlag("--backoff", 30_000);

type Linea = { CodigoLineaParada: string; Descripcion: string };
type CalleOInter = { Codigo: string; Descripcion: string };
type Parada = { Identificador: string; AbreviaturaBandera?: string };

let okCount = 0;
let failCount = 0;
let cachedCount = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fixtureFile(body: string): string {
    const params = new URLSearchParams(body);
    const accion = params.get("accion") ?? "_unknown";
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
    return path.join(FIXTURES_DIR, accion, `${hash}.json`);
}

async function readCached(body: string): Promise<unknown | null> {
    try {
        const raw = await fs.readFile(fixtureFile(body), "utf-8");
        const parsed = JSON.parse(raw) as { data?: unknown };
        return parsed.data ?? parsed;
    } catch {
        return null;
    }
}

async function call(body: string, retries = 2): Promise<unknown> {
    const cached = await readCached(body);
    if (cached !== null) {
        console.log(`  • cached :: ${body}`);
        cachedCount++;
        return cached;
    }
    for (let attempt = 0; attempt <= retries; attempt++) {
        await sleep(THROTTLE_MS);
        const t0 = Date.now();
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body,
            });
            const dt = Date.now() - t0;
            if (!res.ok) {
                const isRateLimit = res.status === 429 || res.status === 502 || res.status === 503;
                if (attempt === retries) {
                    console.warn(`  ✗ ${dt}ms HTTP ${res.status} :: ${body}`);
                    failCount++;
                    if (isRateLimit) {
                        console.warn(`    backoff ${BACKOFF_MS}ms tras ${res.status}`);
                        await sleep(BACKOFF_MS);
                    }
                    return null;
                }
                if (isRateLimit) {
                    console.warn(`  … HTTP ${res.status}, backoff ${BACKOFF_MS}ms y reintento`);
                    await sleep(BACKOFF_MS);
                }
                continue;
            }
            const data = await res.json();
            console.log(`  ✓ ${String(dt).padStart(5)}ms :: ${body}`);
            okCount++;
            return data;
        } catch (e) {
            if (attempt === retries) {
                console.warn(`  ✗ ${Date.now() - t0}ms ERR ${(e as Error).message} :: ${body}`);
                failCount++;
                return null;
            }
        }
    }
    return null;
}

async function main() {
    console.log(`Target: ${API}`);
    console.log(`Fixtures: ${FIXTURES_DIR}`);
    console.log(`Modo: ${FULL_BANDERAS ? "full + banderas" : FULL ? "full" : "shallow"}`);
    console.log(`Throttle: ${THROTTLE_MS}ms entre calls reales · Backoff: ${BACKOFF_MS}ms ante 429/502/503`);
    if (LINES_FILTER) console.log(`Filtrando líneas: ${[...LINES_FILTER].join(", ")}`);

    // Paso 0: catálogo de líneas
    console.log("\n[1/N] catálogo de líneas");
    const lineasResp = (await call("accion=RecuperarLineaPorCuandoLlega")) as { lineas?: Linea[] } | null;
    const allLineas = lineasResp?.lineas ?? [];
    const lineas = LINES_FILTER
        ? allLineas.filter((l) => LINES_FILTER.has(l.Descripcion) || LINES_FILTER.has(l.CodigoLineaParada))
        : allLineas;
    console.log(`  → ${allLineas.length} líneas total, procesando ${lineas.length}`);

    const paradasUnicas = new Set<string>();

    for (let li = 0; li < lineas.length; li++) {
        const l = lineas[li]!;
        const codLinea = l.CodigoLineaParada;
        console.log(`\n[${li + 1}/${lineas.length}] línea ${l.Descripcion} (cod=${codLinea})`);

        await call(`accion=RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea&codLinea=${codLinea}&isSublinea=0`);
        const paradasDestResp = (await call(`accion=RecuperarParadasConBanderaYDestinoPorLinea&codLinea=${codLinea}&isSublinea=0`)) as
            | { paradas?: Record<string, Parada[]> | Parada[] }
            | null;
        if (paradasDestResp?.paradas) {
            const flat = Array.isArray(paradasDestResp.paradas)
                ? paradasDestResp.paradas
                : Object.values(paradasDestResp.paradas).flat();
            for (const p of flat) if (p.Identificador) paradasUnicas.add(p.Identificador);
        }

        const callesResp = (await call(`accion=RecuperarCallesPrincipalPorLinea&codLinea=${codLinea}`)) as
            | { calles?: CalleOInter[] }
            | null;
        const calles = callesResp?.calles ?? [];

        if (!FULL) continue;

        for (const c of calles) {
            const interResp = (await call(
                `accion=RecuperarInterseccionPorLineaYCalle&codLinea=${codLinea}&codCalle=${c.Codigo}`,
            )) as { calles?: CalleOInter[] } | null;
            const inters = interResp?.calles ?? [];

            for (const i of inters) {
                const paradasResp = (await call(
                    `accion=RecuperarParadasConBanderaPorLineaCalleEInterseccion&codLinea=${codLinea}&codCalle=${c.Codigo}&codInterseccion=${i.Codigo}`,
                )) as { paradas?: Parada[] } | null;
                for (const p of paradasResp?.paradas ?? []) {
                    if (p.Identificador) paradasUnicas.add(p.Identificador);
                }
            }
        }
    }

    if (FULL_BANDERAS) {
        console.log(`\n[banderas] ${paradasUnicas.size} paradas únicas`);
        let bi = 0;
        for (const id of paradasUnicas) {
            bi++;
            console.log(`\n[${bi}/${paradasUnicas.size}] parada ${id}`);
            await call(`accion=RecuperarBanderasAsociadasAParada&identificadorParada=${id}`);
        }
    }

    console.log(`\n=== Listo. ok=${okCount} cached=${cachedCount} fail=${failCount} ===`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
