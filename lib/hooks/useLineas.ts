"use client";

import useSWR from "swr";
import type { Linea } from "@/lib/types";
import { swrFetcher } from "@/lib/api/client";
import { mergeLineasWithManual } from "@/lib/manualRoutes";
import { getCache, setCache } from "@/lib/storage/localCache";

const LINEAS_ACTION = "RecuperarLineaPorCuandoLlega";

interface UseLineasOptions {
    onError?: (message: string) => void;
}

export function useLineas(options: UseLineasOptions = {}) {
    const cachedLineas = getCache<Linea[]>(LINEAS_ACTION);

    const { data, isLoading, error } = useSWR<{ lineas?: Linea[] }, Error>(
        [LINEAS_ACTION, {}],
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            fallbackData: cachedLineas
                ? { lineas: mergeLineasWithManual(cachedLineas) }
                : undefined,
            onSuccess: (res) =>
                setCache(LINEAS_ACTION, mergeLineasWithManual(res.lineas ?? [])),
            onError: (err) =>
                options.onError?.(err?.message ?? "Error al cargar las líneas."),
        },
    );

    return {
        lineas: mergeLineasWithManual(data?.lineas ?? []),
        loadingLineas: isLoading,
        lineasError: error,
    };
}
