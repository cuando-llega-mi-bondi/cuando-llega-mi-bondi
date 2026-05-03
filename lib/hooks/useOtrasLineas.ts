"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { findOtrasLineasEnParada } from "@/lib/api/otrasLineas";
import type { Linea } from "@/lib/types";

interface UseOtrasLineasParams {
    isConsulting: boolean;
    paradaId: string;
    codLinea: string;
    lineas: Linea[];
}

export function useOtrasLineas({
    isConsulting,
    paradaId,
    codLinea,
    lineas,
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
        Boolean(paradaId) &&
        Boolean(codLinea) &&
        lineas.length > 0;

    const swrKey = shouldLookup
        ? ([
              "otrasLineasPorParada",
              paradaId,
              codLinea,
              lineasFingerprint,
          ] as const)
        : null;

    const { data, isLoading } = useSWR(
        swrKey,
        ([, parada, codLineaArg]) =>
            findOtrasLineasEnParada(
                parada as string,
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
