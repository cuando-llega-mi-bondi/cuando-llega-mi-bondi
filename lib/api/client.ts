import { STATIC_REFERENCE_ACCIONES } from "@/lib/staticReferenceAcciones";

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
 * No hace falta añadir nada a `.env` para esto.
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
 * Cliente HTTP hacia el proxy MGP (`BASE_URL`, típicamente `/api/cuando`).
 *
 * Modo catálogo local: con `NEXT_PUBLIC_USE_STATIC_REFERENCE=true` y dump en
 * `data/mgp-static-dump.json`, las acciones en `STATIC_REFERENCE_ACCIONES`
 * se atienden primero con `GET /api/reference` (sin pegarle a la muni).
 */
function resolveCuandoApiBase(): string {
    /** Optional absolute URL to offload proxy traffic from Vercel Edge Requests (own Worker/VPS). */
    const raw =
        typeof process !== "undefined"
            ? process.env.NEXT_PUBLIC_CUANDO_API_URL?.trim()
            : undefined;
    if (!raw) return "/api/cuando";
    let base = raw.replace(/\/$/, "");
    if (!/^https?:\/\//i.test(base)) {
        base = `https://${base.replace(/^\/+/, "")}`;
    }
    return base;
}

export const BASE_URL = resolveCuandoApiBase();

export type ActionParams = Record<string, string>;
export type SwrActionKey = [string, ActionParams];

export async function post(accion: string, params: ActionParams = {}) {
    if (staticReferenceEnabled() && STATIC_REFERENCE_ACCIONES.has(accion)) {
        try {
            const q = new URLSearchParams({ accion, ...params }).toString();
            const origin = internalAppOrigin();
            const refUrl = `${origin || ""}/api/reference?${q}`;
            const refRes = await fetch(refUrl, { method: "GET", cache: "no-store" });
            if (refRes.ok) {
                return refRes.json();
            }
        } catch {
            // fallback a proxy MGP
        }
    }

    const body = new URLSearchParams({ accion, ...params }).toString();
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
}

export class MgpError extends Error {
    constructor(
        message: string,
        public readonly isNetwork: boolean,
    ) {
        super(message);
        this.name = "MgpError";
    }
}

export async function swrFetcher([accion, params]: SwrActionKey) {
    try {
        return await post(accion, params);
    } catch (err: unknown) {
        const error = err as { name?: string; message?: string };

        if (
            err instanceof TypeError ||
            error?.name === "AbortError" ||
            error?.message?.startsWith("Failed to fetch")
        ) {
            throw new MgpError(
                "El servidor de la Municipalidad no responde. Verificá tu conexión e intentá de nuevo.",
                true,
            );
        }

        throw new MgpError(
            `Error del servidor (${error?.message ?? "desconocido"}). Intentá de nuevo en unos momentos.`,
            false,
        );
    }
}
