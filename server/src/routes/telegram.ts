/**
 * Webhook de Telegram para "compartir viaje" en vivo.
 *
 * Flujo:
 * - User en bondi-mdp toca compartir → genera deep-link `t.me/<bot>?start=<linea>__R__<ramal>`.
 * - Telegram bot recibe /start con payload, le pide al user que comparta
 *   ubicación en vivo.
 * - Cada update de ubicación llega como `edited_message.location` con el
 *   mismo chat_id; lo identificamos contra la sesión que /start creó.
 *
 * Calculamos velocidad instantánea (Δdistancia/Δt vs último punto) y velocidad
 * media efectiva (mediana de los últimos N puntos del history, descartando
 * paradas cortas).
 */

import { Hono } from "hono";
import { query } from "../db.js";
import { haversineMts, median } from "../lib/geo.js";
import { parseLiveSharePayload } from "../lib/liveSharePayload.js";

const TELEGRAM_API = "https://api.telegram.org";

// Para velocidad media: tomamos los últimos N puntos del history y descartamos
// los segmentos con velocidad muy baja (parada en semáforo o esperando).
const AVG_WINDOW = 8;
const MIN_KMH_FOR_AVG = 2;

type StartUpdate = {
    message?: {
        text?: string;
        chat?: { id?: number };
    };
};

type LocationUpdate = {
    edited_message?: {
        chat?: { id?: number };
        location?: { latitude: number; longitude: number; live_period?: number };
    };
    message?: {
        chat?: { id?: number };
        location?: { latitude: number; longitude: number; live_period?: number };
    };
};

type CurrentRow = {
    lat: number;
    lng: number;
    last_seen_at: string;
};

type HistoryRow = {
    velocity_kmh: number | null;
};

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return; // sin token, no respondemos por chat (igual aceptamos los updates)
    try {
        await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
    } catch (e) {
        console.warn("[telegram] sendMessage falló", e);
    }
}

async function handleStart(chatId: string, after: string): Promise<void> {
    const { linea, ramal } = parseLiveSharePayload(after);
    if (!linea) return;

    await query(
        `insert into bondi.bus_locations (session_id, linea, ramal, lat, lng, started_at, last_seen_at)
         values ($1, $2, $3, 0, 0, now(), now())
         on conflict (session_id) do update set
            linea = excluded.linea,
            ramal = excluded.ramal,
            started_at = now(),
            last_seen_at = now(),
            velocity_kmh = null,
            avg_velocity_kmh = null`,
        [chatId, linea, ramal],
    );

    const ramalInfo = ramal ? `, ramal ${ramal},` : "";
    await sendTelegramMessage(
        chatId,
        `✅ Listo (línea ${linea}${ramalInfo}). Ahora tocá el ícono 📎, seleccioná "Ubicación" y luego "Compartir Ubicación en Tiempo Real" para que los que esperan este recorrido te vean.`,
    );
}

async function handleLocation(
    chatId: string,
    lat: number,
    lng: number,
): Promise<void> {
    const { rows: cur } = await query<CurrentRow & { linea: string; ramal: string | null }>(
        `select lat, lng, last_seen_at, linea, ramal from bondi.bus_locations where session_id = $1`,
        [chatId],
    );
    const prev = cur[0];
    if (!prev) {
        // No teníamos sesión registrada (capaz hizo /start después). Igual la
        // creamos en estado "sin línea" para no perder el dato.
        await query(
            `insert into bondi.bus_locations (session_id, linea, lat, lng)
             values ($1, '?', $2, $3)
             on conflict (session_id) do nothing`,
            [chatId, lat, lng],
        );
        return;
    }

    let velocityKmh: number | null = null;
    if (prev.lat !== 0 || prev.lng !== 0) {
        const distMts = haversineMts(
            { lat: prev.lat, lng: prev.lng },
            { lat, lng },
        );
        const dtSec = (Date.now() - new Date(prev.last_seen_at).getTime()) / 1000;
        if (dtSec > 0 && dtSec < 5 * 60) {
            // Si el gap es muy grande, no calculamos velocidad (probablemente una
            // pausa o el user salió de cobertura).
            velocityKmh = (distMts / dtSec) * 3.6;
        }
    }

    // Velocidad media efectiva sobre los últimos puntos del history.
    const { rows: hist } = await query<HistoryRow>(
        `select velocity_kmh from bondi.bus_locations_history
         where session_id = $1 and velocity_kmh is not null
         order by captured_at desc
         limit $2`,
        [chatId, AVG_WINDOW],
    );
    const validKmh = hist
        .map((h) => h.velocity_kmh)
        .filter((v): v is number => v !== null && v >= MIN_KMH_FOR_AVG);
    if (velocityKmh !== null && velocityKmh >= MIN_KMH_FOR_AVG) {
        validKmh.unshift(velocityKmh);
    }
    const avgKmh = median(validKmh);

    await query(
        `update bondi.bus_locations
         set lat = $2, lng = $3, last_seen_at = now(),
             velocity_kmh = $4, avg_velocity_kmh = $5
         where session_id = $1`,
        [chatId, lat, lng, velocityKmh, avgKmh],
    );

    await query(
        `insert into bondi.bus_locations_history
            (session_id, linea, ramal, lat, lng, velocity_kmh)
         values ($1, $2, $3, $4, $5, $6)`,
        [chatId, prev.linea, prev.ramal, lat, lng, velocityKmh],
    );
}

export const telegramRoutes = new Hono();

telegramRoutes.post("/webhook", async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ ok: true });
    }

    try {
        // 1) /start con payload
        const startBody = body as StartUpdate;
        const text = startBody.message?.text;
        const chatIdNum = startBody.message?.chat?.id;
        if (typeof text === "string" && /^\/start/i.test(text) && chatIdNum) {
            const after = text.replace(/^\/start(?:@[A-Za-z0-9_]+)?\s*/i, "").trim();
            await handleStart(chatIdNum.toString(), after);
            return c.json({ ok: true });
        }

        // 2) location updates (live location llega como edited_message)
        const locBody = body as LocationUpdate;
        const msg = locBody.edited_message ?? locBody.message;
        if (msg?.location && msg.chat?.id) {
            await handleLocation(
                msg.chat.id.toString(),
                msg.location.latitude,
                msg.location.longitude,
            );
            return c.json({ ok: true });
        }
    } catch (e) {
        console.error("[telegram] webhook error", e);
    }
    return c.json({ ok: true });
});
