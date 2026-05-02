function resolveCuandoApiBase(): string {
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
