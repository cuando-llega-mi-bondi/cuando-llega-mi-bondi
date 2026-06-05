"use client";

import {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import {
    useSearchFlow,
    type Selection,
} from "@/app/hooks/useSearchFlow";
import type { Linea } from "@shared/types";

export type SearchFlowState = {
    codLinea: string;
    codCalle: string;
    codInterseccion: string;
    paradaId: string;
    selectedRamal: string;
    isConsulting: boolean;
    isResolving: boolean;
    error: string;
    lineaOptions: { value: string; label: string }[];
    calles: { value: string; label: string }[];
    interOptions: { value: string; label: string }[];
    destinoOptions: { value: string; label: string }[];
    ramalOptions: { value: string; label: string }[];
    loadingLineas: boolean;
    loadingCalles: boolean;
    loadingInter: boolean;
    loadingParadas: boolean;
};

export type SearchFlowActions = {
    handleLineaChange: (v: string) => void;
    handleCalleChange: (v: string) => void;
    handleInterseccionChange: (v: string) => void;
    handleParadaChange: (v: string) => void;
    handleSetSelectedRamal: (v: string) => void;
    handleConsultar: () => void;
    setError: (v: string) => void;
    setIsConsulting: (v: boolean) => void;
    applySelection: (
        partial: Partial<Selection>,
        options?: { consulting?: boolean },
    ) => void;
    resetToParada: (
        parada: string,
        linea: string,
        options?: { consulting?: boolean },
    ) => void;
};

export type SearchFlowMeta = {
    lineas: Linea[];
    lineaLabel: string;
    calleLabel: string | undefined;
    interseccionLabel: string | undefined;
    paradaBanderaAbrevs: string[];
    selectedParada: ReturnType<typeof useSearchFlow>["selectedParada"];
};

type SearchFlowContextValue = {
    state: SearchFlowState;
    actions: SearchFlowActions;
    meta: SearchFlowMeta;
};

const SearchFlowContext = createContext<SearchFlowContextValue | null>(null);

interface SearchFlowProviderProps {
    children: ReactNode;
}

export function SearchFlowProvider({
    children,
}: SearchFlowProviderProps) {
    const flow = useSearchFlow();

    const value = useMemo<SearchFlowContextValue>(
        () => ({
            state: {
                codLinea: flow.codLinea,
                codCalle: flow.codCalle,
                codInterseccion: flow.codInterseccion,
                paradaId: flow.paradaId,
                selectedRamal: flow.selectedRamal,
                isConsulting: flow.isConsulting,
                isResolving: flow.isResolving,
                error: flow.error,
                lineaOptions: flow.lineaOptions,
                calles: flow.calles,
                interOptions: flow.interOptions,
                destinoOptions: flow.destinoOptions,
                ramalOptions: flow.ramalOptions,
                loadingLineas: flow.loadingLineas,
                loadingCalles: flow.loadingCalles,
                loadingInter: flow.loadingInter,
                loadingParadas: flow.loadingParadas,
            },
            actions: {
                handleLineaChange: flow.handleLineaChange,
                handleCalleChange: flow.handleCalleChange,
                handleInterseccionChange: flow.handleInterseccionChange,
                handleParadaChange: flow.handleParadaChange,
                handleSetSelectedRamal: flow.handleSetSelectedRamal,
                handleConsultar: flow.handleConsultar,
                setError: flow.setError,
                setIsConsulting: flow.setIsConsulting,
                applySelection: flow.applySelection,
                resetToParada: flow.resetToParada,
            },
            meta: {
                lineas: flow.lineas,
                lineaLabel: flow.lineaLabel,
                calleLabel: flow.calleLabel,
                interseccionLabel: flow.interseccionLabel,
                paradaBanderaAbrevs: flow.paradaBanderaAbrevs,
                selectedParada: flow.selectedParada,
            },
        }),
        [
            flow.codLinea,
            flow.codCalle,
            flow.codInterseccion,
            flow.paradaId,
            flow.selectedRamal,
            flow.isConsulting,
            flow.isResolving,
            flow.error,
            flow.lineaOptions,
            flow.calles,
            flow.interOptions,
            flow.destinoOptions,
            flow.ramalOptions,
            flow.loadingLineas,
            flow.loadingCalles,
            flow.loadingInter,
            flow.loadingParadas,
            flow.lineas,
            flow.lineaLabel,
            flow.calleLabel,
            flow.interseccionLabel,
            flow.paradaBanderaAbrevs,
            flow.selectedParada,
            flow.handleLineaChange,
            flow.handleCalleChange,
            flow.handleInterseccionChange,
            flow.handleParadaChange,
            flow.handleSetSelectedRamal,
            flow.handleConsultar,
            flow.setError,
            flow.setIsConsulting,
            flow.applySelection,
            flow.resetToParada,
        ],
    );

    return (
        <SearchFlowContext.Provider value={value}>
            {children}
        </SearchFlowContext.Provider>
    );
}

export function useSearchFlowContext(): SearchFlowContextValue {
    const ctx = useContext(SearchFlowContext);
    if (!ctx) {
        throw new Error(
            "useSearchFlowContext must be used within SearchFlowProvider",
        );
    }
    return ctx;
}
