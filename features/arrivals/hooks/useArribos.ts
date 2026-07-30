"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import type { Arribo } from "@features/arrivals/types";
import { swrFetcher } from "@shared/api/client";

interface UseArribosParams {
    isConsulting: boolean;
    paradaId: string;
    codLinea: string;
    onSuccess?: () => void;
    onError?: (message: string) => void;
}

export function useArribos({
    isConsulting,
    paradaId,
    codLinea,
    onSuccess,
    onError,
}: UseArribosParams) {
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    }, [onSuccess, onError]);

    const swrOptions = useMemo(
        () => ({
            refreshInterval: 60_000,
            refreshWhenHidden: false,
            revalidateOnFocus: true,
            focusThrottleInterval: 60_000,
            // Nada de `keepPreviousData`: la key incluye parada y línea, así que
            // al cambiar de colectivo SWR seguía mostrando los arribos del
            // anterior como si fueran del nuevo — y sin spinner, porque con datos
            // previos `isLoading` queda en false. Para lo que buscaba (que un
            // refresh fallido no vacíe la lista) no hace falta: SWR ya conserva
            // los datos de una key cuando su revalidación falla.
            onSuccess: () => {
                setLastUpdate(new Date());
                onSuccessRef.current?.();
            },
            onError: (err: unknown) => {
                const message =
                    err instanceof Error
                        ? err.message
                        : "El servidor de la Municipalidad no responde.";
                onErrorRef.current?.(message);
            },
        }),
        [],
    );

    const { data, isLoading, mutate } = useSWR(
        isConsulting && paradaId && codLinea
            ? [
                  "RecuperarProximosArribosW",
                  { identificadorParada: paradaId, codigoLineaParada: codLinea },
              ]
            : null,
        swrFetcher,
        swrOptions,
    );

    return {
        arribos: (data?.arribos as Arribo[] | undefined) ?? [],
        loadingArribos: isLoading,
        mutateArribos: mutate,
        lastUpdate,
    };
}
