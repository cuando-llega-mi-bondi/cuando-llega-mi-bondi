import { adminClient, type Subscription } from "../_shared/supabase.ts";
import { sendPush, markSubscriptionGone } from "../_shared/webpush.ts";
import { jsonResponse, preflight } from "../_shared/cors.ts";

type AlertBody = {
    lineaId?: string | null;
    title?: string;
    body?: string;
    url?: string;
};

Deno.serve(async (req: Request) => {
    const pre = preflight(req);
    if (pre) return pre;
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

    const adminToken = Deno.env.get("ADMIN_TOKEN");
    const auth = req.headers.get("authorization") ?? "";
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
        return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as AlertBody | null;
    if (!body?.title || !body.body) {
        return jsonResponse({ error: "title and body required" }, { status: 400 });
    }
    const lineaId = body.lineaId ?? null;

    const supabase = adminClient();

    // Pick subscriptions: filtered by lineaId if present, else all active subs.
    let subs: Subscription[] = [];
    if (lineaId) {
        const { data, error } = await supabase
            .from("service_alert_subs")
            .select("subscriptions(id, endpoint, p256dh, auth, user_agent, disabled_at)")
            .eq("linea_id", lineaId);
        if (error) return jsonResponse({ error: error.message }, { status: 500 });
        subs = (data ?? [])
            .map((row: { subscriptions: Subscription | null }) => row.subscriptions)
            .filter((s): s is Subscription => !!s && !s.disabled_at);
    } else {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("id, endpoint, p256dh, auth, user_agent, disabled_at")
            .is("disabled_at", null);
        if (error) return jsonResponse({ error: error.message }, { status: 500 });
        subs = data ?? [];
    }

    const results = await Promise.all(
        subs.map((s) => sendPush(s, { title: body.title!, body: body.body!, url: body.url, tag: `alert-${lineaId ?? "global"}` })),
    );

    const goneIds = results.filter((r) => !r.ok && r.gone).map((r) => r.subscriptionId);
    await Promise.all(goneIds.map((id) => markSubscriptionGone(supabase, id)));

    await supabase.from("service_alerts").insert({
        linea_id: lineaId,
        title: body.title,
        body: body.body,
        url: body.url ?? null,
        sent_by: "admin",
    });

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok && !r.gone).length;
    return jsonResponse({ sent, failed, gone: goneIds.length, total: results.length });
});
