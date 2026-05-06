/**
 * Genera un JSON con datos de referencia MGP (líneas, calles, intersecciones,
 * paradas por tripleta y recorrido/ramales para mapa). Requiere que la API
 * responda en NEXT_PUBLIC_CUANDO_API_URL (por defecto http://localhost:3000/api/cuando).
 *
 * Uso: npm run dump-static
 * Con servidor dev en marcha, o apuntando a un deploy con env cargado.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Interseccion, Linea, Parada } from "../lib/types";

function loadEnvLocal(): void {
    try {
        const p = resolve(process.cwd(), ".env.local");
        const raw = readFileSync(p, "utf-8");
        for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq <= 0) continue;
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
            ) {
                val = val.slice(1, -1);
            }
            if (key && process.env[key] === undefined) {
                process.env[key] = val;
            }
        }
    } catch {
        // sin .env.local
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

async function mgpPost(
    baseUrl: string,
    accion: string,
    params: Record<string, string> = {},
): Promise<unknown> {
    const body = new URLSearchParams({ accion, ...params }).toString();
    const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} (${accion})`);
    }
    return res.json();
}

function keyCalleInter(codCalle: string, codInter: string): string {
    return `${codCalle}\t${codInter}`;
}

async function main(): Promise<void> {
    loadEnvLocal();

    const rawUrl =
        process.env.NEXT_PUBLIC_CUANDO_API_URL?.trim() ||
        process.env.DUMP_MGP_URL?.trim();
    const baseUrl = rawUrl
        ? /^https?:\/\//i.test(rawUrl)
            ? rawUrl.replace(/\/$/, "")
            : `https://${rawUrl.replace(/^\/+/, "").replace(/\/$/, "")}`
        : "http://localhost:3000/api/cuando";

    if (!process.env.NEXT_PUBLIC_CUANDO_API_URL?.trim()) {
        process.env.NEXT_PUBLIC_CUANDO_API_URL = baseUrl;
    }

    const { mergeLineasWithManual, MANUAL_ROUTES } = await import(
        "../lib/manualRoutes",
    );
    const { getRecorridoMapaCliente } = await import("../lib/api/recorrido");

    const delayMs = Math.max(0, Number(process.env.DUMP_DELAY_MS ?? "150") || 0);

    console.log(`API base: ${baseUrl}`);
    if (delayMs > 0) {
        console.log(`Pausa entre llamadas: ${delayMs}ms`);
    }

    const lineasRaw = (await mgpPost(baseUrl, "RecuperarLineaPorCuandoLlega")) as {
        lineas?: Linea[];
    };
    const lineas = mergeLineasWithManual(lineasRaw.lineas ?? []);

    type LineDump = {
        meta: Linea;
        calles: { value: string; label: string }[];
        interseccionesByCalle: Record<string, Interseccion[]>;
        paradasByCalleInterseccion: Record<string, Parada[]>;
        recorrido: Awaited<ReturnType<typeof getRecorridoMapaCliente>>;
        error?: string;
    };

    const out: {
        meta: {
            generatedAt: string;
            apiBase: string;
            lineCount: number;
            manualRoutes: typeof MANUAL_ROUTES;
        };
        lineas: Linea[];
        byLinea: Record<string, LineDump>;
    } = {
        meta: {
            generatedAt: new Date().toISOString(),
            apiBase: baseUrl,
            lineCount: lineas.length,
            manualRoutes: MANUAL_ROUTES,
        },
        lineas,
        byLinea: {},
    };

    let done = 0;
    for (const line of lineas) {
        const cod = line.CodigoLineaParada;
        done += 1;
        process.stdout.write(
            `\r[${done}/${lineas.length}] ${cod} ${line.Descripcion.slice(0, 40)}…`,
        );

        try {
            const callesData = (await mgpPost(
                baseUrl,
                "RecuperarCallesPrincipalPorLinea",
                { codLinea: cod },
            )) as { calles?: { Codigo: string; Descripcion: string }[] };
            if (delayMs) await sleep(delayMs);

            const rawCalles = callesData.calles ?? [];
            const calles = rawCalles.map((c) => ({
                value: c.Codigo,
                label: c.Descripcion,
            }));

            const interseccionesByCalle: Record<string, Interseccion[]> = {};
            const paradasByCalleInterseccion: Record<string, Parada[]> = {};

            for (const calle of calles) {
                const codCalle = calle.value;
                const interData = (await mgpPost(
                    baseUrl,
                    "RecuperarInterseccionPorLineaYCalle",
                    { codLinea: cod, codCalle },
                )) as { calles?: Interseccion[] };
                if (delayMs) await sleep(delayMs);

                const intersecciones = interData.calles ?? [];
                interseccionesByCalle[codCalle] = intersecciones;

                for (const inter of intersecciones) {
                    const codInter = inter.Codigo;
                    const parData = (await mgpPost(
                        baseUrl,
                        "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
                        { codLinea: cod, codCalle, codInterseccion: codInter },
                    )) as { paradas?: Parada[] };
                    if (delayMs) await sleep(delayMs);

                    paradasByCalleInterseccion[keyCalleInter(codCalle, codInter)] =
                        parData.paradas ?? [];
                }
            }

            const recorrido = await getRecorridoMapaCliente(cod);
            if (delayMs) await sleep(delayMs);

            out.byLinea[cod] = {
                meta: line,
                calles,
                interseccionesByCalle,
                paradasByCalleInterseccion,
                recorrido,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`\nFallo línea ${cod}: ${msg}`);
            out.byLinea[cod] = {
                meta: line,
                calles: [],
                interseccionesByCalle: {},
                paradasByCalleInterseccion: {},
                recorrido: { ramales: [], paradas: [] },
                error: msg,
            };
        }
    }

    console.log("");

    const outDir = resolve(process.cwd(), "data");
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, "mgp-static-dump.json");
    writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");
    console.log(`Escrito: ${outPath}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
