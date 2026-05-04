import { adminClient, type Subscription } from "../_shared/supabase.ts";
import { sendPush, markSubscriptionGone } from "../_shared/webpush.ts";
import { jsonResponse, preflight } from "../_shared/cors.ts";

type Reminder = {
    id: string;
    fire_at: string;
    tz: string;
    paradas: Array<{ paradaId: string; lineaIds: string[] }>;
    active_dows: number[] | null;
    last_fired_on: string | null;
    subscriptions: Subscription | null;
};

function todayInTz(tz: string): { dow: number; date: string; hhmm: string } {
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
    const dowMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return {
        dow: dowMap[parts.weekday] ?? 1,
        date: `${parts.year}-${parts.month}-${parts.day}`,
        hhmm: `${parts.hour}:${parts.minute}`,
    };
}

Deno.serve(async (req: Request) => {
    const pre = preflight(req);
    if (pre) return pre;
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

    const supabase = adminClient();
    const { data: reminders, error } = await supabase
        .from("daily_reminders")
        .select("id, fire_at, tz, paradas, active_dows, last_fired_on, subscriptions(id, endpoint, p256dh, auth, user_agent, disabled_at)");
    if (error) return jsonResponse({ error: error.message }, { status: 500 });

    let fired = 0;
    const goneIds: string[] = [];

    for (const r of (reminders as unknown as Reminder[])) {
        if (!r.subscriptions || r.subscriptions.disabled_at) continue;
        const { dow, date, hhmm } = todayInTz(r.tz);
        if (r.active_dows && !r.active_dows.includes(dow)) continue;
        if (r.last_fired_on === date) continue;
        if (hhmm < r.fire_at.slice(0, 5)) continue;

        const lineCount = r.paradas.reduce((acc, p) => acc + p.lineaIds.length, 0);
        const result = await sendPush(r.subscriptions, {
            title: "Tu recorrido habitual",
            body: `Resumen de ${r.paradas.length} parada(s), ${lineCount} linea(s). Tocá para ver arribos.`,
            url: "/",
            tag: `daily-${r.id}`,
        });
        if (result.ok) {
            fired++;
            await supabase.from("daily_reminders").update({ last_fired_on: date }).eq("id", r.id);
        } else if (result.gone) {
            goneIds.push(result.subscriptionId);
        }
    }

    await Promise.all(goneIds.map((id) => markSubscriptionGone(supabase, id)));

    return jsonResponse({ fired, gone: goneIds.length, total: reminders?.length ?? 0 });
});
