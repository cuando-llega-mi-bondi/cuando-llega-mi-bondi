import { adminClient, type Subscription } from "../_shared/supabase.ts";
import { sendPush, markSubscriptionGone } from "../_shared/webpush.ts";
import { jsonResponse, preflight } from "../_shared/cors.ts";

const MGP_PROXY = Deno.env.get("MGP_PROXY_URL") ?? "https://cuandollegamibondi.com/api/cuando";

type Watch = {
    id: string;
    parada_id: string;
    linea_id: string;
    threshold_min: number;
    cooldown_min: number;
    active_from: string | null;
    active_to: string | null;
    active_dows: number[] | null;
    last_fired_at: string | null;
    subscriptions: Subscription | null;
};

type Arribo = { Arribo?: string; DescripcionLinea?: string; DescripcionBandera?: string };

function parseEtaMin(s: string | undefined): number | null {
    if (!s) return null;
    const m = s.match(/(\d+)/);
    return m ? Number(m[1]) : null;
}

function isWindowActive(w: Watch, now: Date, tz: string): boolean {
    const dow = ((now.getDay() + 6) % 7) + 1; // ISO 1=Mon..7=Sun
    if (w.active_dows && !w.active_dows.includes(dow)) return false;
    if (!w.active_from || !w.active_to) return true;
    const hhmm = now.toLocaleTimeString("en-GB", { hour12: false, timeZone: tz }).slice(0, 5);
    return hhmm >= w.active_from.slice(0, 5) && hhmm <= w.active_to.slice(0, 5);
}

function cooldownElapsed(w: Watch, now: Date): boolean {
    if (!w.last_fired_at) return true;
    const last = new Date(w.last_fired_at).getTime();
    return now.getTime() - last >= w.cooldown_min * 60_000;
}

async function fetchEta(paradaId: string, lineaId: string): Promise<number | null> {
    const body = new URLSearchParams({
        accion: "RecuperarProximosArribosW",
        codigoParada: paradaId,
        codigoLineaParada: lineaId,
    }).toString();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    try {
        const r = await fetch(MGP_PROXY, {
            method: "POST",
            body,
            headers: { "content-type": "application/x-www-form-urlencoded" },
            signal: ctrl.signal,
        });
        if (!r.ok) return null;
        const j = await r.json().catch(() => null) as { arribos?: Arribo[] } | null;
        if (!j?.arribos?.length) return null;
        const etas = j.arribos.map((a) => parseEtaMin(a.Arribo)).filter((x): x is number => x !== null);
        return etas.length ? Math.min(...etas) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(tid);
    }
}

Deno.serve(async (req: Request) => {
    const pre = preflight(req);
    if (pre) return pre;
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

    const supabase = adminClient();
    const { data: watches, error } = await supabase
        .from("arrival_watches")
        .select("id, parada_id, linea_id, threshold_min, cooldown_min, active_from, active_to, active_dows, last_fired_at, subscriptions(id, endpoint, p256dh, auth, user_agent, disabled_at)");
    if (error) return jsonResponse({ error: error.message }, { status: 500 });

    const now = new Date();
    const tz = "America/Argentina/Buenos_Aires";
    const candidates = (watches as unknown as Watch[]).filter(
        (w) => w.subscriptions && !w.subscriptions.disabled_at && isWindowActive(w, now, tz) && cooldownElapsed(w, now),
    );

    let fired = 0;
    let skipped = 0;
    const goneIds: string[] = [];

    for (const w of candidates) {
        const eta = await fetchEta(w.parada_id, w.linea_id);
        if (eta === null || eta > w.threshold_min) {
            skipped++;
            continue;
        }
        const result = await sendPush(w.subscriptions!, {
            title: `Linea ${w.linea_id} en ${eta} min`,
            body: `Tu bondi llega en ~${eta} min a la parada.`,
            tag: `arrival-${w.parada_id}-${w.linea_id}`,
        });
        if (result.ok) {
            fired++;
            await supabase.from("arrival_watches").update({ last_fired_at: now.toISOString() }).eq("id", w.id);
        } else if (result.gone) {
            goneIds.push(result.subscriptionId);
        }
    }

    await Promise.all(goneIds.map((id) => markSubscriptionGone(supabase, id)));

    return jsonResponse({ checked: candidates.length, fired, skipped, gone: goneIds.length, total: watches?.length ?? 0 });
});
