import webpush from "web-push";
import { env } from "../env.js";
import { query } from "../db.js";

webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC, env.VAPID_PRIVATE);

export type Subscription = {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
};

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
    try {
        await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
        );
        return { ok: true, subscriptionId: sub.id };
    } catch (err) {
        const e = err as { statusCode?: number; body?: string; message?: string };
        const status = e.statusCode ?? 0;
        return {
            ok: false,
            subscriptionId: sub.id,
            status,
            gone: status === 404 || status === 410,
            error: e.message ?? e.body ?? "unknown",
        };
    }
}

export async function markSubscriptionGone(id: string): Promise<void> {
    await query(
        `update bondi.subscriptions set disabled_at = now() where id = $1`,
        [id],
    );
}
