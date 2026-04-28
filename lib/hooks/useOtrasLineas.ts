"use client";

import { useEffect, useState } from "react";
import { findLineasEnInterseccion } from "@/lib/api/otrasLineas";
import type { Linea } from "@/lib/types";

interface UseOtrasLineasParams {
    isConsulting: boolean;
    codLinea: string;
    codCalle: string;
    codInterseccion: string;
    lineas: Linea[];
    calleLabel?: string;
    interseccionLabel?: string;
}

export function useOtrasLineas({
    isConsulting,
    codLinea,
    codCalle,
    codInterseccion,
    lineas,
    calleLabel,
    interseccionLabel,
}: UseOtrasLineasParams) {
    const [otrasLineas, setOtrasLineas] = useState<Linea[]>([]);
    const [loadingOtras, setLoadingOtras] = useState(false);
    const shouldLookup =
        isConsulting &&
        Boolean(codLinea) &&
        Boolean(codCalle) &&
        Boolean(codInterseccion) &&
        lineas.length > 0 &&
        Boolean(calleLabel) &&
        Boolean(interseccionLabel);

    useEffect(() => {
        if (!shouldLookup || !calleLabel || !interseccionLabel) {
            return;
        }

        let active = true;
        Promise.resolve().then(() => {
            if (active) setLoadingOtras(true);
        });

        findLineasEnInterseccion(
            calleLabel,
            interseccionLabel,
            codLinea,
            lineas,
        )
            .then((res) => {
                if (!active) return;
                setOtrasLineas(res);
                setLoadingOtras(false);
            })
            .catch(() => {
                if (!active) return;
                setLoadingOtras(false);
            });

        return () => {
            active = false;
        };
    }, [
        shouldLookup,
        calleLabel,
        interseccionLabel,
        codLinea,
        lineas,
    ]);

    return {
        otrasLineas: shouldLookup ? otrasLineas : [],
        loadingOtras: shouldLookup ? loadingOtras : false,
    };
}
