"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import type { Arribo } from "@features/arrivals/types";
import { DEV_FIXTURE_ARRIBOS } from "@features/arrivals/lib/devFixture";
import { swrFetcherWithMeta, type MgpResult, type SwrActionKey } from "@shared/api/client";
import {
    MgpBusinessError,
    describeMgpError,
    nextRetryDelayMs,
    type MgpErrorPresentation,
} from "@shared/api/errors";

interface UseArribosParams {
    isConsulting: boolean;
    paradaId: string;
    codLinea: string;
    onSuccess?: () => void;
    onError?: (message: string) => void;
}

type ArribosResult = MgpResult<{ arribos?: Arribo[] }>;

export function useArribos({
    isConsulting,
    paradaId,
    codLinea,
    onSuccess,
    onError,
}: UseArribosParams) {
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [errorInfo, setErrorInfo] = useState<MgpErrorPresentation | null>(null);
    const [retryAt, setRetryAt] = useState<number | null>(null);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    }, [onSuccess, onError]);

    // Nueva parada/línea/consulta: no arrastrar el error NI el "última
    // actualización" de la anterior (si no se resetea `lastUpdate`, el header
    // sigue mostrando "hace Xs" creciendo desde la consulta previa mientras la
    // nueva todavía está cargando o reintentando — confunde). Ajuste de estado
    // durante el render (no en un efecto) siguiendo el patrón que recomienda
    // React para resetear estado ante un cambio de "key" lógica.
    const consultKey = `${paradaId}|${codLinea}|${isConsulting}`;
    const [prevConsultKey, setPrevConsultKey] = useState(consultKey);
    if (consultKey !== prevConsultKey) {
        setPrevConsultKey(consultKey);
        setErrorInfo(null);
        setRetryAt(null);
        setLastUpdate(null);
    }

    const swrOptions: SWRConfiguration<ArribosResult> = useMemo(
        () => ({
            refreshInterval: 25_000,
            refreshWhenHidden: false,
            revalidateOnFocus: true,
            focusThrottleInterval: 25_000,
            // Nada de `keepPreviousData`: la key incluye parada y línea, así que
            // al cambiar de colectivo SWR seguía mostrando los arribos del
            // anterior como si fueran del nuevo — y sin spinner, porque con datos
            // previos `isLoading` queda en false. Para lo que buscaba (que un
            // refresh fallido no vacíe la lista) no hace falta: SWR ya conserva
            // los datos de una key cuando su revalidación falla.
            onSuccess: () => {
                setLastUpdate(new Date());
                setErrorInfo(null);
                setRetryAt(null);
                onSuccessRef.current?.();
            },
            onError: (err) => {
                setErrorInfo(describeMgpError(err));
                const message =
                    err instanceof Error
                        ? err.message
                        : "El servidor de la Municipalidad no responde.";
                onErrorRef.current?.(message);
            },
            // Único mecanismo de retry ante error: reemplaza el countdown manual
            // que antes vivía en ArrivalsEmpty (corría en paralelo al polling de
            // SWR). Backoff diferenciado por tipo de error — ver shared/api/errors.
            onErrorRetry: (err, _key, _config, revalidate, revalidateOpts) => {
                if (err instanceof MgpBusinessError) return; // no se arregla reintentando
                const attempt = revalidateOpts.retryCount + 1;
                const delay = nextRetryDelayMs(err, attempt);
                if (!Number.isFinite(delay)) return;
                setRetryAt(Date.now() + delay);
                setTimeout(() => revalidate({ retryCount: attempt }), delay);
            },
        }),
        [],
    );

    const { data, isLoading, mutate } = useSWR<ArribosResult>(
        isConsulting && paradaId && codLinea
            ? [
                  "RecuperarProximosArribosW",
                  { identificadorParada: paradaId, codigoLineaParada: codLinea },
              ]
            : null,
        // `swrFetcherWithMeta` devuelve `MgpResult<unknown>`; el shape real de
        // `data.arribos` para esta acción puntual lo fija este hook.
        swrFetcherWithMeta as (key: SwrActionKey) => Promise<ArribosResult>,
        swrOptions,
    );

    const realArribos = (data?.data?.arribos as Arribo[] | undefined) ?? [];
    // En dev, si la consulta real ya resolvió sin traer nada (fuera de
    // horario de servicio, API caída), mostramos arribos ficticios para
    // poder probar visualmente ArriboCard sin depender del horario real.
    const arribos =
        DEV_FIXTURE_ARRIBOS.length > 0 && isConsulting && !isLoading && realArribos.length === 0
            ? DEV_FIXTURE_ARRIBOS
            : realArribos;

    return {
        arribos,
        loadingArribos: isLoading,
        mutateArribos: mutate,
        lastUpdate,
        errorInfo,
        retryAt,
        isStale: data?.meta?.cache === "STALE",
    };
}
