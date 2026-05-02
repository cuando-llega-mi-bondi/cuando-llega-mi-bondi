"use client";

import { useMemo } from "react";
import useSWR from "swr";
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
    const lineasFingerprint = useMemo(
        () =>
            lineas
                .map((l) => `${l.CodigoLineaParada}:${l.isManual ? 1 : 0}`)
                .sort()
                .join(","),
        [lineas],
    );

    const shouldLookup =
        isConsulting &&
        Boolean(codLinea) &&
        Boolean(codCalle) &&
        Boolean(codInterseccion) &&
        lineas.length > 0 &&
        Boolean(calleLabel) &&
        Boolean(interseccionLabel);

    const swrKey = shouldLookup
        ? ([
              "otrasLineasEnInterseccion",
              codLinea,
              codCalle,
              codInterseccion,
              calleLabel,
              interseccionLabel,
              lineasFingerprint,
          ] as const)
        : null;

    const { data, isLoading } = useSWR(
        swrKey,
        ([, codLineaArg, , , calleLb, interLb]) =>
            findLineasEnInterseccion(
                calleLb as string,
                interLb as string,
                codLineaArg,
                lineas,
            ),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        },
    );

    return {
        otrasLineas: shouldLookup ? (data ?? []) : [],
        loadingOtras: shouldLookup ? isLoading : false,
    };
}
