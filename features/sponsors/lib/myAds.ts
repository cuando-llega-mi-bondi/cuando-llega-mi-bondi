const STORAGE_KEY = "bondi:mis-avisos";
const MAX_REMEMBERED = 20;

/** Recuerda en este navegador qué compras hizo, para poder "potenciar" sin recargar los datos. */
export function rememberAdPurchaseId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getRememberedAdPurchaseIds().filter((existing) => existing !== id);
    ids.unshift(id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_REMEMBERED)));
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.): no es crítico, se ignora.
  }
}

export function getRememberedAdPurchaseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}
