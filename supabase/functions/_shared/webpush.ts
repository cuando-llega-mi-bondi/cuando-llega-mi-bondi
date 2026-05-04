import webpush from "npm:web-push@3.6.7";
import type { Subscription } from "./supabase.ts";

let configured = false;

function configure() {
    if (configured) return;
    webpush.setVapidDetails(
        Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
        Deno.env.get("VAPID_PUBLIC")!,
        Deno.env.get("VAPID_PRIVATE")!,
    );
    configured = true;
}

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
};

export type SendResult =
    | { ok: true; subscriptionId: string }
    | { ok: false; subscriptionId: string; status: number; gone: boolean; error: string };

export async function sendPush(sub: Subscription, payload: PushPayload): Promise<SendResult> {
    configure();
    try {
        await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
        );
        return { ok: true, subscriptionId: sub.id };
    } catch (err: unknown) {
        const e = err as { statusCode?: number; body?: string; message?: string };
        const status = e.statusCode ?? 0;
        const gone = status === 404 || status === 410;
        return {
            ok: false,
            subscriptionId: sub.id,
            status,
            gone,
            error: e.body || e.message || "unknown push error",
        };
    }
}

export async function markSubscriptionGone(supabase: ReturnType<typeof import("./supabase.ts").adminClient>, subscriptionId: string) {
    await supabase
        .from("subscriptions")
        .update({ disabled_at: new Date().toISOString() })
        .eq("id", subscriptionId);
}
