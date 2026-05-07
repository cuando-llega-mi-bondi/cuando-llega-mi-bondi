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
import { fetchMgpDirect, isMgpDirectEnabled } from "./lib/mgpDirect.js";

const app = new Hono();

app.use(logger());
app.use(secureHeaders());

// Acepta orígenes en ALLOWED_ORIGINS o cualquier subdominio *.vercel.app
// (preview deploys cambian de URL en cada push y no queremos sincronizar a mano).
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i;
function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return false;
    if (env.ALLOWED_ORIGINS.includes(origin)) return true;
    return VERCEL_PREVIEW_RE.test(origin);
}

app.use(
    "*",
    cors({
        origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
        credentials: true,
        allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: 600,
    }),
);

app.get("/", (c) => c.json({ service: "bondi-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Compat shim: el frontend legacy (rama staging) hace POST / con
// `accion=...&otherParams=...` apuntando a este host. Reenvía el body raw a la
// API municipal y devuelve la respuesta JSON sin transformar (shape PascalCase
// original que el frontend ya parsea).
app.post("/", async (c) => {
    const ct = (c.req.header("content-type") ?? "").toLowerCase();
    let body: string;
    if (ct.includes("application/x-www-form-urlencoded")) {
        body = await c.req.text();
    } else if (ct.includes("multipart/form-data")) {
        const fd = await c.req.formData();
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
            if (typeof v === "string") params.append(k, v);
        }
        body = params.toString();
    } else {
        return c.json({ error: "unsupported_content_type", got: ct }, 415);
    }

    if (!body) return c.json({ error: "empty_body" }, 400);

    if (isMgpDirectEnabled()) {
        try {
            const data = await fetchMgpDirect(body);
            return c.json(data as Record<string, unknown>);
        } catch (e) {
            return c.json(
                { error: "mgp_direct_failed", message: (e as Error).message },
                502,
            );
        }
    }

    if (env.MGP_PROXY_URL) {
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
            const status = r.status as 200 | 400 | 401 | 403 | 404 | 500 | 502;
            try {
                return c.json(JSON.parse(text), status);
            } catch {
                return c.text(text, status);
            }
        } catch (e) {
            return c.json(
                { error: "mgp_proxy_failed", message: (e as Error).message },
                502,
            );
        } finally {
            clearTimeout(tid);
        }
    }

    return c.json({ error: "no_mgp_config" }, 500);
});

app.route("/auth", authRoutes);
app.route("/favoritos", favoritosRoutes);
app.route("/rutinas", rutinasRoutes);
app.route("/subscribe", subscribeRoutes);
app.route("/telegram", telegramRoutes);
app.route("/lineas", lineasRoutes);

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
