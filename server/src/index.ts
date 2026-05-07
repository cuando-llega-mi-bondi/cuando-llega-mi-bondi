import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { favoritosRoutes } from "./routes/favoritos.js";
import { rutinasRoutes } from "./routes/rutinas.js";
import { subscribeRoutes } from "./routes/subscribe.js";
import { telegramRoutes } from "./routes/telegram.js";
import { lineasRoutes } from "./routes/lineas.js";
import { statsRoutes } from "./routes/stats.js";
import { fetchMgpDirect, isMgpDirectEnabled } from "./lib/mgpDirect.js";
import {
    recordAccion,
    recordCache,
    recordError,
    recordMgp,
    recordRequest,
} from "./stats.js";

const app = new Hono();

app.use(logger());

// secureHeaders agrega `cross-origin-resource-policy: same-origin` y otros
// que CF interpreta como uncacheable para /mgp/*. Lo aplicamos a todo
// EXCEPTO /mgp/*.
const secureHeadersMiddleware = secureHeaders();
app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/mgp/")) {
        return next();
    }
    return secureHeadersMiddleware(c, next);
});

// Métricas: registra todas las requests salvo /stats/* (que ruidan el dashboard).
app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const path = new URL(c.req.url).pathname;
    if (path.startsWith("/stats")) return;
    // Cloudflare → traefik → bondi-api: el header CF-Connecting-IP tiene la IP
    // real del cliente; X-Forwarded-For como fallback.
    const ip =
        c.req.header("cf-connecting-ip") ??
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        c.req.header("x-real-ip");
    recordRequest({
        at: start,
        method: c.req.method,
        path,
        status: c.res.status,
        durationMs: Date.now() - start,
        ip,
        ua: c.req.header("user-agent"),
    });
});

// Acepta orígenes en ALLOWED_ORIGINS, cualquier *.vercel.app (preview deploys
// cambian de URL en cada push) y cualquier *.bondimdp.com.ar / bondimdp.com.ar
// (prod + staging + futuros subdominios sin sincronizar a mano).
const ALLOWED_HOST_RES = [
    /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i,
    /^https:\/\/(?:[a-z0-9-]+\.)*bondimdp\.com\.ar$/i,
];
function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return false;
    if (env.ALLOWED_ORIGINS.includes(origin)) return true;
    return ALLOWED_HOST_RES.some((re) => re.test(origin));
}

const corsMiddleware = cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
});

// CORS para todas las rutas EXCEPTO /mgp/* — esa devuelve `Allow-Origin: *`
// sin `Vary: Origin` para que Cloudflare pueda cachearla en edge sin crear
// una entrada de cache distinta por cada origen.
app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/mgp/")) {
        return next();
    }
    return corsMiddleware(c, next);
});

app.get("/", (c) => c.json({ service: "bondi-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Compat shim: el frontend legacy (rama staging y ops/self-host-frontend) hace
// POST / con `accion=...&otherParams=...` apuntando a este host. Reenvía el
// body raw al MGP y devuelve la respuesta JSON sin transformar (shape
// PascalCase original que el frontend ya parsea).
//
// Cache stale-while-error: ante 429/timeout/red de MGP, servimos la última
// respuesta exitosa (si tenemos) en lugar de 502. Imprescindible porque MGP
// rate-limitea por IP y un solo episodio nos deja varios minutos en el piso.
const FRESH_TTL_MS = 15_000;
const STALE_MAX_MS = 30 * 60 * 1000;
type CacheEntry = { at: number; payload: unknown; status: number };
const proxyCache = new Map<string, CacheEntry>();

function normalizeKey(body: string): string {
    return new URLSearchParams(body).toString();
}

async function readProxyBody(c: import("hono").Context): Promise<string | null> {
    const ct = (c.req.header("content-type") ?? "").toLowerCase();
    if (ct.includes("application/x-www-form-urlencoded")) {
        return c.req.text();
    }
    if (ct.includes("multipart/form-data")) {
        const fd = await c.req.formData();
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
            if (typeof v === "string") params.append(k, v);
        }
        return params.toString();
    }
    return null;
}

// Circuit breaker: cuando MGP devuelve 429, queda "open" durante este tiempo
// y no le pegamos más. Le da espacio a enfriarse en lugar de hammerearla en
// bucle (que es lo que la mantiene rate-limiteada). Mientras está open,
// callMgp tira inmediatamente para que la lógica de cache stale entre.
const BREAKER_OPEN_MS = 30_000;
let breakerOpenUntil = 0;

async function callMgp(body: string): Promise<unknown> {
    if (Date.now() < breakerOpenUntil) {
        throw new Error("circuit_open: appWS.php devolvió 429 reciente");
    }
    try {
        const data = isMgpDirectEnabled()
            ? await fetchMgpDirect(body)
            : await callMgpProxy(body);
        recordMgp({ at: Date.now(), ok: true, status: 200 });
        return data;
    } catch (e) {
        const message = (e as Error).message;
        const m = message.match(/(\d{3})/);
        const status = m ? Number(m[1]) : 0;
        if (status === 429) {
            breakerOpenUntil = Date.now() + BREAKER_OPEN_MS;
        }
        recordMgp({ at: Date.now(), ok: false, status, message });
        throw e;
    }
}

async function callMgpProxy(body: string): Promise<unknown> {
    if (!env.MGP_PROXY_URL) throw new Error("no_mgp_config");
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8_000);
    try {
        const r = await fetch(env.MGP_PROXY_URL, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body,
            signal: ctrl.signal,
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return JSON.parse(text);
    } finally {
        clearTimeout(tid);
    }
}

app.post("/", async (c) => {
    const body = await readProxyBody(c);
    if (body === null) {
        return c.json(
            { error: "unsupported_content_type", got: c.req.header("content-type") },
            415,
        );
    }
    if (!body) return c.json({ error: "empty_body" }, 400);

    const key = normalizeKey(body);
    const now = Date.now();
    const cached = proxyCache.get(key);
    const accion = new URLSearchParams(body).get("accion") ?? "(desconocida)";
    recordAccion(accion);

    if (cached && now - cached.at < FRESH_TTL_MS) {
        recordCache("HIT");
        c.header("X-Cache", "HIT");
        return c.json(cached.payload as Record<string, unknown>);
    }

    try {
        const data = await callMgp(body);
        proxyCache.set(key, { at: now, payload: data, status: 200 });
        recordCache("MISS");
        c.header("X-Cache", "MISS");
        return c.json(data as Record<string, unknown>);
    } catch (e) {
        const message = (e as Error).message;
        if (cached && now - cached.at < STALE_MAX_MS) {
            recordCache("STALE");
            c.header("X-Cache", "STALE");
            c.header("X-Stale-Reason", message.slice(0, 120));
            return c.json(cached.payload as Record<string, unknown>);
        }
        recordError("POST /", 502, message);
        return c.json({ error: "mgp_unavailable", message }, 502);
    }
});

// GET /mgp/:accion?<params> — variante cacheable por Cloudflare. Mismo shape
// PascalCase que el POST / shim, pero como GET para que CF pueda cachearla en
// edge con TTL corto. Con 50 usuarios pidiendo la misma parada en 30s, CF
// sirve 49 desde edge y solo 1 atraviesa hasta el server.
//
// CORS especial: la data MGP es pública (arribos de bondi), no varía por
// origen. Devolvemos `Access-Control-Allow-Origin: *` y NO `Vary: Origin`
// para que CF pueda cachear una sola entrada compartida entre orígenes
// (sin Vary, CF crearía una entrada de cache por cada origen distinto).

app.get("/mgp/:accion", async (c) => {
    const accion = c.req.param("accion");
    const params: Record<string, string> = {};
    for (const [k, v] of new URL(c.req.url).searchParams.entries()) {
        params[k] = v;
    }
    const body = new URLSearchParams({ accion, ...params }).toString();
    const key = body;
    const now = Date.now();
    const cached = proxyCache.get(key);
    recordAccion(accion);

    // CORS público (sin Vary): la data MGP es pública y queremos que CF
    // cachee una sola entrada compartida entre todos los orígenes.
    c.header("Access-Control-Allow-Origin", "*");

    if (cached && now - cached.at < FRESH_TTL_MS) {
        recordCache("HIT");
        c.header("X-Cache", "HIT");
        c.header("Cache-Control", "public, max-age=15, s-maxage=30");
        return c.json(cached.payload as Record<string, unknown>);
    }

    try {
        const data = await callMgp(body);
        proxyCache.set(key, { at: now, payload: data, status: 200 });
        recordCache("MISS");
        c.header("X-Cache", "MISS");
        c.header("Cache-Control", "public, max-age=15, s-maxage=30");
        return c.json(data as Record<string, unknown>);
    } catch (e) {
        const message = (e as Error).message;
        if (cached && now - cached.at < STALE_MAX_MS) {
            recordCache("STALE");
            c.header("X-Cache", "STALE");
            c.header("X-Stale-Reason", message.slice(0, 120));
            c.header("Cache-Control", "public, max-age=10, s-maxage=15");
            return c.json(cached.payload as Record<string, unknown>);
        }
        recordError(`GET /mgp/${accion}`, 502, message);
        c.header("Cache-Control", "no-store");
        return c.json({ error: "mgp_unavailable", message }, 502);
    }
});

app.route("/auth", authRoutes);
app.route("/favoritos", favoritosRoutes);
app.route("/rutinas", rutinasRoutes);
app.route("/subscribe", subscribeRoutes);
app.route("/telegram", telegramRoutes);
app.route("/lineas", lineasRoutes);
app.route("/stats", statsRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));
app.onError((err, c) => {
    console.error("[error]", err);
    return c.json({ error: "internal_error" }, 500);
});

serve(
    { fetch: app.fetch, port: env.PORT, hostname: env.HOST },
    (info) => {
        console.log(`[bondi-api] http://${info.address}:${info.port}`);
    },
);
