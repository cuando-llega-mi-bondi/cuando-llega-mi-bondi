import { memo } from "react";
import { IconX } from "./icons/IconX";
import { type Favorito } from "@/lib/cuandoLlega.types";

interface FavoritesListProps {
    favoritos: Favorito[];
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
}

export const FavoritesList = memo(function FavoritesList({ favoritos, onView, onRemove }: FavoritesListProps) {
    if (favoritos.length === 0) {
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
                        >
                            <IconX />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
});
