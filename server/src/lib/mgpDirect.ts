/**
 * Cliente directo a la API de la Municipalidad de Mar del Plata.
 *
 * Replica el comportamiento del WebView Cordova de la app oficial V670:
 * bootstrap GET para obtener PHPSESSID, autenticación con token RSA-encriptado
 * + clave compartida, y luego POSTs a appWS.php con esa cookie.
 *
 * Idéntico al wrapper que vive en lib/api/mgpDirect.ts del frontend Next; lo
 * mantenemos aparte porque los repos no comparten workspace de paquetes.
 */

import { publicEncrypt, constants, randomUUID } from "node:crypto";

const APP_BASE = "https://appsl.mardelplata.gob.ar/apps/app_cuando_llegaV670";
const UA =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.231205.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36";
const HEADERS_BASE = {
    "User-Agent": UA,
    "X-Requested-With": "ar.gob.mardelplata.cuandollega",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
};

const REAUTH_INTERVAL_MS = 100_000;

type Session = { phpsessid: string; authedAt: number };

let session: Session | null = null;
let pending: Promise<Session> | null = null;

export function isMgpDirectEnabled(): boolean {
    return Boolean(process.env.MGP_RSA_PUBKEY && process.env.MGP_SHARED_KEY);
}

function pubkeyPem(): string {
    const raw = process.env.MGP_RSA_PUBKEY!.trim();
    if (raw.startsWith("-----BEGIN")) return raw;
    const stripped = raw.replace(/\s+/g, "");
    const wrapped = stripped.match(/.{1,64}/g)!.join("\n");
    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
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
    const baseRes = await fetch(`${APP_BASE}/`, {
        headers: HEADERS_BASE,
        redirect: "manual",

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
        clave: process.env.MGP_SHARED_KEY!,
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

    });
    if (!regRes.ok) throw new Error(`registro.php devolvió ${regRes.status}`);

    return { phpsessid, authedAt: Date.now() };
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

async function callAppWS(s: Session, body: string): Promise<{ status: number; text: string }> {
    const res = await fetch(`${APP_BASE}/appWS.php`, {
        method: "POST",
        headers: {
            ...HEADERS_BASE,
            Cookie: `PHPSESSID=${s.phpsessid}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: `${APP_BASE}/`,
        },
        body,

    });
    return { status: res.status, text: await res.text() };
}

function looksUnauthenticated(text: string): boolean {
    if (!text.trim()) return true;
    const head = text.trimStart().slice(0, 5).toLowerCase();
    return head.startsWith("<");
}

export async function fetchMgpDirect(body: string): Promise<unknown> {
    let s = await getSession();
    let { status, text } = await callAppWS(s, body);

    if (looksUnauthenticated(text) || status >= 400) {
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
