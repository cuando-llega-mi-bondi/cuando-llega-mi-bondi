import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function loadLocalSupabaseEnv() {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    let out = "";
    try {
        out = execSync("pnpm exec supabase status -o env", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
        return;
    }
    for (const line of out.split("\n")) {
        const m = line.match(/^([A-Z_0-9]+)="?([^"]*)"?$/);
        if (!m) continue;
        const [, k, v] = m;
        if (k === "API_URL" && !process.env.SUPABASE_URL) process.env.SUPABASE_URL = v;
        if (k === "SERVICE_ROLE_KEY" && !process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = v;
    }
}

loadLocalSupabaseEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error("[seed] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run `pnpm db:start` first or export them.");
    process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const DEMO = "seed-demo";

const subs = [
    {
        label: "laptop",
        endpoint: "https://fcm.googleapis.com/fcm/send/seed-laptop",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        auth: "tBHItJI5svbpez7KI4CCXg",
    },
    {
        label: "firefox",
        endpoint: "https://updates.push.services.mozilla.com/wpush/v2/seed-firefox",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkN",
        auth: "tBHItJI5svbpez7KI4CCXh",
    },
    {
        label: "iphone",
        endpoint: "https://web.push.apple.com/seed-iphone",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkO",
        auth: "tBHItJI5svbpez7KI4CCXi",
    },
];

async function main() {
    console.log("[seed] clearing previous demo rows…");
    await supabase.from("service_alerts").delete().eq("sent_by", "seed");
    await supabase.from("subscriptions").delete().eq("user_agent", DEMO);

    console.log("[seed] inserting subscriptions…");
    const subIds: Record<string, string> = {};
    for (const s of subs) {
        const { data, error } = await supabase
            .from("subscriptions")
            .insert({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth, user_agent: DEMO })
            .select("id")
            .single();
        if (error) throw error;
        subIds[s.label] = data.id;
    }

    console.log("[seed] inserting arrival_watches…");
    const { error: e1 } = await supabase.from("arrival_watches").insert([
        { subscription_id: subIds.laptop,  parada_id: "16323", linea_id: "107", threshold_min: 5,  active_from: "07:00", active_to: "09:00", active_dows: [1, 2, 3, 4, 5], cooldown_min: 30 },
        { subscription_id: subIds.firefox, parada_id: "16323", linea_id: "107", threshold_min: 10, cooldown_min: 60 },
        { subscription_id: subIds.iphone,  parada_id: "16323", linea_id: "100", threshold_min: 5,  active_from: "17:00", active_to: "19:00", active_dows: [1, 2, 3, 4, 5], cooldown_min: 30 },
    ]);
    if (e1) throw e1;

    console.log("[seed] inserting service_alert_subs…");
    const { error: e2 } = await supabase.from("service_alert_subs").insert([
        { subscription_id: subIds.laptop,  linea_id: "107" },
        { subscription_id: subIds.laptop,  linea_id: "100" },
        { subscription_id: subIds.firefox, linea_id: "107" },
        { subscription_id: subIds.iphone,  linea_id: "100" },
    ]);
    if (e2) throw e2;

    console.log("[seed] inserting daily_reminders…");
    const { error: e3 } = await supabase.from("daily_reminders").insert([
        {
            subscription_id: subIds.laptop,
            fire_at: "07:30",
            paradas: [{ paradaId: "16323", lineaIds: ["107", "100"] }],
            active_dows: [1, 2, 3, 4, 5],
        },
    ]);
    if (e3) throw e3;

    console.log("[seed] inserting historical service_alerts…");
    const { error: e4 } = await supabase.from("service_alerts").insert([
        { linea_id: "107", title: "Demora linea 541", body: "La linea 541 presenta demoras por congestion en Av. Luro.", sent_by: "seed" },
        { linea_id: null,  title: "Mantenimiento programado", body: "Servicio reducido el domingo de 0 a 6hs por mantenimiento del sistema.", sent_by: "seed" },
    ]);
    if (e4) throw e4;

    console.log("[seed] done. URL:", url);
}

main().catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
});
