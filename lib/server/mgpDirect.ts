import { publicEncrypt, constants, randomUUID } from "node:crypto";

/**
 * Cliente V670 (app Cordova oficial) → appWS.php.
 * Las claves son las de la APK oficial (públicas al descompilar).
 * Bootstrap: PHPSESSID suele venir de un POST a appWS, no del GET /.
 */

const APP_BASE = "https://appsl.mardelplata.gob.ar/apps/app_cuando_llegaV670";
const UA =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.231205.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36";
const HEADERS_BASE = {
    "User-Agent": UA,
    "X-Requested-With": "ar.gob.mardelplata.cuandollega",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
};

const DEFAULT_RSA =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA80+5G8FVXDbfJG97ApvPlz2nc8n+" +
    "fHTcpL4hvksmjGeRqHFXDmJOw0/B4bHsVFe/2L1dA4ZjbgxG1NufQRtVuE2NMTe3P3XbKONW" +
    "Qsbx0+LgyM1XgOJ1nccOJB7CYy+S4kd4fsAryDBppCV61HXQxdY7Qrt/l9A4b7V73zAD3mOf" +
    "IWhkAuL62si7dQQ9pLljFuMdm0H3Gxg5ynyeaWNxXYl+4BxFr2hrxKK9/KlIODO3C/yCMjdf" +
    "SktsmuKfU0NAIL/Y4QCUMRnYw0A2/BL5Q/zwt8qTWZDxRx8qUuTw8NLRTVcjiubRKeZkwrUf" +
    "cyHpRwqDOoqFSaLKIMMA6Tq1EwIDAQAB";
const DEFAULT_SHARED = "c43fkd$dkfa!djc34";

const REAUTH_INTERVAL_MS = 100_000;
const AUTH_TIMEOUT_MS = 10_000;
const CALL_TIMEOUT_MS = 8_000;

type Session = { phpsessid: string; authedAt: number };

let session: Session | null = null;
let pending: Promise<Session> | null = null;

export function isMgpDirectEnabled(): boolean {
    if (process.env.MGP_DIRECT_DISABLED === "true") return false;
    return true;
}

function rsaPem(): string {
    const raw = (process.env.MGP_RSA_PUBKEY?.trim() || DEFAULT_RSA).trim();
    if (raw.startsWith("-----BEGIN")) return raw;
    const stripped = raw.replace(/\s+/g, "");
    const wrapped = stripped.match(/.{1,64}/g)!.join("\n");
    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function sharedKey(): string {
    return process.env.MGP_SHARED_KEY?.trim() || DEFAULT_SHARED;
}

function extractCookie(setCookies: string[], name: string): string | undefined {
    const re = new RegExp(`${name}=([^;]+)`);
    for (const c of setCookies) {
        const m = c.match(re);
        if (m) return m[1];
    }
    return undefined;
}

async function authenticate(): Promise<Session> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), AUTH_TIMEOUT_MS);
    try {
        // GET / a veces no manda Set-Cookie; appWS sí.
        const boot = await fetch(`${APP_BASE}/appWS.php`, {
            method: "POST",
            headers: {
                ...HEADERS_BASE,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "accion=_",
            redirect: "manual",
            cache: "no-store",
            signal: ctrl.signal,
        });
        const setCookies = boot.headers.getSetCookie?.() ?? [];
        const phpsessid = extractCookie(setCookies, "PHPSESSID");
        if (!phpsessid) throw new Error("MGP no devolvió PHPSESSID");

        const epoch = Math.floor(Date.now() / 1000);
        const payload = `9!1;${epoch};${phpsessid};#95`;
        const encrypted = publicEncrypt(
            { key: rsaPem(), padding: constants.RSA_PKCS1_PADDING },
            Buffer.from(payload, "utf-8"),
        );
        const token = encrypted.toString("base64");

        const regRes = await fetch(`${APP_BASE}/registro.php`, {
            method: "POST",
            headers: {
                ...HEADERS_BASE,
                Cookie: `PHPSESSID=${phpsessid}`,
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: `${APP_BASE}/`,
            },
            body: new URLSearchParams({
                dispositivo: "Android:Pixel 8:14",
                uuid: randomUUID(),
                token,
                clave: sharedKey(),
            }).toString(),
            cache: "no-store",
            signal: ctrl.signal,
        });
        if (!regRes.ok) throw new Error(`registro.php devolvió ${regRes.status}`);

        return { phpsessid, authedAt: Date.now() };
    } finally {
        clearTimeout(tid);
    }
}

async function getSession(): Promise<Session> {
    if (session && Date.now() - session.authedAt < REAUTH_INTERVAL_MS) return session;
    if (pending) return pending;
    pending = authenticate()
        .then((s) => {
            session = s;
            return s;
        })
        .catch((e) => {
            session = null;
            throw e;
        })
        .finally(() => {
            pending = null;
        });
    return pending;
}

async function callAppWS(
    s: Session,
    body: string,
): Promise<{ status: number; text: string }> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
    try {
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
            signal: ctrl.signal,
        });
        return { status: res.status, text: await res.text() };
    } finally {
        clearTimeout(tid);
    }
}

function looksUnauthenticated(text: string, status?: number): boolean {
    if (status === 302 || status === 301) return true;
    if (!text.trim()) return true;
    if (text.trimStart().startsWith("<")) return true;
    try {
        return (JSON.parse(text) as { CodigoEstado?: number }).CodigoEstado === -211;
    } catch {
        return false;
    }
}

export async function fetchMgpDirect(body: string): Promise<unknown> {
    let s = await getSession();
    let { status, text } = await callAppWS(s, body);

    if (status === 429 || status === 503) {
        throw new Error(`appWS.php devolvió ${status}`);
    }

    if (looksUnauthenticated(text, status) || status >= 400) {
        session = null;
        s = await getSession();
        ({ status, text } = await callAppWS(s, body));
    }

    if (status >= 400) throw new Error(`appWS.php devolvió ${status}`);
    if (!text) throw new Error("appWS.php devolvió body vacío tras re-auth");

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("appWS.php devolvió respuesta no JSON");
    }
}
