/**
 * Cliente de web-push para registrar el service worker, suscribirse y mandar
 * la subscription al backend.
 */

import { apiFetch } from "./client";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC;

export type PushSupport =
    | { ok: true }
    | { ok: false; reason: "no_browser" | "no_sw" | "no_push" | "no_vapid" };

export function checkSupport(): PushSupport {
    if (typeof window === "undefined") return { ok: false, reason: "no_browser" };
    if (!("serviceWorker" in navigator)) return { ok: false, reason: "no_sw" };
    if (!("PushManager" in window)) return { ok: false, reason: "no_push" };
    if (!VAPID_PUBLIC) return { ok: false, reason: "no_vapid" };
    return { ok: true };
}

export async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
    const reg = (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    return reg;
}

export async function getSubscriptionStatus(): Promise<{
    permission: NotificationPermission;
    subscribed: boolean;
}> {
    const support = checkSupport();
    if (!support.ok) return { permission: "default", subscribed: false };
    const reg = await ensureRegistration();
    const sub = await reg.pushManager.getSubscription();
    return {
        permission: Notification.permission,
        subscribed: sub !== null,
    };
}

export async function subscribe(): Promise<void> {
    const support = checkSupport();
    if (!support.ok) throw new Error(`push_unsupported:${support.reason}`);
    if (!VAPID_PUBLIC) throw new Error("no_vapid");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("permission_denied");

    const reg = await ensureRegistration();
    const existing = await reg.pushManager.getSubscription();
    const sub =
        existing ??
        (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
        }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("subscription_incomplete");
    }
    await apiFetch("/subscribe", {
        method: "POST",
        json: {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            user_agent: navigator.userAgent,
        },
    });
}

export async function unsubscribe(): Promise<void> {
    const support = checkSupport();
    if (!support.ok) return;
    const reg = await ensureRegistration();
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await apiFetch(`/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        method: "DELETE",
    }).catch(() => undefined);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
    return out;
}
