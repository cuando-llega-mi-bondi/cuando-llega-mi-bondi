/**
 * Warmup background del cache de RecuperarBanderasAsociadasAParada.
 *
 * Estrategia:
 * - Al startup, leer la tabla `bondi.banderas_cache` y volcarla al proxyCache
 *   in-memory (con `at: now` para que cuente como fresh durante 6h).
 * - Cada N segundos, buscar una parada conocida (de stops.json) que no esté
 *   en la tabla o esté stale (>7 días desde el último fetch) y pedirla a MGP.
 *   Guarda en DB y en memoria.
 * - Skipea si el circuit breaker está abierto (no hammerear MGP cuando está
 *   rate-limited; reintentar después).
 *
 * Una vez que todas las paradas estén en DB, el intervalo solo refresca
 * paradas viejas (por si la muni cambia recorridos cada tanto). Tráfico
 * sostenido en estado-estable: 0 requests a MGP por banderas (CF + memoria
 * lo cubre todo).
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { query } from "../db.js";

const STATIC_DIR = process.env.STATIC_DATA_DIR ?? resolve(process.cwd(), "static-data");
const TICK_MS = 30_000;
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type ProxyCacheEntry = { at: number; payload: unknown; status: number };

export type WarmupStats = {
    enabled: boolean;
    totalParadas: number;
    cached: number;
    fresh: number;
    pendingFirstFetch: number;
    lastFetchAt: number | null;
    lastFetchParada: string | null;
    lastError: string | null;
    nextTickAt: number | null;
};

let stats: WarmupStats = {
    enabled: false,
    totalParadas: 0,
    cached: 0,
    fresh: 0,
    pendingFirstFetch: 0,
    lastFetchAt: null,
    lastFetchParada: null,
    lastError: null,
    nextTickAt: null,
};

export function getWarmupStats(): WarmupStats {
    return stats;
}

async function ensureSchema(): Promise<void> {
    await query(`
        create schema if not exists bondi;
        create table if not exists bondi.banderas_cache (
            parada_id text primary key,
            banderas jsonb not null,
            fetched_at timestamptz not null default now()
        );
        create index if not exists idx_banderas_cache_fetched_at
            on bondi.banderas_cache (fetched_at);
    `);
}

async function loadStopIds(): Promise<string[]> {
    try {
        const raw = await readFile(resolve(STATIC_DIR, "stops.json"), "utf8");
        const stops = JSON.parse(raw) as Array<{ id: string }>;
        return stops.map((s) => s.id).filter((id) => typeof id === "string" && id.length > 0);
    } catch (e) {
        console.warn("[warmup] no se pudo leer stops.json:", (e as Error).message);
        return [];
    }
}

async function hydrateInMemoryCache(
    proxyCache: Map<string, ProxyCacheEntry>,
): Promise<number> {
    const r = await query<{ parada_id: string; banderas: unknown }>(
        `select parada_id, banderas from bondi.banderas_cache`,
    );
    const now = Date.now();
    for (const row of r.rows) {
        const body = new URLSearchParams({
            accion: "RecuperarBanderasAsociadasAParada",
            identificadorParada: row.parada_id,
        }).toString();
        proxyCache.set(body, { at: now, payload: row.banderas, status: 200 });
    }
    return r.rows.length;
}

async function pickNextParada(allIds: string[]): Promise<string | null> {
    // Devuelve la próxima parada a fetchear: primero las que nunca se
    // dumpearon (en allIds pero no en banderas_cache), después las más viejas
    // (>7 días).
    const cached = await query<{ parada_id: string; fetched_at: Date }>(
        `select parada_id, fetched_at from bondi.banderas_cache`,
    );
    const cachedMap = new Map(
        cached.rows.map((r) => [r.parada_id, new Date(r.fetched_at).getTime()]),
    );
    const missing = allIds.filter((id) => !cachedMap.has(id));
    if (missing.length > 0) {
        // Aleatorio entre los faltantes para no quedar atascados si una falla
        // sistemáticamente.
        return missing[Math.floor(Math.random() * missing.length)] ?? null;
    }
    const cutoff = Date.now() - REFRESH_AFTER_MS;
    const stale = [...cachedMap.entries()]
        .filter(([, ts]) => ts < cutoff)
        .sort((a, b) => a[1] - b[1]);
    return stale[0]?.[0] ?? null;
}

async function recomputeStats(allIds: string[]): Promise<void> {
    const r = await query<{ total: string; fresh: string }>(
        `select count(*)::text as total,
                count(*) filter (where fetched_at > now() - interval '7 days')::text as fresh
           from bondi.banderas_cache`,
    );
    const total = Number(r.rows[0]?.total ?? "0");
    const fresh = Number(r.rows[0]?.fresh ?? "0");
    stats = {
        ...stats,
        totalParadas: allIds.length,
        cached: total,
        fresh,
        pendingFirstFetch: Math.max(0, allIds.length - total),
    };
}

export type WarmupDeps = {
    proxyCache: Map<string, ProxyCacheEntry>;
    callMgp: (body: string) => Promise<unknown>;
    isBreakerOpen: () => boolean;
};

export async function startBanderasWarmup(deps: WarmupDeps): Promise<void> {
    try {
        await ensureSchema();
    } catch (e) {
        console.warn("[warmup] no pude crear schema:", (e as Error).message);
        return;
    }

    const allIds = await loadStopIds();
    if (allIds.length === 0) {
        console.warn("[warmup] sin paradas en stops.json, abortando");
        return;
    }

    const hydrated = await hydrateInMemoryCache(deps.proxyCache);
    console.log(
        `[warmup] hidraté ${hydrated} entradas de banderas_cache al cache in-memory`,
    );

    stats.enabled = true;
    await recomputeStats(allIds);

    async function tick(): Promise<void> {
        try {
            stats.nextTickAt = Date.now() + TICK_MS;
            if (deps.isBreakerOpen()) {
                return;
            }
            const paradaId = await pickNextParada(allIds);
            if (!paradaId) return;
            const body = new URLSearchParams({
                accion: "RecuperarBanderasAsociadasAParada",
                identificadorParada: paradaId,
            }).toString();
            const data = await deps.callMgp(body);
            const banderas = (data as { banderas?: unknown }).banderas ?? [];
            await query(
                `insert into bondi.banderas_cache (parada_id, banderas, fetched_at)
                 values ($1, $2::jsonb, now())
                 on conflict (parada_id) do update
                   set banderas = excluded.banderas,
                       fetched_at = excluded.fetched_at`,
                [paradaId, JSON.stringify(banderas)],
            );
            deps.proxyCache.set(body, { at: Date.now(), payload: data, status: 200 });
            stats.lastFetchAt = Date.now();
            stats.lastFetchParada = paradaId;
            stats.lastError = null;
            await recomputeStats(allIds);
        } catch (e) {
            stats.lastError = (e as Error).message;
        }
    }

    // Primer tick a los 5s (no inmediato, para no competir con startup).
    setTimeout(() => {
        tick();
        setInterval(tick, TICK_MS);
    }, 5_000);

    console.log(
        `[warmup] activo - ${allIds.length} paradas conocidas, ${hydrated} ya en cache, tick cada ${TICK_MS / 1000}s`,
    );
}
