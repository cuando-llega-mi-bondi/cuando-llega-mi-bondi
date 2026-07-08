import { create } from "zustand";
import { withViewTransition } from "@shared/pwa/viewTransition";
import { useUIStore } from "@shared/ui/store/useUIStore";

export type Selection = {
    codLinea: string;
    codCalle: string;
    codInterseccion: string;
    paradaId: string;
    selectedRamal: string;
};

export const EMPTY_SELECTION: Selection = {
    codLinea: "",
    codCalle: "",
    codInterseccion: "",
    paradaId: "",
    selectedRamal: "TODOS",
};

interface SearchFlowState extends Selection {
    isConsulting: boolean;
    isResolving: boolean;
    error: string;

    setError: (v: string) => void;
    setIsConsulting: (v: boolean) => void;
    setIsResolving: (v: boolean) => void;

    /** Reemplaza la selección completa sin tocar isConsulting (hidratación de URL). */
    resetSelection: (partial?: Partial<Selection>) => void;
    /** Selección de línea ya validada como no-manual (el chequeo manual vive en useSearchFlow). */
    selectLinea: (v: string) => void;
    selectCalle: (v: string) => void;
    selectInterseccion: (v: string) => void;
    selectParada: (v: string) => void;
    setSelectedRamal: (v: string) => void;

    applySelection: (
        partial: Partial<Selection>,
        options?: { consulting?: boolean },
    ) => void;
    resetToParada: (
        parada: string,
        linea: string,
        options?: { consulting?: boolean },
    ) => void;
    consultar: () => void;
    /**
     * Autocompleta calle/intersección resueltas a partir de la parada.
     * Guarda contra carreras: descarta el resultado si la selección cambió
     * mientras se resolvía.
     */
    applyResolvedUbicacion: (
        codLinea: string,
        paradaId: string,
        ubi: { codCalle: string; codInterseccion: string },
    ) => void;
}

export const useSearchFlowStore = create<SearchFlowState>((set, get) => ({
    ...EMPTY_SELECTION,
    isConsulting: false,
    isResolving: false,
    error: "",

    setError: (v) => set({ error: v }),
    setIsConsulting: (v) => set({ isConsulting: v }),
    setIsResolving: (v) => set({ isResolving: v }),

    resetSelection: (partial) => set({ ...EMPTY_SELECTION, ...partial }),

    selectLinea: (v) =>
        set({ ...EMPTY_SELECTION, codLinea: v, isConsulting: false }),

    selectCalle: (v) =>
        set((s) => ({
            ...EMPTY_SELECTION,
            codLinea: s.codLinea,
            codCalle: v,
            isConsulting: false,
        })),

    selectInterseccion: (v) =>
        set((s) => ({
            ...EMPTY_SELECTION,
            codLinea: s.codLinea,
            codCalle: s.codCalle,
            codInterseccion: v,
            isConsulting: false,
        })),

    selectParada: (v) =>
        set({ paradaId: v, selectedRamal: "TODOS", isConsulting: false }),

    setSelectedRamal: (v) => set({ selectedRamal: v }),

    applySelection: (partial, options) =>
        set({
            ...partial,
            ...(options?.consulting !== undefined
                ? { isConsulting: options.consulting }
                : {}),
        }),

    resetToParada: (parada, linea, options) => {
        withViewTransition(() => {
            set({
                ...EMPTY_SELECTION,
                paradaId: parada,
                codLinea: linea,
                ...(options?.consulting ? { isConsulting: true } : {}),
            });
        });
    },

    consultar: () => {
        if (!get().paradaId) return;
        withViewTransition(() => {
            set({ isConsulting: true });
            useUIStore.getState().setSheetOpen(true);
        });
    },

    applyResolvedUbicacion: (codLinea, paradaId, ubi) =>
        set((s) => {
            if (s.codLinea !== codLinea || s.paradaId !== paradaId) return s;
            if (s.codCalle && s.codInterseccion) return s;
            return { codCalle: ubi.codCalle, codInterseccion: ubi.codInterseccion };
        }),
}));
