"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconX } from "@shared/icons/IconX";
import type { ArrivalsOverlaySession } from "@features/arrivals/types/arrivalsSession";
import { resolveArrivalsPanelView } from "@features/arrivals/types/arrivalsSession";
import { ArrivalsPanel } from "./ArrivalsPanel";
import { TelegramShareCTA } from "@features/search/components/TelegramShareCTA";
import { cn } from "@shared/utils";

/** Badge de línea + calle/intersección + CTA de Telegram (compartido sheet/panel). */
export function OverlayHeaderInfo({
    consult,
    telegramUsername,
    action,
}: Pick<ArrivalsOverlaySession, "consult" | "telegramUsername"> & {
    /** Acción al final de la fila del título (ej: botón de cerrar en el sheet). */
    action?: React.ReactNode;
}) {
    const { codLinea, selectedRamal, lineaLabel, calleLabel, interseccionLabel } =
        consult;

    return (
        <>
            <div className="mb-4 flex items-start gap-3">
                {lineaLabel && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                        {lineaLabel}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    {calleLabel && (
                        <h2 className="font-display text-lg font-bold leading-tight tracking-tight">
                            {calleLabel}
                        </h2>
                    )}
                    {interseccionLabel && (
                        <p className="truncate text-sm text-muted-foreground">
                            y {interseccionLabel}
                        </p>
                    )}
                </div>
                {action}
            </div>
            <TelegramShareCTA
                codLinea={codLinea}
                selectedRamal={selectedRamal}
                telegramUsername={telegramUsername}
            />
        </>
    );
}

/**
 * Cuerpo con arribos + errores (compartido sheet/panel). El error de
 * pre-consulta (`consult.error`, ej. fallo al cargar líneas) se muestra en
 * `SearchFlow.tsx` — acá sólo importan los errores de arribos, que
 * `ArrivalsPanel`/`ArrivalsEmpty` ya cubren con su propio `errorInfo`.
 */
export function OverlayBody({
    consult,
    arrivals,
}: Pick<ArrivalsOverlaySession, "consult" | "arrivals">) {
    const { isConsulting } = consult;
    const { displayArribos, loadingArribos, errorInfo } = arrivals;

    const panelView = resolveArrivalsPanelView({
        loadingArribos,
        hasArribos: displayArribos.length > 0,
        hasLiveSharings: arrivals.liveSharings.length > 0,
        isConsulting,
        hasErrored: errorInfo !== null,
    });

    return (
        <div className="flex flex-col gap-3 pb-5">
            {panelView !== "hidden" ? (
                <ArrivalsPanel consult={consult} arrivals={arrivals} />
            ) : null}
        </div>
    );
}

interface ArrivalsDockedPanelProps extends ArrivalsOverlaySession {
    onClose: () => void;
    /** Posicionamiento/tamaño según el host (overlay full-screen o pane de /consultar). */
    className?: string;
}

/** Panel de arribos dockeado (desktop): header + cuerpo scrolleable + cerrar. */
export function ArrivalsDockedPanel({
    consult,
    arrivals,
    telegramUsername,
    onClose,
    className,
}: ArrivalsDockedPanelProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.aside
            initial={reduceMotion ? false : { x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
                "flex flex-col border-l border-border bg-background",
                className,
            )}
            aria-label="Panel de arribos"
        >
            <div className="shrink-0 border-b border-border px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <OverlayHeaderInfo
                            consult={consult}
                            telegramUsername={telegramUsername}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar panel de arribos"
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:border-secondary hover:text-secondary"
                    >
                        <IconX size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4">
                <OverlayBody consult={consult} arrivals={arrivals} />
            </div>
        </motion.aside>
    );
}
