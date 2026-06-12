"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchFlow } from "@/app/hooks/useSearchFlow";
import type { Linea } from "@shared/types";

type Option = { value: string; label: string };

/**
 * Data derivada del flujo de búsqueda (opciones SWR, labels, catálogo).
 * El estado de selección vive en useSearchFlowStore (zustand) — leelo de ahí
 * con selectores; este context solo expone lo que depende de los fetches.
 */
export type SearchFlowData = {
    lineas: Linea[];
    lineaOptions: Option[];
    calles: Option[];
    interOptions: Option[];
    destinoOptions: Option[];
    ramalOptions: Option[];
    paradaBanderaAbrevs: string[];
    selectedParada: ReturnType<typeof useSearchFlow>["selectedParada"];
    calleLabel: string | undefined;
    interseccionLabel: string | undefined;
    lineaLabel: string;
    loadingLineas: boolean;
    loadingCalles: boolean;
    loadingInter: boolean;
    loadingParadas: boolean;
    handleLineaChange: (v: string) => void;
};

const SearchFlowContext = createContext<SearchFlowData | null>(null);

interface SearchFlowProviderProps {
    children: ReactNode;
}

export function SearchFlowProvider({ children }: SearchFlowProviderProps) {
    const flow = useSearchFlow();

    const value = useMemo<SearchFlowData>(
        () => ({
            lineas: flow.lineas,
            lineaOptions: flow.lineaOptions,
            calles: flow.calles,
            interOptions: flow.interOptions,
            destinoOptions: flow.destinoOptions,
            ramalOptions: flow.ramalOptions,
            paradaBanderaAbrevs: flow.paradaBanderaAbrevs,
            selectedParada: flow.selectedParada,
            calleLabel: flow.calleLabel,
            interseccionLabel: flow.interseccionLabel,
            lineaLabel: flow.lineaLabel,
            loadingLineas: flow.loadingLineas,
            loadingCalles: flow.loadingCalles,
            loadingInter: flow.loadingInter,
            loadingParadas: flow.loadingParadas,
            handleLineaChange: flow.handleLineaChange,
        }),
        [
            flow.lineas,
            flow.lineaOptions,
            flow.calles,
            flow.interOptions,
            flow.destinoOptions,
            flow.ramalOptions,
            flow.paradaBanderaAbrevs,
            flow.selectedParada,
            flow.calleLabel,
            flow.interseccionLabel,
            flow.lineaLabel,
            flow.loadingLineas,
            flow.loadingCalles,
            flow.loadingInter,
            flow.loadingParadas,
            flow.handleLineaChange,
        ],
    );

    return (
        <SearchFlowContext.Provider value={value}>
            {children}
        </SearchFlowContext.Provider>
    );
}

export function useSearchFlowData(): SearchFlowData {
    const ctx = useContext(SearchFlowContext);
    if (!ctx) {
        throw new Error(
            "useSearchFlowData must be used within SearchFlowProvider",
        );
    }
    return ctx;
}
