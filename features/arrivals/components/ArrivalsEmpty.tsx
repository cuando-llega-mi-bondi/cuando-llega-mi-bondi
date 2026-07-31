"use client";

import { useEffect, useState } from "react";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { Spinner } from "@shared/ui/Spinner";
import { IconAlertTriangle } from "@shared/icons/IconAlertTriangle";
import { IconInfo } from "@shared/icons/IconInfo";
import { cn } from "@shared/utils";
import type { MgpErrorPresentation } from "@shared/api/errors";

export type ArrivalsEmptyMode = "prompt" | "no-data";

/** Franja con servicio reducido: el vacío suele ser normal, avisamos. */
function isOffPeakNow(): boolean {
    const h = new Date().getHours();
    return h >= 23 || h < 5;
}

interface ArrivalsEmptyProps {
    mode: ArrivalsEmptyMode;
    /** Presentación del último error (`null` si el último intento no fue error). */
    errorInfo: MgpErrorPresentation | null;
    /** `Date.now()` estimado del próximo retry automático (ver `useArribos`). */
    retryAt: number | null;
    loadingArribos: boolean;
    selectedRamal: string;
    onRetry: () => void;
    onResetRamal: () => void;
}

/** Cuenta regresiva legible en segundos hasta `retryAt`, o `null` si ya pasó / no hay. */
function useCountdown(retryAt: number | null): number | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (retryAt === null) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [retryAt]);

    if (retryAt === null) return null;
    return Math.max(0, Math.ceil((retryAt - now) / 1000));
}

export function ArrivalsEmpty({
    mode,
    errorInfo,
    retryAt,
    loadingArribos,
    selectedRamal,
    onRetry,
    onResetRamal,
}: ArrivalsEmptyProps) {
    const countdown = useCountdown(retryAt);

    if (mode !== "no-data") {
        return (
            <Card className="rounded-xl px-6 py-6 text-center font-sans text-sm text-muted-foreground">
                Hacé clic en CONSULTAR
            </Card>
        );
    }

    const isBusinessError = errorInfo?.retriable === "none";
    const isWarning = errorInfo?.severity === "warning";

    return (
        <Card
            className={cn(
                "rounded-xl px-6 py-6 text-center font-sans text-sm",
                errorInfo
                    ? isWarning
                        ? "border-error/30 bg-error/5"
                        : "border-secondary/25 bg-secondary/5"
                    : undefined,
            )}
        >
            {errorInfo ? (
                // Título + mensaje en una sola región `status`: se anuncia una vez
                // cuando cambia el tipo de error, no en cada tick del countdown.
                <div role="status" aria-live="polite">
                    <div
                        className={cn(
                            "mb-1.5 flex items-center justify-center gap-2 font-semibold",
                            isWarning ? "text-error" : "text-foreground",
                        )}
                    >
                        {isWarning ? (
                            <IconAlertTriangle width={16} height={16} aria-hidden />
                        ) : (
                            <IconInfo width={16} height={16} aria-hidden />
                        )}
                        {errorInfo.title}
                    </div>
                    <div className="mb-3.5 leading-relaxed text-muted-foreground">
                        {errorInfo.message}
                    </div>
                </div>
            ) : (
                <div className="mb-3.5 leading-relaxed text-muted-foreground">
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

            {/* Errores de negocio no se arreglan reintentando: sin countdown. */}
            {!isBusinessError ? (
                <div className="mt-3 font-mono text-[10px] text-muted-foreground">
                    {loadingArribos
                        ? "Consultando…"
                        : countdown !== null
                          ? `Reintentando automáticamente en ${countdown}s`
                          : null}
                </div>
            ) : null}
        </Card>
    );
}
