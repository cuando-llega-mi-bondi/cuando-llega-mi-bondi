/**
 * Job que corre cada minuto: por cada rutina arrival_watch habilitada, fetch
 * arribos del MGP y dispara push si está dentro del threshold + cooldown.
 */
import { query } from "../db.js";
import { env } from "../env.js";
import { sendPush, markSubscriptionGone, type Subscription } from "../lib/webpush.js";

type WatchRow = {
    rutina_id: string;
    user_id: string;
    parada_id: string;
    linea_id: string;
    threshold_min: number;
    cooldown_min: number;
    active_dows: number[] | null;
    last_fired_at: string | null;
    sub_id: string;
    sub_endpoint: string;
    sub_p256dh: string;
    sub_auth: string;
};

type Arribo = { Arribo?: string; DescripcionLinea?: string };

function parseEtaMin(s: string | undefined): number | null {
    if (!s) return null;
    const m = s.match(/(\d+)/);
    return m ? Number(m[1]) : null;
}

function nowDow(): number {
    // ISO: 1=Lun..7=Dom
    const day = new Date().getDay(); // 0=Sun..6=Sat
    return day === 0 ? 7 : day;
}

function cooldownElapsed(lastFiredAt: string | null, cooldownMin: number): boolean {
    if (!lastFiredAt) return true;
    return Date.now() - new Date(lastFiredAt).getTime() >= cooldownMin * 60_000;
}

async function fetchEta(paradaId: string, lineaId: string): Promise<number | null> {
    if (!env.MGP_PROXY_URL) return null;
    const body = new URLSearchParams({
        accion: "RecuperarProximosArribosW",
        codigoParada: paradaId,
        codigoLineaParada: lineaId,
    });
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    try {
        const r = await fetch(env.MGP_PROXY_URL, {
            method: "POST",
            body,
            headers: { "content-type": "application/x-www-form-urlencoded" },
            signal: ctrl.signal,
        });
        if (!r.ok) return null;
        const j = (await r.json().catch(() => null)) as { arribos?: Arribo[] } | null;
        if (!j?.arribos?.length) return null;
        const etas = j.arribos
            .map((a) => parseEtaMin(a.Arribo))
            .filter((x): x is number => x !== null);
        return etas.length ? Math.min(...etas) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(tid);
    }
}

export async function runArrivalJob(): Promise<{ checked: number; fired: number; gone: number }> {
    const dow = nowDow();

    const { rows } = await query<WatchRow>(
        `select r.id as rutina_id, r.user_id, r.parada_id, r.linea_id,
                r.threshold_min, r.cooldown_min, r.active_dows, r.last_fired_at,
                s.id as sub_id, s.endpoint as sub_endpoint,
                s.p256dh as sub_p256dh, s.auth as sub_auth
         from bondi.rutinas r
         join bondi.subscriptions s on s.user_id = r.user_id and s.disabled_at is null
         where r.kind = 'arrival_watch'
           and r.enabled = true
           and (r.active_dows is null or $1 = any(r.active_dows))`,
        [dow],
    );

    const candidates = rows.filter((w) => cooldownElapsed(w.last_fired_at, w.cooldown_min));

    let fired = 0;
    let goneCount = 0;

    for (const w of candidates) {
        if (w.parada_id == null || w.linea_id == null || w.threshold_min == null) continue;
        const eta = await fetchEta(w.parada_id, w.linea_id);
        if (eta === null || eta > w.threshold_min) continue;

        const sub: Subscription = {
            id: w.sub_id,
            endpoint: w.sub_endpoint,
            p256dh: w.sub_p256dh,
            auth: w.sub_auth,
        };
        const result = await sendPush(sub, {
            title: `Línea ${w.linea_id} en ${eta} min`,
            body: `Tu bondi llega en ~${eta} min a la parada.`,
            tag: `arrival-${w.parada_id}-${w.linea_id}`,
        });

        if (result.ok) {
            fired++;
            await query(
                `update bondi.rutinas set last_fired_at = now() where id = $1`,
                [w.rutina_id],
            );
        } else if (result.gone) {
            goneCount++;
            await markSubscriptionGone(w.sub_id);
        }
    }

    return { checked: candidates.length, fired, gone: goneCount };
}
