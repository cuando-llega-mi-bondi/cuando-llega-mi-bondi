import { memo } from "react";
import { IconX } from "./icons/IconX";
import { type Favorito } from "@/lib/cuandoLlega.types";

interface FavoritesListProps {
    favoritos: Favorito[];
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
    onRename: (fav: Favorito) => void;
}

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const FavoritesList = memo(function FavoritesList({ favoritos, onView, onRemove, onRename }: FavoritesListProps) {
    if (favoritos.length === 0) {
        // ... (existing empty state)
        return (
            <div style={{
                marginTop: 40, textAlign: "center", fontFamily: "var(--mono)",
                color: "var(--text-dim)", fontSize: 13, letterSpacing: 1,
            }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
                <div>Guardá paradas como favoritas</div>
                <div style={{ fontSize: 11, marginTop: 6, color: "var(--text-muted)" }}>
                    Presioná ★ en cualquier arribo para guardar
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {favoritos.map(fav => (
                <div key={fav.id} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                }}>
                    <div style={{
                        background: "var(--accent)", color: "#000", borderRadius: 6,
                        padding: "4px 10px", fontFamily: "var(--display)", fontWeight: 900, fontSize: 18,
                        minWidth: 56, textAlign: "center", flexShrink: 0,
                    }}>
                        {fav.descripcionLinea}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                            {fav.nombre}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>
                            {fav.identificadorParada}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button
                            onClick={() => onRename(fav)}
                            style={{
                                background: "none", border: "1px solid var(--border)", borderRadius: 6,
                                color: "var(--text-dim)", padding: "6px 8px", cursor: "pointer",
                            }}
                            title="Editar nombre"
                        >
                            <IconEdit />
                        </button>
                        <button
                            onClick={() => onView(fav)}
                            style={{
                                background: "var(--accent)", border: "none", borderRadius: 6, color: "#000",
                                padding: "6px 12px", fontFamily: "var(--display)", fontWeight: 700,
                                fontSize: 13, cursor: "pointer",
                            }}
                        >
                            VER
                        </button>
                        <button
                            onClick={() => onRemove(fav.id)}
                            style={{
                                background: "none", border: "1px solid var(--border)", borderRadius: 6,
                                color: "var(--text-dim)", padding: "6px 8px", cursor: "pointer",
                            }}
                            title="Eliminar"
                        >
                            <IconX />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
});
