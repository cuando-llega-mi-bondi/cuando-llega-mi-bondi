const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

function cacheKey(action: string, params: Record<string, string> = {}): string {
    const suffix = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

    return `cuandollega_cache__${action}${suffix ? `__${suffix}` : ""}`;
}

export function getCache<T>(action: string, params?: Record<string, string>): T | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(cacheKey(action, params));
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(cacheKey(action, params));
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

export function setCache<T>(action: string, data: T, params?: Record<string, string>): void {
    if (typeof window === "undefined") return;

    try {
        const entry: CacheEntry<T> = { data, expiresAt: Date.now() + TTL_MS };
        localStorage.setItem(cacheKey(action, params), JSON.stringify(entry));
    } catch {
        // localStorage quota can fail in private mode.
    }
}

export function clearCache(action: string, params?: Record<string, string>): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(cacheKey(action, params));
}
