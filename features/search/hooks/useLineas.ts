"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { Linea } from "@shared/types";
import { swrFetcher } from "@shared/api/client";
import { mergeLineasWithManual } from "@features/route/manualRoutes";
import { getCache, setCache } from "@shared/storage/localCache";

const LINEAS_ACTION = "RecuperarLineaPorCuandoLlega";

interface UseLineasOptions {
    onError?: (message: string) => void;
}

export function useLineas(options: UseLineasOptions = {}) {
    const { data, isLoading, error, mutate } = useSWR<{ lineas?: Linea[] }, Error>(
        [LINEAS_ACTION, {}],
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            onSuccess: (res) =>
                setCache(LINEAS_ACTION, mergeLineasWithManual(res.lineas ?? [])),
            onError: (err) =>
                options.onError?.(err?.message ?? "Error al cargar las líneas."),
        },
    );

    useEffect(() => {
        const cachedLineas = getCache<Linea[]>(LINEAS_ACTION);
        if (cachedLineas) {
            void mutate(
                { lineas: mergeLineasWithManual(cachedLineas) },
                { revalidate: false },
            );
        }
    }, [mutate]);

    return {
        lineas: mergeLineasWithManual(data?.lineas ?? []),
        loadingLineas: isLoading,
        lineasError: error,
    };
}
