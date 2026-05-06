/**
 * Worker standalone: corre los jobs de scheduler con node-cron.
 * Se levanta con `pnpm --filter bondi-server scheduler` (o desde server/, `pnpm scheduler`).
 *
 * Si la PC está apagada, no se mandan pushes. Self-hosted by design.
 */
import cron from "node-cron";
import { runArrivalJob } from "./arrival.js";
import { runDailyJob } from "./daily.js";

let arrivalRunning = false;
let dailyRunning = false;

cron.schedule("* * * * *", async () => {
    if (arrivalRunning) {
        console.warn("[arrival] anterior aún corriendo; salteando tick");
        return;
    }
    arrivalRunning = true;
    const t0 = Date.now();
    try {
        const r = await runArrivalJob();
        console.log(
            `[arrival] checked=${r.checked} fired=${r.fired} gone=${r.gone} t=${Date.now() - t0}ms`,
        );
    } catch (e) {
        console.error("[arrival] error", e);
    } finally {
        arrivalRunning = false;
    }
});

cron.schedule("*/5 * * * *", async () => {
    if (dailyRunning) {
        console.warn("[daily] anterior aún corriendo; salteando tick");
        return;
    }
    dailyRunning = true;
    const t0 = Date.now();
    try {
        const r = await runDailyJob();
        console.log(
            `[daily] checked=${r.checked} fired=${r.fired} gone=${r.gone} t=${Date.now() - t0}ms`,
        );
    } catch (e) {
        console.error("[daily] error", e);
    } finally {
        dailyRunning = false;
    }
});

console.log("[scheduler] listo — arrival cada 1m, daily cada 5m");

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
