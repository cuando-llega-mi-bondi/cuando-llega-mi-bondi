#!/usr/bin/env node
/**
 * Mini proxy para correr en Termux (Android) que reenvía pedidos a appsl.mardelplata.gob.ar
 * usando la auth de la app oficial V670 (RSA pubkey + shared key).
 *
 * Sirve para que el spider/dev local pegue acá en lugar de a appsl directo,
 * porque appsl rate-limita / rechaza requests con TLS fingerprint distinto al
 * del WebView Cordova de la app oficial. Termux corre en Android y sus
 * requests salen por la stack de red del teléfono, así que appsl las acepta.
 *
 * Uso:
 *   MGP_RSA_PUBKEY="..." MGP_SHARED_KEY="..." node termux-proxy.js
 *   # Opcional:
 *   #   PORT=8080
 *   #   PROXY_TOKEN=bondimdp2024   (default; el dev local lo manda en x-proxy-token)
 *
 * Endpoints:
 *   GET  /init    → fuerza re-auth y devuelve { cookies: "PHPSESSID=..." } (opcional)
 *   POST /proxy   → body x-www-form-urlencoded (ej: "accion=RecuperarLineaPorCuandoLlega")
 *                   header x-proxy-token: <token>
 *                   responde con el JSON tal cual lo devolvió appsl
 *   GET  /health  → "ok"
 */

const http = require("node:http");
const { publicEncrypt, constants, randomUUID } = require("node:crypto");

const PORT = Number(process.env.PORT || 8080);
const TOKEN = process.env.PROXY_TOKEN || "bondimdp2024";
const RSA_PUBKEY = process.env.MGP_RSA_PUBKEY;
const SHARED_KEY = process.env.MGP_SHARED_KEY;

if (!RSA_PUBKEY || !SHARED_KEY) {
    console.error("Falta MGP_RSA_PUBKEY o MGP_SHARED_KEY en env");
    process.exit(1);
}

const APP_BASE = "https://appsl.mardelplata.gob.ar/apps/app_cuando_llegaV670";
const UA =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.231205.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36";
const HEADERS_BASE = {
    "User-Agent": UA,
    "X-Requested-With": "ar.gob.mardelplata.cuandollega",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
};

const REAUTH_INTERVAL_MS = 100_000;

let session = null; // { phpsessid, authedAt }
let pending = null;

function pubkeyPem() {
    const raw = RSA_PUBKEY.trim();
    if (raw.startsWith("-----BEGIN")) return raw;
    const stripped = raw.replace(/\s+/g, "");
    const wrapped = stripped.match(/.{1,64}/g).join("\n");
    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function extractCookie(setCookies, name) {
    const re = new RegExp(`${name}=([^;]+)`);
    for (const c of setCookies) {
        const m = c.match(re);
        if (m) return m[1];
    }
    return undefined;
}

async function authenticate() {
    const baseRes = await fetch(`${APP_BASE}/`, {
        headers: HEADERS_BASE,
        redirect: "manual",
        cache: "no-store",
    });
    const setCookies = baseRes.headers.getSetCookie?.() ?? [];
    const phpsessid = extractCookie(setCookies, "PHPSESSID");
    if (!phpsessid) throw new Error("MGP no devolvió PHPSESSID en bootstrap");

    const epoch = Math.floor(Date.now() / 1000);
    const payload = `9!1;${epoch};${phpsessid};#95`;
    const encrypted = publicEncrypt(
        { key: pubkeyPem(), padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(payload, "utf-8"),
    );
    const token = encrypted.toString("base64");

    const regBody = new URLSearchParams({
        dispositivo: "Android:Pixel 8:14",
        uuid: randomUUID(),
        token,
        clave: SHARED_KEY,
    }).toString();

    const regRes = await fetch(`${APP_BASE}/registro.php`, {
        method: "POST",
        headers: {
            ...HEADERS_BASE,
            Cookie: `PHPSESSID=${phpsessid}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: `${APP_BASE}/`,
        },
        body: regBody,
        cache: "no-store",
    });
    if (!regRes.ok) {
        throw new Error(`registro.php devolvió ${regRes.status}`);
    }

    return { phpsessid, authedAt: Date.now() };
}

async function getSession() {
    if (session && Date.now() - session.authedAt < REAUTH_INTERVAL_MS) return session;
    if (pending) return pending;
    pending = authenticate()
        .then((s) => { session = s; return s; })
        .catch((e) => { session = null; throw e; })
        .finally(() => { pending = null; });
    return pending;
}

async function callAppWS(s, body) {
    const res = await fetch(`${APP_BASE}/appWS.php`, {
        method: "POST",
        headers: {
            ...HEADERS_BASE,
            Cookie: `PHPSESSID=${s.phpsessid}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: `${APP_BASE}/`,
        },
        body,
        cache: "no-store",
    });
    return { status: res.status, text: await res.text() };
}

function looksUnauthenticated(text) {
    if (!text.trim()) return true;
    const head = text.trimStart().slice(0, 5).toLowerCase();
    return head.startsWith("<");
}

async function fetchMgpDirect(body) {
    let s = await getSession();
    let { status, text } = await callAppWS(s, body);

    if (looksUnauthenticated(text) || status >= 400) {
        session = null;
        s = await getSession();
        ({ status, text } = await callAppWS(s, body));
    }

    if (status >= 400) throw new Error(`appWS.php devolvió ${status}`);
    if (!text) throw new Error("appWS.php devolvió body vacío tras re-auth");
    try { return JSON.parse(text); }
    catch { throw new Error("appWS.php devolvió respuesta no JSON"); }
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let buf = "";
        req.on("data", (c) => { buf += c; });
        req.on("end", () => resolve(buf));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    const t0 = Date.now();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const log = (msg) => console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname} ${msg} (${Date.now() - t0}ms)`);

    try {
        if (req.method === "GET" && url.pathname === "/health") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("ok");
            log("200");
            return;
        }

        const provided = req.headers["x-proxy-token"];
        if (provided !== TOKEN) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "x-proxy-token inválido" }));
            log("401");
            return;
        }

        if (req.method === "GET" && url.pathname === "/init") {
            session = null;
            const s = await getSession();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ cookies: `PHPSESSID=${s.phpsessid}` }));
            log("200 init");
            return;
        }

        if (req.method === "POST" && url.pathname === "/proxy") {
            const body = await readBody(req);
            const data = await fetchMgpDirect(body);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(data));
            const accion = new URLSearchParams(body).get("accion");
            log(`200 ${accion}`);
            return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "ruta no encontrada" }));
        log("404");
    } catch (e) {
        console.error(`[err] ${e.message}`);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
        log("502");
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Termux proxy escuchando en 0.0.0.0:${PORT}`);
    console.log(`Token: ${TOKEN}`);
    console.log(`Probá: curl -H 'x-proxy-token: ${TOKEN}' -X POST -d 'accion=RecuperarLineaPorCuandoLlega' http://localhost:${PORT}/proxy`);
});
