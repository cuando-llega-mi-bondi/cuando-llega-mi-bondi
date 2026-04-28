"use client";

import useSWR from "swr";
import type { Interseccion } from "@/lib/types";
import { swrFetcher } from "@/lib/api/client";

export function useIntersecciones(codLinea: string, codCalle: string) {
    const { data, isLoading } = useSWR(
        codLinea && codCalle
            ? ["RecuperarInterseccionPorLineaYCalle", { codLinea, codCalle }]
            : null,
        swrFetcher,
    );

    return {
        intersecciones: (data?.calles as Interseccion[] | undefined) ?? [],
        loadingInter: isLoading,
    };
}
