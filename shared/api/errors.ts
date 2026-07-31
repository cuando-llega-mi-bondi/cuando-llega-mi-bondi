/**
 * Errores tipados del cliente MGP, alineados a `FRONTEND_INTEGRATION.md`:
 * distinguen error de negocio (CodigoEstado != 0, no tiene sentido reintentar),
 * indisponibilidad del proxy (502 mgp_unavailable, con pistas de cuán agresivo
 * conviene reintentar) y fallas de red/timeout del propio fetch.
 */

export type Retriable = "fast" | "normal" | "slow" | "none";

export class MgpBusinessError extends Error {
    readonly kind = "business" as const;
    readonly retriable: Retriable = "none";

    constructor(
        public readonly codigoEstado: number,
        public readonly mensajeEstado: string,
    ) {
        super(mensajeEstado || `MGP CodigoEstado ${codigoEstado}`);
        this.name = "MgpBusinessError";
    }
}

export class MgpUnavailableError extends Error {
    readonly kind = "unavailable" as const;

    constructor(
        message: string,
        public readonly retriable: "fast" | "normal" | "slow",
        public readonly status: number,
    ) {
        super(message);
        this.name = "MgpUnavailableError";
    }
}

export class MgpNetworkError extends Error {
    readonly kind = "network" as const;
    readonly retriable: Retriable = "normal";

    constructor(
        message: string,
        public readonly isTimeout: boolean,
    ) {
        super(message);
        this.name = "MgpNetworkError";
    }
}

export type MgpClientError = MgpBusinessError | MgpUnavailableError | MgpNetworkError;

/** Prefijos del `message` de un 502 `mgp_unavailable` (ver FRONTEND_INTEGRATION.md). */
export function classifyUnavailableMessage(message: string): "fast" | "normal" | "slow" {
    if (message.startsWith("circuit_open")) return "slow";
    if (message.startsWith("bridge_busy")) return "fast";
    return "normal";
}

export interface MgpErrorPresentation {
    kind: "business" | "unavailable" | "network" | "unknown";
    title: string;
    message: string;
    retriable: Retriable;
    /**
     * Peso visual sugerido: "info" para situaciones esperadas/transitorias que
     * no ameritan alarmar (dato mal puesto, saturación momentánea del bridge),
     * "warning" para las que sí indican que el servicio no está respondiendo.
     */
    severity: "info" | "warning";
}

/** Única fuente de verdad del copy en español para cada tipo de error del proxy. */
export function describeMgpError(err: unknown): MgpErrorPresentation {
    if (err instanceof MgpBusinessError) {
        return {
            kind: "business",
            title: "No pudimos completar la consulta",
            message:
                err.mensajeEstado ||
                "La Municipalidad rechazó la consulta. Revisá la parada o línea seleccionada.",
            retriable: "none",
            severity: "info",
        };
    }

    if (err instanceof MgpUnavailableError) {
        if (err.retriable === "slow") {
            return {
                kind: "unavailable",
                title: "El servicio de arribos no está disponible",
                message:
                    "La Municipalidad viene fallando y dejamos de insistir por unos minutos. Reintentamos automáticamente.",
                retriable: "slow",
                severity: "warning",
            };
        }
        if (err.retriable === "fast") {
            return {
                kind: "unavailable",
                title: "Buscando de nuevo",
                message: "El servicio está algo saturado en este momento. Reintentando enseguida.",
                retriable: "fast",
                severity: "info",
            };
        }
        return {
            kind: "unavailable",
            title: "El servicio de datos no responde",
            message: "La fuente oficial de la Municipalidad está tardando. Reintentamos automáticamente.",
            retriable: "normal",
            severity: "warning",
        };
    }

    if (err instanceof MgpNetworkError) {
        return {
            kind: "network",
            title: err.isTimeout ? "La consulta tardó demasiado" : "No hay conexión",
            message: "El servidor de la Municipalidad no responde. Verificá tu conexión e intentá de nuevo.",
            retriable: "normal",
            severity: "warning",
        };
    }

    return {
        kind: "unknown",
        title: "Error inesperado",
        message: err instanceof Error ? err.message : "Ocurrió un error desconocido.",
        retriable: "normal",
        severity: "warning",
    };
}

const BASE_DELAY_MS: Record<"fast" | "normal" | "slow", number> = {
    fast: 1_000,
    normal: 2_000,
    slow: 30_000,
};

const MAX_DELAY_MS: Record<"fast" | "normal" | "slow", number> = {
    fast: 30_000,
    normal: 30_000,
    slow: 60_000,
};

/**
 * Backoff exponencial con techo sugerido antes del próximo intento.
 * `Infinity` para errores de negocio: reintentar no los arregla.
 */
export function nextRetryDelayMs(err: unknown, attempt: number): number {
    const info = describeMgpError(err);
    if (info.retriable === "none") return Infinity;

    const bucket = info.retriable === "fast" || info.retriable === "slow" ? info.retriable : "normal";
    const delay = BASE_DELAY_MS[bucket] * 2 ** Math.max(0, attempt - 1);
    return Math.min(delay, MAX_DELAY_MS[bucket]);
}
