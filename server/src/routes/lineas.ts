/**
 * Endpoints públicos sobre el estado en vivo de líneas (data crowdsourced via
 * Telegram live share).
 *
 * GET /lineas/:linea/en-vivo?paradaId=X
 *   Devuelve los bondis activos (last_seen_at < FRESH_SEC) con su posición y,
 *   si paradaId está en una bandera del bondi, ETA calculado por la ruta.
 */

import { Hono } from "hono";
import { query } from "../db.js";
import { env } from "../env.js";
import { findLine, getStopIndex, type Bandera } from "../data/static.js";
import { haversineMts } from "../lib/geo.js";
import { fetchMgpDirect, isMgpDirectEnabled } from "../lib/mgpDirect.js";

const FRESH_SEC = 90;
// Si no tenemos avg confiable, usamos un fallback de velocidad urbana (en km/h).
const FALLBACK_KMH = 18;

// Caché in-memory para no machacar el proxy de la muni — TTL chico porque los
// arribos cambian constantemente.
const ARRIBOS_TTL_MS = 15_000;
const arribosCache = new Map<string, { at: number; payload: ArribosPayload }>();

type ActiveBus = {
    session_id: string;
    linea: string;
    ramal: string | null;
    lat: number;
    lng: number;
    velocity_kmh: number | null;
    avg_velocity_kmh: number | null;
    last_seen_at: string;
};

type LiveBusOut = {
    sessionId: string;
    ramal: string | null;
    lat: number;
    lng: number;
    velocityKmh: number | null;
    avgVelocityKmh: number | null;
    lastSeenAt: string;
    /** Edad del último update en segundos. */
    ageSec: number;
    /** ETA a la parada query, en minutos. null si no se pudo calcular. */
    etaMin: number | null;
    /** Cómo se calculó el ETA: "gps_route" (con velocidad real) o "gps_fallback" (con FALLBACK_KMH). */
    etaSource: "gps_route" | "gps_fallback" | null;
};

/**
 * Calcula la distancia restante por la ruta del bondi a la parada destino.
 * - Encuentra la parada de la bandera más cercana al bondi.
 * - Si la parada destino está después en la secuencia, suma haversine entre
 *   paradaIds[i..j] + tramo del bondi a la primera parada.
 * - Si está antes, devuelve null (el bondi ya pasó).
 */
async function distanceToStopByRoute(
    bandera: Bandera,
    busLat: number,
    busLng: number,
    paradaDestino: string,
): Promise<number | null> {
    const ids = bandera.paradaIds;
    const idxDest = ids.indexOf(paradaDestino);
    if (idxDest === -1) return null;

    const stopIndex = await getStopIndex();

    // Parada de la bandera más cercana al bondi (entre 0..idxDest, las que ya
    // pasaron son irrelevantes, pero igual buscamos en el rango completo y
    // descartamos si el bondi ya pasó la destino).
    let nearestIdx = -1;
    let nearestDist = Infinity;
    for (let i = 0; i <= idxDest; i++) {
        const stop = stopIndex.get(ids[i]!);
        if (!stop) continue;
        const d = haversineMts({ lat: busLat, lng: busLng }, { lat: stop.lat, lng: stop.lng });
        if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
        }
    }
    if (nearestIdx === -1) return null;

    let totalMts = nearestDist;
    for (let i = nearestIdx; i < idxDest; i++) {
        const a = stopIndex.get(ids[i]!);
        const b = stopIndex.get(ids[i + 1]!);
        if (!a || !b) continue;
        totalMts += haversineMts(
            { lat: a.lat, lng: a.lng },
            { lat: b.lat, lng: b.lng },
        );
    }
    return totalMts;
}

// --- API Muni ------------------------------------------------------------

type MgpArribo = {
    Arribo?: string;
    Latitud?: string;
    Longitud?: string;
    DescripcionLinea?: string;
    DescripcionBandera?: string;
    DescripcionCortaBandera?: string;
};

type MgpResponse = {
    CodigoEstado?: number;
    MensajeEstado?: string;
    arribos?: MgpArribo[];
};

export type MuniArribo = {
    etaMin: number | null;
    etaText: string;
    ramal: string | null;
    busLat: number | null;
    busLng: number | null;
};

type ArribosPayload = {
    source: "muni" | "muni_unavailable";
    arribos: MuniArribo[];
    error?: string;
};

function parseEtaMin(raw: string | undefined): number | null {
    if (!raw) return null;
    const m = raw.match(/(\d+)/);
    return m ? Number(m[1]) : null;
}

function parseFloatOrNull(raw: string | undefined): number | null {
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n !== 0 ? n : null;
}

function mapMgpResponse(data: MgpResponse | null): ArribosPayload {
    if (!data) return { source: "muni_unavailable", arribos: [], error: "no_json" };
    if (data.CodigoEstado !== undefined && data.CodigoEstado < 0) {
        // La muni respondió pero indica que no hay datos para esa combinación.
        return { source: "muni", arribos: [] };
    }
    const arr = data.arribos ?? [];
    return {
        source: "muni",
        arribos: arr.map((a) => ({
            etaMin: parseEtaMin(a.Arribo),
            etaText: a.Arribo ?? "",
            ramal: a.DescripcionCortaBandera ?? a.DescripcionBandera ?? null,
            busLat: parseFloatOrNull(a.Latitud),
            busLng: parseFloatOrNull(a.Longitud),
        })),
    };
}

async function fetchMuniArribos(
    identificadorParada: string,
    codigoLineaParada: string,
): Promise<ArribosPayload> {
    const body = new URLSearchParams({
        accion: "RecuperarProximosArribosW",
        identificadorParada,
        codigoLineaParada,
    }).toString();

    // Path "direct" (firma RSA + clave compartida) — preferido si está disponible.
    if (isMgpDirectEnabled()) {
        try {
            const data = (await fetchMgpDirect(body)) as MgpResponse;
            return mapMgpResponse(data);
        } catch (e) {
            return {
                source: "muni_unavailable",
                arribos: [],
                error: (e as Error).message,
            };
        }
    }

    // Path "proxy" (Termux/Oracle).
    if (env.MGP_PROXY_URL) {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6_000);
        try {
            const r = await fetch(env.MGP_PROXY_URL, {
                method: "POST",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                body,
                signal: ctrl.signal,
            });
            if (!r.ok) {
                return {
                    source: "muni_unavailable",
                    arribos: [],
                    error: `http_${r.status}`,
                };
            }
            const data = (await r.json().catch(() => null)) as MgpResponse | null;
            return mapMgpResponse(data);
        } catch (e) {
            return {
                source: "muni_unavailable",
                arribos: [],
                error: (e as Error).message,
            };
        } finally {
            clearTimeout(tid);
        }
    }

    return { source: "muni_unavailable", arribos: [], error: "no_mgp_config" };
}

/** Encuentra la primera bandera de la línea que contenga paradaId. */
async function findBanderaContaining(
    linea: string,
    paradaId: string,
    ramal: string | null,
): Promise<Bandera | undefined> {
    const line = await findLine(linea);
    if (!line) return undefined;
    // Si conocemos el ramal del bondi, intentamos esa primero.
    if (ramal) {
        const exact = line.banderas.find(
            (b) => b.nombre === ramal && b.paradaIds.includes(paradaId),
        );
        if (exact) return exact;
    }
    return line.banderas.find((b) => b.paradaIds.includes(paradaId));
}

export const lineasRoutes = new Hono();

lineasRoutes.get("/:linea/arribos", async (c) => {
    const linea = c.req.param("linea");
    const paradaId = c.req.query("paradaId");
    if (!paradaId) return c.json({ error: "paradaId_required" }, 400);

    const line = await findLine(linea);
    if (!line) {
        return c.json({ source: "muni_unavailable", arribos: [], error: "line_not_found" }, 404);
    }

    const cacheKey = `${line.codigo}|${paradaId}`;
    const cached = arribosCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.at < ARRIBOS_TTL_MS) {
        return c.json(cached.payload);
    }

    const payload = await fetchMuniArribos(paradaId, line.codigo);
    if (payload.source === "muni") {
        arribosCache.set(cacheKey, { at: now, payload });
    }
    return c.json(payload);
});

lineasRoutes.get("/:linea/en-vivo", async (c) => {
    const linea = c.req.param("linea");
    const paradaId = c.req.query("paradaId");

    const { rows } = await query<ActiveBus>(
        `select session_id, linea, ramal, lat, lng, velocity_kmh, avg_velocity_kmh, last_seen_at
         from bondi.bus_locations
         where linea = $1
           and last_seen_at > now() - ($2 || ' seconds')::interval
           and (lat <> 0 or lng <> 0)
         order by last_seen_at desc`,
        [linea, FRESH_SEC.toString()],
    );

    const now = Date.now();
    const out: LiveBusOut[] = [];

    for (const r of rows) {
        const ageSec = Math.round((now - new Date(r.last_seen_at).getTime()) / 1000);
        let etaMin: number | null = null;
        let etaSource: LiveBusOut["etaSource"] = null;

        if (paradaId) {
            const bandera = await findBanderaContaining(linea, paradaId, r.ramal);
            if (bandera) {
                const distMts = await distanceToStopByRoute(
                    bandera,
                    r.lat,
                    r.lng,
                    paradaId,
                );
                if (distMts !== null) {
                    const useReal =
                        r.avg_velocity_kmh !== null && r.avg_velocity_kmh >= 5;
                    const kmh = useReal ? r.avg_velocity_kmh! : FALLBACK_KMH;
                    etaMin = Math.max(0, Math.round((distMts / 1000 / kmh) * 60));
                    etaSource = useReal ? "gps_route" : "gps_fallback";
                }
            }
        }

        out.push({
            sessionId: r.session_id,
            ramal: r.ramal,
            lat: r.lat,
            lng: r.lng,
            velocityKmh: r.velocity_kmh,
            avgVelocityKmh: r.avg_velocity_kmh,
            lastSeenAt: r.last_seen_at,
            ageSec,
            etaMin,
            etaSource,
        });
    }

    return c.json({ buses: out });
});
