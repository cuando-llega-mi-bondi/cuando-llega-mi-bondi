import { STATIC_REFERENCE_ACCIONES } from "@shared/api/staticReferenceAcciones";
import {
    MgpBusinessError,
    MgpNetworkError,
    MgpUnavailableError,
    classifyUnavailableMessage,
} from "@shared/api/errors";

/**
 * Sirve líneas/calles/intersecciones/paradas/recorridos desde el dump local en
 * `data/mgp-static-dump.json` (vía `/api/reference`) en lugar de pegarle a la
 * muni. Habilitado por default. Si /api/reference falla, hacemos fallback al
 * proxy MGP automáticamente — ver `post()` abajo.
 *
 * Para desactivarlo (ej. probar el proxy directo), seteá
 * `NEXT_PUBLIC_USE_STATIC_REFERENCE=false`.
 */

function staticReferenceEnabled(): boolean {
    if (typeof process === "undefined") return true;
    const raw = process.env.NEXT_PUBLIC_USE_STATIC_REFERENCE?.trim().toLowerCase();
    return raw !== "false" && raw !== "0";
}

/**
 * Origen absoluto solo si `post` corre en el servidor (poco frecuente en este proyecto).
 * En el navegador se devuelve `""` y el fetch va a `/api/reference` en el mismo host.
 * En Vercel, `VERCEL_URL` lo define el entorno; en local, `http://localhost:3000` por defecto.
 */
function internalAppOrigin(): string {
    if (typeof window !== "undefined") {
        return "";
    }
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) {
        return /^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`;
    }
    return "http://localhost:3000";
}

/**
 * Cliente HTTP hacia el backend self-hosted (`NEXT_PUBLIC_CUANDO_API_URL`).
 *
 * No hay ruta interna: la API municipal bloquea las IPs de Vercel, así que
 * todo el tráfico vivo (no-referencia) tiene que salir por nuestro backend
 * propio. Si la env var no está configurada, `post()` falla en el primer uso
 * en vez de pegar silenciosamente a un endpoint que no existe.
 *
 * Modo catálogo local: con `NEXT_PUBLIC_USE_STATIC_REFERENCE=true` y dump en
 * `data/mgp-static-dump.json`, las acciones en `STATIC_REFERENCE_ACCIONES`
 * se atienden primero con `GET /api/reference` (sin pegarle al backend).
 */
function resolveCuandoApiBases(): string[] {
    const urls: string[] = [];
    if (typeof process !== "undefined") {
        const cuando = process.env.NEXT_PUBLIC_CUANDO_API_URL?.trim();
        if (cuando) urls.push(cuando);
        
        const proxy = process.env.NEXT_PUBLIC_PROXY_API_URL?.trim();
        if (proxy) urls.push(proxy);
    }
    
    return urls.map(raw => {
        let base = raw.replace(/\/$/, "");
        if (!/^https?:\/\//i.test(base)) {
            base = `https://${base.replace(/^\/+/, "")}`;
        }
        return base;
    });
}

const BASE_URLS = resolveCuandoApiBases();

function getBaseUrl(): string | null {
    if (BASE_URLS.length === 0) return null;
    return BASE_URLS[Math.floor(Math.random() * BASE_URLS.length)];
}

export const BASE_URL = BASE_URLS[0] || null; // for backwards compatibility if needed, though getBaseUrl() is preferred for dynamic use

export type ActionParams = Record<string, string>;
export type SwrActionKey = [string, ActionParams];

/**
 * Timeout por defecto para requests vivas al backend: una request colgada se
 * convierte en error visible (y reintentable) en vez de un spinner infinito.
 */
const LIVE_REQUEST_TIMEOUT_MS = 12_000;

function defaultTimeoutSignal(): AbortSignal | undefined {
    // Safari viejos no tienen AbortSignal.timeout; en ese caso, sin timeout.
    if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
        return AbortSignal.timeout(LIVE_REQUEST_TIMEOUT_MS);
    }
    return undefined;
}

export interface MgpResponseMeta {
    /** `X-Cache` del proxy; `null` cuando la respuesta vino del catálogo estático. */
    cache: "HIT" | "MISS" | "STALE" | null;
    /** `X-Stale-Reason` del proxy (solo presente si `cache === "STALE"`). */
    staleReason: string | null;
}

export interface MgpResult<T = unknown> {
    data: T;
    meta: MgpResponseMeta;
}

const STATIC_REFERENCE_META: MgpResponseMeta = { cache: null, staleReason: null };

/**
 * Pega a `mgp-proxy` (o al catálogo estático) y devuelve el body junto con la
 * metadata de caché real del proxy (`X-Cache`/`X-Stale-Reason`), chequeando
 * `CodigoEstado` antes de considerar la respuesta exitosa. Ver
 * FRONTEND_INTEGRATION.md — un 200 no implica que haya datos útiles.
 */
export async function postWithMeta(
    accion: string,
    params: ActionParams = {},
    options?: { signal?: AbortSignal },
): Promise<MgpResult> {
    if (staticReferenceEnabled() && STATIC_REFERENCE_ACCIONES.has(accion)) {
        try {
            const q = new URLSearchParams({ accion, ...params }).toString();
            const origin = internalAppOrigin();
            const refUrl = `${origin || ""}/api/reference?${q}`;
            // Sin `cache: "no-store"`: en el browser respeta Cache-Control del route;
            // en el servidor, Data Cache alineada al s-maxage de /api/reference.
            const refRes = await fetch(refUrl, {
                method: "GET",
                signal: options?.signal,
                ...(typeof window === "undefined"
                    ? { next: { revalidate: 86400 } }
                    : {}),
            });
            if (refRes.ok) {
                return { data: await refRes.json(), meta: STATIC_REFERENCE_META };
            }
        } catch {
            // fallback a proxy MGP
        }
    }

    const baseUrl = getBaseUrl();
    if (!baseUrl) {
        throw new Error(
            "NEXT_PUBLIC_CUANDO_API_URL (o NEXT_PUBLIC_PROXY_API_URL) no están configuradas. El front no puede pegarle directo a la muni desde Vercel; configurá la URL del backend self-hosted.",
        );
    }

    // GET /mgp/:accion?params: ruta cacheable por Cloudflare. Con TTL corto en
    // edge, una sola request al backend sirve a todos los usuarios que pidan
    // la misma combinación en la ventana de cache. Mismo shape que el POST /
    // shim (PascalCase MGP raw).
    const qs = new URLSearchParams(params).toString();
    const url = `${baseUrl}/mgp/${encodeURIComponent(accion)}${qs ? `?${qs}` : ""}`;

    let res: Response;
    try {
        res = await fetch(url, {
            method: "GET",
            signal: options?.signal ?? defaultTimeoutSignal(),
        });
    } catch (err: unknown) {
        const error = err as { name?: string };
        const isTimeout = error?.name === "AbortError" || error?.name === "TimeoutError";
        throw new MgpNetworkError(
            isTimeout
                ? "La consulta tardó demasiado."
                : "El servidor de la Municipalidad no responde. Verificá tu conexión e intentá de nuevo.",
            isTimeout,
        );
    }

    if (res.status === 502) {
        const body = await res.json().catch(() => ({ message: "" }));
        const message: string = body?.message ?? "";
        throw new MgpUnavailableError(message, classifyUnavailableMessage(message), 502);
    }

    if (!res.ok) {
        throw new MgpUnavailableError(`HTTP ${res.status}`, "normal", res.status);
    }

    const cache = res.headers.get("X-Cache") as MgpResponseMeta["cache"];
    const staleReason = res.headers.get("X-Stale-Reason");
    const data = await res.json();

    // TODO(verify): confirmar contra el proxy real que CodigoEstado/MensajeEstado
    // vienen siempre en PascalCase (así los documenta FRONTEND_INTEGRATION.md); el
    // fallback camelCase es defensivo por si alguna acción responde distinto.
    const codigoEstado = data?.CodigoEstado ?? data?.codigoEstado;
    if (typeof codigoEstado === "number" && codigoEstado !== 0) {
        const mensajeEstado = data?.MensajeEstado ?? data?.mensajeEstado ?? "";
        throw new MgpBusinessError(codigoEstado, mensajeEstado);
    }

    return { data, meta: { cache, staleReason } };
}

// Mismo contrato laxo que tenía `post()` antes (el body ya venía de
// `res.json(): Promise<any>`); los ~10 call sites existentes tipan el shape
// ellos mismos por acción.
export async function post(
    accion: string,
    params: ActionParams = {},
    options?: { signal?: AbortSignal },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    return (await postWithMeta(accion, params, options)).data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function swrFetcher([accion, params]: SwrActionKey): Promise<any> {
    return (await postWithMeta(accion, params)).data;
}

/** Variante de `swrFetcher` que también expone `X-Cache`/`X-Stale-Reason`. */
export async function swrFetcherWithMeta([accion, params]: SwrActionKey): Promise<MgpResult> {
    return postWithMeta(accion, params);
}
