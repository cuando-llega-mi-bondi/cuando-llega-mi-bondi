import { memo } from "react";
import { IconX } from "./icons/IconX";
import { type HistorialEntry, type Favorito } from "@/lib/cuandoLlega.types";

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
        <div style={{ marginTop: 32 }}>
            {/* Header row */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 12,
            }}>
                <div style={{
                    fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)",
                    letterSpacing: 2, display: "flex", alignItems: "center", gap: 6,
                }}>
                    <IconClock />
                    HISTORIAL RECIENTE
                </div>
                <button
                    onClick={onClear}
                    title="Borrar historial"
                    style={{
                        background: "none", border: "none", padding: "2px 6px",
                        fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)",
                        cursor: "pointer", letterSpacing: 1, textDecoration: "underline",
                        textUnderlineOffset: 2,
                    }}
                >
                    BORRAR TODO
                </button>
            </div>

            {/* Entries */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historial.map((h) => (
                    <div key={h.id} style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 10, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 12,
                        opacity: 0.9,
                        animation: "slide-up 0.2s ease",
                    }}>
                        {/* Line badge */}
                        <div style={{
                            background: "var(--surface2)", color: "var(--text-dim)",
                            border: "1px solid var(--border)",
                            borderRadius: 6, padding: "3px 9px",
                            fontFamily: "var(--display)", fontWeight: 900, fontSize: 16,
                            minWidth: 48, textAlign: "center", flexShrink: 0,
                        }}>
                            {h.descripcionLinea}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontFamily: "var(--display)", fontWeight: 600, fontSize: 14,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                marginBottom: 2,
                            }}>
                                {h.descripcionBandera}
                            </div>
                            {(h.calleLabel || h.interseccionLabel) && (
                                <div style={{
                                    fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)",
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    marginBottom: 2,
                                }}>
                                    {h.calleLabel}
                                    {h.interseccionLabel ? ` y ${h.interseccionLabel}` : ""}
                                </div>
                            )}
                            <div style={{
                                fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                                <IconClock />
                                {formatRelative(h.timestamp)}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                                onClick={() => onView(h)}
                                style={{
                                    background: "var(--surface2)", border: "1px solid var(--border)",
                                    borderRadius: 6, color: "var(--text-dim)",
                                    padding: "5px 11px", fontFamily: "var(--display)", fontWeight: 700,
                                    fontSize: 12, cursor: "pointer", letterSpacing: 0.5,
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)", e.currentTarget.style.color = "#000", e.currentTarget.style.borderColor = "var(--accent)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "var(--surface2)", e.currentTarget.style.color = "var(--text-dim)", e.currentTarget.style.borderColor = "var(--border)")}
                            >
                                VER
                            </button>
                            <button
                                onClick={() => onRemove(h.id)}
                                title="Quitar del historial"
                                style={{
                                    background: "none", border: "1px solid var(--border)",
                                    borderRadius: 6, color: "var(--text-muted)",
                                    padding: "5px 8px", cursor: "pointer",
                                }}
                            >
                                <IconX />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
