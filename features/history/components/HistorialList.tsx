"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { HistorialEntry } from "@features/history/types";
import { SwipeableRow, type SwipeAction } from "@shared/gestures";
import { useToast } from "@shared/ui";
import { IconEye } from "@shared/icons/IconEye";
import { IconTrash } from "@shared/icons/IconTrash";
import { IconRoad } from "@shared/icons/IconRoad";
import { IconCrossroads } from "@shared/icons/IconCrossroads";

// ─── Action configs (static — no re-renders) ─────────────────────────────────

const LEFT_ACTION: SwipeAction = {
    color: "#1a73e8",
    commitColor: "#0d62d0",
    icon: <IconEye size={18} />,
    label: "Ver",
};

const RIGHT_ACTION: SwipeAction = {
    color: "#e24b4a",
    commitColor: "#a32d2d",
    icon: <IconTrash size={18} />,
    label: "Borrar",
};

// ─── HistorialRow ─────────────────────────────────────────────────────────────

interface HistorialRowProps {
    entry: HistorialEntry;
    onView: (entry: HistorialEntry) => void;
    onRemove: (id: string) => void;
    onUndoRemove?: (entry: HistorialEntry) => void;
    index: number;
}

const HistorialRow = memo(function HistorialRow({
    entry,
    onView,
    onRemove,
    onUndoRemove,
    index,
}: HistorialRowProps) {
    const { toast } = useToast();

    const handleRemove = useCallback(() => {
        onRemove(entry.id);
        toast({
            description: `Se eliminó "${entry.descripcionBandera}" del historial.`,
            action: onUndoRemove ? {
                label: "Deshacer",
                onClick: () => onUndoRemove(entry)
            } : undefined
        });
    }, [onRemove, onUndoRemove, entry, toast]);

    return (
        <SwipeableRow
            leftAction={LEFT_ACTION}
            rightAction={RIGHT_ACTION}
            onSwipeRight={() => onView(entry)}
            onSwipeLeft={handleRemove}
            onTap={() => onView(entry)}
            ariaLabel={`Ver ${entry.descripcionBandera}, línea ${entry.lineaLabel ?? entry.codLinea}`}
            index={index}
        >
            {(() => {
                const lineLabel =
                    entry.lineaLabel?.trim() ||
                    entry.descripcionLinea?.trim() ||
                    entry.codLinea;

                return (
                    <div className="flex items-center gap-3">
                        {/* Line badge */}
                        <div className="flex h-10 min-w-11 flex-shrink-0 items-center justify-center rounded-xl bg-foreground/[0.07] px-2.5 font-display text-[15px] font-bold tabular-nums tracking-tight text-foreground">
                            {lineLabel}
                        </div>

                        {/* Content — clear hierarchy */}
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[14px] font-semibold leading-snug tracking-tight text-foreground">
                                {entry.descripcionBandera}
                            </div>

                            {(entry.calleLabel || entry.interseccionLabel) && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    {entry.calleLabel && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground/70">
                                            <IconRoad size={11} />
                                            <span className="truncate text-[11px] leading-tight">{entry.calleLabel}</span>
                                        </div>
                                    )}
                                    {entry.interseccionLabel && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground/70">
                                            <IconCrossroads size={11} />
                                            <span className="truncate text-[11px] leading-tight">{entry.interseccionLabel}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </SwipeableRow>
    );
});

// ─── HistorialList ─────────────────────────────────────────────────────────────

interface HistorialListProps {
    historial: HistorialEntry[];
    onView: (entry: HistorialEntry) => void;
    onRemove: (id: string) => void;
    onUndoRemove?: (entry: HistorialEntry) => void;
    onClear: () => void;
}

export const HistorialList = memo(function HistorialList({
    historial,
    onView,
    onRemove,
    onUndoRemove,
    onClear,
}: HistorialListProps) {
    if (historial.length === 0) return null;

    return (
        <div className="mt-8">
            {/* Header */}

            <div className="mb-3 flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
                    CONSULTAS RECIENTES
                </div>

                <motion.button
                    onClick={onClear}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 font-sans text-[11px] font-semibold tracking-wide text-destructive transition-colors hover:bg-destructive/15 active:bg-destructive/25"
                    whileTap={{ scale: 0.95 }}
                >
                    <IconTrash size={12} />
                    LIMPIAR
                </motion.button>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                    {historial.map((h, i) => (
                        <HistorialRow
                            key={h.id}
                            entry={h}
                            onView={onView}
                            onRemove={onRemove}
                            onUndoRemove={onUndoRemove}
                            index={i}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
});