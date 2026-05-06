/**
 * Job que corre cada 5 min: dispara daily_reminder cuando llega su fire_at en
 * la TZ correcta y aún no se disparó hoy.
 */
import { query } from "../db.js";
import { sendPush, markSubscriptionGone, type Subscription } from "../lib/webpush.js";

type ReminderRow = {
    rutina_id: string;
    user_id: string;
    nombre: string;
    fire_at: string;
    tz: string;
    active_dows: number[] | null;
    last_fired_on: string | null;
    sub_id: string;
    sub_endpoint: string;
    sub_p256dh: string;
    sub_auth: string;
};

function nowInTz(tz: string): { dow: number; date: string; hhmm: string } {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        weekday: "short",
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    const dowMap: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
    };
    const year = parts.year ?? "1970";
    const month = parts.month ?? "01";
    const day = parts.day ?? "01";
    const hour = parts.hour ?? "00";
    const minute = parts.minute ?? "00";
    return {
        dow: dowMap[parts.weekday ?? "Mon"] ?? 1,
        date: `${year}-${month}-${day}`,
        hhmm: `${hour}:${minute}`,
    };
}

export async function runDailyJob(): Promise<{ checked: number; fired: number; gone: number }> {
    const { rows } = await query<ReminderRow>(
        `select r.id as rutina_id, r.user_id, r.nombre, r.fire_at::text as fire_at,
                r.tz, r.active_dows, r.last_fired_on::text as last_fired_on,
                s.id as sub_id, s.endpoint as sub_endpoint,
                s.p256dh as sub_p256dh, s.auth as sub_auth
         from bondi.rutinas r
         join bondi.subscriptions s on s.user_id = r.user_id and s.disabled_at is null
         where r.kind = 'daily_reminder' and r.enabled = true`,
    );

    let fired = 0;
    let goneCount = 0;
    let checked = 0;

    for (const r of rows) {
        const { dow, date, hhmm } = nowInTz(r.tz);
        if (r.active_dows && !r.active_dows.includes(dow)) continue;
        if (r.last_fired_on === date) continue;
        if (hhmm < r.fire_at.slice(0, 5)) continue;

        checked++;

        const sub: Subscription = {
            id: r.sub_id,
            endpoint: r.sub_endpoint,
            p256dh: r.sub_p256dh,
            auth: r.sub_auth,
        };
        const result = await sendPush(sub, {
            title: r.nombre,
            body: "Tu rutina diaria — tocá para ver los próximos arribos.",
            url: "/v2",
            tag: `daily-${r.rutina_id}`,
        });

        if (result.ok) {
            fired++;
            await query(
                `update bondi.rutinas set last_fired_on = current_date where id = $1`,
                [r.rutina_id],
            );
        } else if (result.gone) {
            goneCount++;
            await markSubscriptionGone(r.sub_id);
        }
    }

    return { checked, fired, gone: goneCount };
}
