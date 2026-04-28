import { memo } from "react";
import { IconX } from "./icons/IconX";
import type { HistorialEntry } from "@/lib/types";
import { Button, Card } from "@/components/ui";

interface HistorialListProps {
    historial: HistorialEntry[];
    onView: (entry: HistorialEntry) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}

const IconClock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

function formatRelative(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Hace un momento";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    const d = Math.floor(diff / 86400);
    return `Hace ${d} día${d > 1 ? "s" : ""}`;
}

export const HistorialList = memo(function HistorialList({
    historial,
    onView,
    onRemove,
    onClear,
}: HistorialListProps) {
    if (historial.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1.4px] text-text-dim">
                    <IconClock />
                    HISTORIAL RECIENTE
                </div>
                <button
                    onClick={onClear}
                    title="Borrar historial"
                    className="cursor-pointer bg-transparent px-1.5 py-0.5 font-sans text-[11px] tracking-[-0.01em] text-text-muted underline underline-offset-2 transition-colors hover:text-text-dim"
                >
                    BORRAR TODO
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {historial.map((h) => (
                    <Card
                        key={h.id}
                        className="flex animate-slide-up items-center gap-3 px-3.5 py-3 opacity-90"
                    >
                        <div className="min-w-12 flex-shrink-0 rounded-full border border-accent/40 bg-accent/16 px-2.5 py-1 text-center font-display text-base font-semibold tracking-[-0.03em] text-accent">
                            {h.descripcionLinea}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-0.5 truncate font-sans text-sm font-medium tracking-[-0.01em] text-text">
                                {h.descripcionBandera}
                            </div>
                            {(h.calleLabel || h.interseccionLabel) && (
                                <div className="mb-0.5 truncate font-mono text-[10px] text-text-dim">
                                    {h.calleLabel}
                                    {h.interseccionLabel ? ` y ${h.interseccionLabel}` : ""}
                                </div>
                            )}
                            <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                                <IconClock />
                                {formatRelative(h.timestamp)}
                            </div>
                        </div>

                        <div className="flex flex-shrink-0 gap-1.5">
                            <Button
                                onClick={() => onView(h)}
                                variant="secondary"
                                size="sm"
                                className="px-2.5 text-xs"
                            >
                                VER
                            </Button>
                            <Button
                                onClick={() => onRemove(h.id)}
                                title="Quitar del historial"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 p-0 text-text-muted"
                            >
                                <IconX />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
});
