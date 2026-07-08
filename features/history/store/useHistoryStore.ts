import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistorialEntry } from "@features/history/types";

interface HistoryState {
    historial: HistorialEntry[];
    pushHistorialEntry: (entry: HistorialEntry) => void;
    removeHistorialEntry: (id: string) => void;
    clearHistorialEntries: () => void;
}

const HIST_MAX = 10;

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set, get) => ({
            historial: [],
            pushHistorialEntry: (entry) => {
                const prev = get().historial.filter((h) => h.id !== entry.id);
                const next = [entry, ...prev].slice(0, HIST_MAX);
                set({ historial: next });
            },
            removeHistorialEntry: (id) => {
                set((state) => ({
                    historial: state.historial.filter((h) => h.id !== id),
                }));
            },
            clearHistorialEntries: () => {
                set({ historial: [] });
            },
        }),
        {
            name: "cuandollega_historial",
        }
    )
);
