/** Listing público de Bondi MDP en Google Play. */
export const PLAY_STORE_URL =
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
    "https://play.google.com/store/apps/details?id=com.bondimdp.app&pcampaignid=web_share";

export const PLAY_STORE_PACKAGE = "com.bondimdp.app";

/** Modal one-shot: vuelve a aparecer después de N días. */
export const PLAY_STORE_MODAL_SNOOZE_KEY = "bondi:play-store-modal-snooze-until";
/** Banner sticky: snooze corto al cerrar. */
export const PLAY_STORE_BANNER_SNOOZE_KEY = "bondi:play-store-banner-snooze-until";

const LEGACY_DISMISS_KEY = "bondi:play-store-promo-v1";

const DAY_MS = 86_400_000;

/** Android Chrome/Firefox/etc. Excluye WebViews (app nativa ya instalada). */
export function isAndroidBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    if (!/Android/i.test(ua)) return false;
    if (/; wv\)/i.test(ua)) return false;
    return true;
}

export function isSnoozed(key: string): boolean {
    try {
        const until = Number(window.localStorage.getItem(key));
        return Number.isFinite(until) && Date.now() < until;
    } catch {
        return false;
    }
}

export function snooze(key: string, days: number): void {
    try {
        window.localStorage.setItem(key, String(Date.now() + days * DAY_MS));
    } catch {
        // modo privado / cuota
    }
}

/** Quienes cerraron el modal “para siempre” (v1) no vuelven a ver el modal ya; sí el banner/chip. */
export function migrateLegacyPlayStoreDismiss(): void {
    try {
        if (window.localStorage.getItem(LEGACY_DISMISS_KEY) !== "1") return;
        window.localStorage.removeItem(LEGACY_DISMISS_KEY);
        if (!isSnoozed(PLAY_STORE_MODAL_SNOOZE_KEY)) {
            snooze(PLAY_STORE_MODAL_SNOOZE_KEY, 14);
        }
    } catch {
        // ignore
    }
}
