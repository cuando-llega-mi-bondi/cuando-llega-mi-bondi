"use client";

import { isFavorito } from "@/lib/cuandoLlega";
import { type Arribo } from "@/lib/cuandoLlega.types";
import { getArriboColor, formatDesvio } from "@/lib/utils";
import { IconStar } from "./icons/IconStar";
import { IconWheelchair } from "./icons/IconWheelchair";
import { IconUser } from "./icons/IconUser";
import { IconClock } from "./icons/IconClock";

export function ArriboCard({ arribo, onFav, favId }: { arribo: Arribo; onFav: () => void; favId: string }) {
    const color = getArriboColor(arribo.Arribo);
    const desvio = formatDesvio(arribo.DesvioHorario);
    const fav = isFavorito(favId);
    const isAdaptado = arribo.EsAdaptado === "True";

    return (
        <div className="arrival-row" style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "transform 0.1s",
        }}>
            {/* Main info row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Line badge */}
                <div style={{
                    background: "var(--accent)", color: "#000", borderRadius: 8,
                    padding: "6px 12px", fontFamily: "var(--display)", fontWeight: 900,
                    fontSize: 22, letterSpacing: 1, minWidth: 64, textAlign: "center", flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(245,166,35,0.4)",
                }}>
                    {arribo.DescripcionLinea}
                </div>

                {/* Arribo info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: "var(--text-dim)", letterSpacing: 0.5, marginBottom: 2 }}>
                        {arribo.DescripcionCartelBandera.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1.1 }}>
                        {arribo.Arribo}
                    </div>
                </div>

                {/* Fav btn */}
                <button
                    onClick={onFav}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: fav ? "var(--accent)" : "var(--text-muted)",
                        padding: 8, transition: "transform 0.15s, color 0.15s",
                    }}
                    title={fav ? "Quitar favorito" : "Guardar favorito"}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                    <IconStar filled={fav} />
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", opacity: 0.5 }}></div>

            {/* Secondary info details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 11 }}>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>INTERNO {arribo.IdentificadorCoche}</span>
                        {isAdaptado && (
                            <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#60a5fa", border: "1px solid #60a5fa", padding: "1px 4px", borderRadius: 4, fontSize: 8 }}>
                                <IconWheelchair /> ADAPTADO
                            </div>
                        )}
                    </div>
                    {arribo.IdentificadorChofer && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontFamily: "var(--mono)", fontSize: 11 }}>
                            <IconUser /> {arribo.IdentificadorChofer}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", textAlign: "right" }}>
                    {desvio && (
                        <div style={{ background: desvio.color + "22", color: desvio.color, border: `1px solid ${desvio.color}44`, padding: "2px 6px", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700 }}>
                            {desvio.label} {desvio.isEarly ? "ADELANTADO" : "ATRASADO"}
                        </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontFamily: "var(--mono)", fontSize: 10 }}>
                        <IconClock /> GPS: {arribo.UltimaFechaHoraGPS.split(" ")[1]}
                    </div>
                </div>
            </div>
        </div>
    );
}
