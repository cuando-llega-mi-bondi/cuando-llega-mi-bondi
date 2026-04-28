import type { HistorialEntry } from "@/lib/types";

const HIST_KEY = "cuandollega_historial";
const HIST_MAX = 10;

export function getHistorial(): HistorialEntry[] {
    if (typeof window === "undefined") return [];

    try {
        return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]");
    } catch {
        return [];
    }
}

export function pushHistorial(entry: HistorialEntry): void {
    const prev = getHistorial().filter((h) => h.id !== entry.id);
    const next = [entry, ...prev].slice(0, HIST_MAX);
    localStorage.setItem(HIST_KEY, JSON.stringify(next));
}

export function removeHistorialEntry(id: string): void {
    localStorage.setItem(
        HIST_KEY,
        JSON.stringify(getHistorial().filter((h) => h.id !== id)),
    );
}

export function clearHistorial(): void {
    localStorage.removeItem(HIST_KEY);
}
