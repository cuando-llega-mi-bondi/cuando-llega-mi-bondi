"use client";

import { createContext, useContext } from "react";
import type { ArrivalsOverlaySession } from "@features/arrivals/types/arrivalsSession";

export interface ArrivalsSessionValue {
    session: ArrivalsOverlaySession;
    /** Cierra la consulta activa (sheetOpen=false + isConsulting=false). */
    closeConsult: () => void;
}

const ArrivalsSessionContext = createContext<ArrivalsSessionValue | null>(null);

export const ArrivalsSessionProvider = ArrivalsSessionContext.Provider;

/** Sesión de arribos armada por MainLayoutClient (misma que consume ArrivalsOverlay). */
export function useArrivalsSession(): ArrivalsSessionValue {
    const ctx = useContext(ArrivalsSessionContext);
    if (!ctx) {
        throw new Error("useArrivalsSession debe usarse dentro de MainLayoutClient");
    }
    return ctx;
}
