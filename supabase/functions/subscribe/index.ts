import { adminClient } from "../_shared/supabase.ts";
import { jsonResponse, preflight, cors } from "../_shared/cors.ts";

type SubscribeBody = {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    userAgent?: string;
};

Deno.serve(async (req: Request) => {
    const pre = preflight(req);
    if (pre) return pre;

    const supabase = adminClient();

    if (req.method === "POST") {
        const body = (await req.json().catch(() => null)) as SubscribeBody | null;
        if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
            return jsonResponse({ error: "Missing endpoint or keys" }, { status: 400 });
        }
        const { data, error } = await supabase
            .from("subscriptions")
            .upsert(
                {
                    endpoint: body.endpoint,
                    p256dh: body.keys.p256dh,
                    auth: body.keys.auth,
                    user_agent: body.userAgent ?? null,
                    last_seen_at: new Date().toISOString(),
                    disabled_at: null,
                },
                { onConflict: "endpoint" },
            )
            .select("id")
            .single();
        if (error) return jsonResponse({ error: error.message }, { status: 500 });
        return jsonResponse({ id: data.id });
    }

    if (req.method === "DELETE") {
        const endpoint = new URL(req.url).searchParams.get("endpoint");
        if (!endpoint) return jsonResponse({ error: "endpoint query param required" }, { status: 400 });
        const { error } = await supabase.from("subscriptions").delete().eq("endpoint", endpoint);
        if (error) return jsonResponse({ error: error.message }, { status: 500 });
        return new Response(null, { status: 204, headers: cors });
    }

    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
});
