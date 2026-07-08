/**
 * Analytics — persiste cada consulta MGP que entra al server en la DB de
 * Supabase (tabla `query_events`), compartida con el mgp-proxy para que el
 * dashboard de analytics agregue el tráfico de ambos.
 *
 * Bufferea en memoria y flushea en batch cada FLUSH_INTERVAL_MS o cuando el
 * buffer llega a FLUSH_THRESHOLD. Inserta vía REST (PostgREST) con fetch —
 * sin dependencias extra. Es fire-and-forget: nunca bloquea ni rompe la
 * respuesta al cliente. Si faltan SUPABASE_URL/SUPABASE_KEY, se desactiva
 * silenciosamente.
 */
import { env } from "../env.js";

const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_THRESHOLD = 50;
const MAX_BUFFER = 500;

type QueryEvent = {
    accion: string;
    codigo_parada: string | null;
    linea: string | null;
};

const enabled = Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);
const endpoint = enabled ? `${env.SUPABASE_URL}/rest/v1/query_events` : "";

let buffer: QueryEvent[] = [];

/**
 * Registra una consulta. Fire-and-forget, nunca bloquea ni lanza.
 */
export function trackQuery(
    accion: string,
    codigoParada?: string | null,
    linea?: string | null,
): void {
    if (!enabled) return;
    buffer.push({
        accion,
        codigo_parada: codigoParada ?? null,
        linea: linea ?? null,
    });
    if (buffer.length >= FLUSH_THRESHOLD) void flushBuffer();
}

async function flushBuffer(): Promise<void> {
    if (!enabled || buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    try {
        const r = await fetch(endpoint, {
            method: "POST",
            headers: {
                apikey: env.SUPABASE_KEY as string,
                Authorization: `Bearer ${env.SUPABASE_KEY as string}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify(batch),
        });
        if (!r.ok) {
            const detail = await r.text().catch(() => "");
            console.error(`[analytics] insert falló ${r.status}: ${detail.slice(0, 200)}`);
            // Re-encolar el batch (acotado para no crecer sin límite).
            if (buffer.length < MAX_BUFFER) buffer.unshift(...batch);
        }
    } catch (e) {
        console.error("[analytics] flush exception:", (e as Error).message);
        if (buffer.length < MAX_BUFFER) buffer.unshift(...batch);
    }
}

if (enabled) {
    console.log("[analytics] Supabase query_events habilitado ✅");
    setInterval(() => void flushBuffer(), FLUSH_INTERVAL_MS).unref?.();

    const flushAndExit = () => {
        void flushBuffer().finally(() => process.exit(0));
    };
    process.on("SIGTERM", flushAndExit);
    process.on("SIGINT", flushAndExit);
} else {
    console.warn(
        "[analytics] ⚠️  SUPABASE_URL/SUPABASE_KEY no configuradas — analytics deshabilitado",
    );
}
