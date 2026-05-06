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

const app = new Hono();

app.use(logger());
app.use(secureHeaders());

app.use(
    "*",
    cors({
        origin: (origin) => (env.ALLOWED_ORIGINS.includes(origin) ? origin : null),
        credentials: true,
        allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: 600,
    }),
);

app.get("/", (c) => c.json({ service: "bondi-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

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
