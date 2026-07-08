"use client";

import useSWR from "swr";
import type { Interseccion } from "@shared/types";
import { swrFetcher } from "@shared/api/client";

export function useIntersecciones(codLinea: string, codCalle: string) {
    const { data, isLoading } = useSWR(
        codLinea && codCalle
            ? ["RecuperarInterseccionPorLineaYCalle", { codLinea, codCalle }]
            : null,
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        },
    );

    return {
        intersecciones: (data?.calles as Interseccion[] | undefined) ?? [],
        loadingInter: isLoading,
    };
}
