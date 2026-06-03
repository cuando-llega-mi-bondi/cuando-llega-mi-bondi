"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { swrFetcher } from "@shared/api/client";
import { getCache, setCache } from "@shared/storage/localCache";

const CALLES_ACTION = "RecuperarCallesPrincipalPorLinea";

export function useCalles(codLinea: string) {
    const callesParams = codLinea ? { codLinea } : undefined;

    const { data, isLoading, mutate } = useSWR(
        codLinea ? [CALLES_ACTION, { codLinea }] : null,
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
            onSuccess: (res) => {
                if (callesParams) {
                    setCache(CALLES_ACTION, res.calles ?? [], callesParams);
                }
            },
        },
    );

    useEffect(() => {
        if (!callesParams) return;
        const cached = getCache<{ Codigo: string; Descripcion: string }[]>(
            CALLES_ACTION,
            callesParams,
        );
        if (cached) {
            void mutate({ calles: cached }, { revalidate: false });
        }
    }, [callesParams, mutate]);

    const callesRaw: { Codigo: string; Descripcion: string }[] = data?.calles ?? [];

    return {
        callesRaw,
        loadingCalles: isLoading,
    };
}
