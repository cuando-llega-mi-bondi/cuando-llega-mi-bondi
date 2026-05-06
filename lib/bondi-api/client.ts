/**
 * Cliente fetch para bondi-api (server self-hosted).
 * URL base viene de NEXT_PUBLIC_BONDI_API_URL — sin esto, todas las llamadas tiran.
 *
 * Toda llamada va con `credentials: 'include'` para que la cookie auth_token
 * (httpOnly, Domain=.aeterna.red en prod) viaje sola desde bondimdp.com.ar.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BONDI_API_URL?.replace(/\/$/, "");

export class ApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message?: string,
    ) {
        super(message ?? code);
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(
    path: string,
    opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
    if (!BASE_URL) {
        throw new ApiError(0, "no_api_url", "NEXT_PUBLIC_BONDI_API_URL no está configurado");
    }
    const { json, headers, ...rest } = opts;
    const init: RequestInit = {
        ...rest,
        credentials: "include",
        headers: {
            ...(json !== undefined ? { "content-type": "application/json" } : {}),
            ...headers,
        },
        body: json !== undefined ? JSON.stringify(json) : opts.body,
    };

    const res = await fetch(`${BASE_URL}${path}`, init);
    if (res.status === 204) return undefined as T;

    let payload: unknown = null;
    if (res.headers.get("content-type")?.includes("application/json")) {
        payload = await res.json().catch(() => null);
    }

    if (!res.ok) {
        const code =
            (payload as { error?: string } | null)?.error ?? `http_${res.status}`;
        throw new ApiError(res.status, code);
    }
    return payload as T;
}
