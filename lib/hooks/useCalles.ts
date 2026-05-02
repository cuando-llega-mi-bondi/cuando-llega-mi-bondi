"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/client";
import { getCache, setCache } from "@/lib/storage/localCache";

const CALLES_ACTION = "RecuperarCallesPrincipalPorLinea";

export function useCalles(codLinea: string) {
    const callesParams = codLinea ? { codLinea } : undefined;

    const { data, isLoading } = useSWR(
        codLinea ? [CALLES_ACTION, { codLinea }] : null,
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            fallbackData: callesParams
                ? (getCache(CALLES_ACTION, callesParams) ?? undefined)
                : undefined,
            onSuccess: (res) => {
                if (callesParams) {
                    setCache(CALLES_ACTION, res.calles ?? [], callesParams);
                }
            },
        },
    );

    const callesRaw: { Codigo: string; Descripcion: string }[] = data?.calles ?? [];

    return {
        callesRaw,
        loadingCalles: isLoading,
    };
}
