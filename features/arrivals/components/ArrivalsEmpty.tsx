"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { Spinner } from "@shared/ui/Spinner";

export type ArrivalsEmptyMode = "prompt" | "no-data";

/** Cadencia del reintento automático visible. */
const AUTO_RETRY_SECONDS = 20;

/** Franja con servicio reducido: el vacío suele ser normal, avisamos. */
function isOffPeakNow(): boolean {
    const h = new Date().getHours();
    return h >= 23 || h < 5;
}

interface ArrivalsEmptyProps {
    mode: ArrivalsEmptyMode;
    /** True si la última consulta terminó en error (red/servidor caído). */
    hasError: boolean;
    loadingArribos: boolean;
    selectedRamal: string;
    onRetry: () => void;
    onResetRamal: () => void;
}

export function ArrivalsEmpty({
    mode,
    hasError,
    loadingArribos,
    selectedRamal,
    onRetry,
    onResetRamal,
}: ArrivalsEmptyProps) {
    const [countdown, setCountdown] = useState(AUTO_RETRY_SECONDS);
    const onRetryRef = useRef(onRetry);
    useEffect(() => {
        onRetryRef.current = onRetry;
    }, [onRetry]);

    // Reinicia el contador cuando termina un intento (manual o automático).
    useEffect(() => {
        if (!loadingArribos) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCountdown(AUTO_RETRY_SECONDS);
        }
    }, [loadingArribos]);

    // Reintento automático visible: cuenta regresiva de 20s → onRetry().
    useEffect(() => {
        if (mode !== "no-data" || loadingArribos) return;
        const id = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    onRetryRef.current();
                    return AUTO_RETRY_SECONDS;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [mode, loadingArribos]);

    if (mode !== "no-data") {
        return (
            <Card className="rounded-xl px-6 py-6 text-center font-sans text-sm text-muted-foreground">
                Hacé clic en CONSULTAR
            </Card>
        );
    }

    return (
        <Card className="rounded-xl px-6 py-6 text-center font-sans text-sm text-muted-foreground">
            {hasError ? (
                <>
                    <div className="mb-1.5 flex items-center justify-center gap-2 font-semibold text-foreground">
                        <span aria-hidden>⚠️</span>
                        El servicio de datos no responde
                    </div>
                    <div className="mb-3.5 leading-relaxed">
                        No es un problema tuyo ni de la app: la fuente oficial
                        de la Municipalidad está tardando. Reintentamos
                        automáticamente.
                    </div>
                </>
            ) : (
                <div className="mb-3.5 leading-relaxed">
                    La Municipalidad no informa arribos para esta parada en
                    este momento.
                    {isOffPeakNow() ? (
                        <>
                            {" "}
                            En este horario el servicio suele ser reducido.
                        </>
                    ) : null}
                </div>
            )}

            <div className="flex flex-col items-stretch gap-2.5">
                <Button
                    type="button"
                    onClick={onRetry}
                    disabled={loadingArribos}
                    variant="secondary"
                    className="text-sm"
                >
                    {loadingArribos ? (
                        <span className="flex items-center justify-center gap-2">
                            <Spinner className="h-4 w-4" />
                            Reintentando…
                        </span>
                    ) : (
                        "Reintentar"
                    )}
                </Button>
                {selectedRamal !== "TODOS" ? (
                    <Button
                        type="button"
                        onClick={onResetRamal}
                        variant="secondary"
                        className="text-sm text-foreground"
                    >
                        Ver todos los ramales
                    </Button>
                ) : null}
            </div>

            <div
                className="mt-3 font-mono text-[10px] text-muted-foreground"
                aria-live="polite"
            >
                {loadingArribos
                    ? "Consultando…"
                    : `Reintentando automáticamente en ${countdown}s`}
            </div>
        </Card>
    );
}
