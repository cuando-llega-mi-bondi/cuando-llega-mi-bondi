"use client";

import { useEffect, useState } from "react";
import { useHistoryStore } from "../store/useHistoryStore";

export function useHistorial() {
    const store = useHistoryStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsHydrated(true);
    }, []);

    return {
        historial: isHydrated ? store.historial : [],
        pushHistorialEntry: store.pushHistorialEntry,
        removeHistorialEntry: store.removeHistorialEntry,
        clearHistorialEntries: store.clearHistorialEntries,
    };
}
