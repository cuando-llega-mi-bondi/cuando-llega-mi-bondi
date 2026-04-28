"use client";

import { useCallback, useState } from "react";
import type { HistorialEntry } from "@/lib/types";
import {
    clearHistorial,
    getHistorial,
    pushHistorial,
    removeHistorialEntry,
} from "@/lib/storage/historial";

export function useHistorial() {
    const [historial, setHistorial] = useState<HistorialEntry[]>(() =>
        getHistorial(),
    );

    const refresh = useCallback(() => {
        setHistorial(getHistorial());
    }, []);

    const push = useCallback(
        (entry: HistorialEntry) => {
            pushHistorial(entry);
            refresh();
        },
        [refresh],
    );

    const remove = useCallback(
        (id: string) => {
            removeHistorialEntry(id);
            refresh();
        },
        [refresh],
    );

    const clear = useCallback(() => {
        clearHistorial();
        setHistorial([]);
    }, []);

    return {
        historial,
        refreshHistorial: refresh,
        pushHistorialEntry: push,
        removeHistorialEntry: remove,
        clearHistorialEntries: clear,
    };
}
