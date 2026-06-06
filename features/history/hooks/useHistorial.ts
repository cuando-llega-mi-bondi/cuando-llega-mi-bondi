"use client";

import { usePersistHydration } from "@shared/hooks/usePersistHydration";
import { useHistoryStore } from "../store/useHistoryStore";

export function useHistorial() {
    const hydrated = usePersistHydration(useHistoryStore);
    const historial = useHistoryStore((s) => s.historial);
    const pushHistorialEntry = useHistoryStore((s) => s.pushHistorialEntry);
    const removeHistorialEntry = useHistoryStore((s) => s.removeHistorialEntry);
    const clearHistorialEntries = useHistoryStore((s) => s.clearHistorialEntries);

    return {
        historial: hydrated ? historial : [],
        pushHistorialEntry,
        removeHistorialEntry,
        clearHistorialEntries,
    };
}
