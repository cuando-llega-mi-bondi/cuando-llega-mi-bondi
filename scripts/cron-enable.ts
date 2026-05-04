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
const baseUrl = process.env.CRON_BASE_URL ?? "http://kong:8000";
if (!url || !key) {
    console.error("[cron-enable] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run `pnpm db:start`.");
    process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
    const { error } = await supabase
        .schema("private")
        .from("cron_settings")
        .update({ base_url: baseUrl, service_role: key, enabled: true })
        .eq("id", 1);
    if (error) throw error;
    console.log(`[cron-enable] enabled with base_url=${baseUrl}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
