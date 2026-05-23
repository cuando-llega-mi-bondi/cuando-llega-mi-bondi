"use client";

import useSWR from "swr";
import type { Parada } from "@shared/types";
import { swrFetcher } from "@shared/api/client";

export function useParadas(
    codLinea: string,
    codCalle: string,
    codInterseccion: string,
) {
    const { data, isLoading } = useSWR(
        codLinea && codCalle && codInterseccion
            ? [
                  "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
                  { codLinea, codCalle, codInterseccion },
              ]
            : null,
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        },
    );

    return {
        paradas: (data?.paradas as Parada[] | undefined) ?? [],
        loadingParadas: isLoading,
    };
}
