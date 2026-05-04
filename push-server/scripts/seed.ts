import { sql } from "../src/db/client";

const DEMO_MARKER = "seed-demo";

type DemoSub = { label: string; endpoint: string; p256dh: string; auth: string };

const demoSubs: DemoSub[] = [
    {
        label: "laptop",
        endpoint: "https://fcm.googleapis.com/fcm/send/seed-demo-laptop",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        auth: "tBHItJI5svbpez7KI4CCXg",
    },
    {
        label: "firefox",
        endpoint: "https://updates.push.services.mozilla.com/wpush/v2/seed-demo-firefox",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkN",
        auth: "tBHItJI5svbpez7KI4CCXh",
    },
    {
        label: "iphone",
        endpoint: "https://web.push.apple.com/seed-demo-iphone",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkO",
        auth: "tBHItJI5svbpez7KI4CCXi",
    },
];

async function main() {
    console.log("[seed] clearing previous demo rows…");
    await sql`delete from service_alerts where sent_by = 'seed'`;
    await sql`delete from subscriptions where user_agent = ${DEMO_MARKER}`;

    console.log("[seed] inserting subscriptions…");
    const subIds: Record<string, string> = {};
    for (const s of demoSubs) {
        const [row] = await sql<{ id: string }[]>`
            insert into subscriptions (endpoint, p256dh, auth, user_agent)
            values (${s.endpoint}, ${s.p256dh}, ${s.auth}, ${DEMO_MARKER})
            returning id
        `;
        subIds[s.label] = row.id;
    }

    console.log("[seed] inserting arrival_watches…");
    // Linea 541 (CodigoLineaParada=107), parada P1936 (Codigo=16323) tomada del HAR.
    // laptop: 7-9am Lun-Vie, threshold 5min — flujo "voy al laburo".
    // firefox: sin ventana, threshold 10min — siempre activo.
    // iphone: 17-19pm Lun-Vie, otra linea (100 = 501).
    await sql`
        insert into arrival_watches
            (subscription_id, parada_id, linea_id, threshold_min, active_from, active_to, active_dows, cooldown_min)
        values
            (${subIds.laptop},  '16323', '107',  5, '07:00', '09:00', '{1,2,3,4,5}', 30),
            (${subIds.firefox}, '16323', '107', 10, null,    null,    null,           60),
            (${subIds.iphone},  '16323', '100',  5, '17:00', '19:00', '{1,2,3,4,5}', 30)
    `;

    console.log("[seed] inserting service_alert_subs…");
    await sql`
        insert into service_alert_subs (subscription_id, linea_id) values
            (${subIds.laptop},  '107'),
            (${subIds.laptop},  '100'),
            (${subIds.firefox}, '107'),
            (${subIds.iphone},  '100')
    `;

    console.log("[seed] inserting daily_reminders…");
    const reminderParadas = JSON.stringify([{ paradaId: "16323", lineaIds: ["107", "100"] }]);
    await sql`
        insert into daily_reminders (subscription_id, fire_at, paradas, active_dows)
        values (${subIds.laptop}, '07:30', ${reminderParadas}::jsonb, '{1,2,3,4,5}')
    `;

    console.log("[seed] inserting historical service_alerts…");
    await sql`
        insert into service_alerts (linea_id, title, body, sent_by) values
            ('107', 'Demora linea 541', 'La linea 541 presenta demoras por congestion en Av. Luro.', 'seed'),
            (null,  'Mantenimiento programado', 'Servicio reducido el domingo de 0 a 6hs por mantenimiento del sistema.', 'seed')
    `;

    const counts = await sql<{ t: string; n: bigint }[]>`
        select 'subscriptions'::text as t, count(*)::bigint as n from subscriptions where user_agent = ${DEMO_MARKER}
        union all select 'arrival_watches', count(*)::bigint from arrival_watches
            where subscription_id in (select id from subscriptions where user_agent = ${DEMO_MARKER})
        union all select 'service_alert_subs', count(*)::bigint from service_alert_subs
            where subscription_id in (select id from subscriptions where user_agent = ${DEMO_MARKER})
        union all select 'daily_reminders', count(*)::bigint from daily_reminders
            where subscription_id in (select id from subscriptions where user_agent = ${DEMO_MARKER})
        union all select 'service_alerts (historical)', count(*)::bigint from service_alerts where sent_by = 'seed'
    `;

    console.log("[seed] done:");
    for (const row of counts) console.log(`  ${row.t}: ${row.n}`);

    await sql.end();
}

main().catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
});
