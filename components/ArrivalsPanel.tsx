import { memo } from "react";
import dynamic from "next/dynamic";
import { ArriboCard } from "./ArriboCard";
import { ShareButton } from "./ShareButton";
import { IconRefresh } from "./icons/IconRefresh";
import { OtrasLineasSuggestion } from "./OtrasLineasSuggestion";
import { type Arribo, type Parada, type Linea } from "@/lib/cuandoLlega.types";
const BusMap = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: "260px", width: "100%", borderRadius: "12px", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 13, border: "1px solid var(--border)" }}>Cargando mapa...</div>
});
interface ArrivalsPanelProps {
    codLinea: string;
    paradaId: string;
    selectedRamal: string;
    setSelectedRamal: (v: string) => void;
    isConsulting: boolean;
    loadingArribos: boolean;
    displayArribos: Arribo[];
    selectedParada?: Parada;
    lastUpdate: Date | null;
    calleLabel?: string;
    interseccionLabel?: string;
    fetchArribos: () => void;
    handleFavFromArribos: (arribo: Arribo) => void;
    otrasLineas?: Linea[];
    loadingOtras?: boolean;
    onSelectOtraLinea?: (linea: Linea) => void;
    liveSharings?: { lat: number; lng: number; ramal: string | null }[];
}
export const ArrivalsPanel = memo(function ArrivalsPanel({
    codLinea,
    paradaId,
    selectedRamal,
    setSelectedRamal,
    isConsulting,
    loadingArribos,
    displayArribos,
    selectedParada,
    lastUpdate,
    calleLabel,
    interseccionLabel,
    fetchArribos,
    handleFavFromArribos,
    otrasLineas = [],
    loadingOtras = false,
    onSelectOtraLinea,
    liveSharings = [],
}: ArrivalsPanelProps) {
    return (
        <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2 }}>
                    PRÓXIMOS ARRIBOS
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {lastUpdate ? (
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)" }}>
                            {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    ) : null}
                    <ShareButton
                        arribos={displayArribos}
                        calleLabel={calleLabel}
                        interseccionLabel={interseccionLabel}
                    />
                    <button
                        type="button"
                        onClick={fetchArribos}
                        disabled={loadingArribos}
                        aria-label="Actualizar arribos"
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            color: "var(--text-dim)",
                            minWidth: 44,
                            minHeight: 44,
                            padding: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <IconRefresh loading={loadingArribos} />
                    </button>
                </div>
            </div>
            {loadingArribos && displayArribos.length === 0 ? (
                <div className="arrivals-loading-panel">
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                        marginBottom: 18, fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)",
                        letterSpacing: 1,
                    }}>
                        <span className="spin-slow" style={{
                            display: "inline-flex", width: 22, height: 22, borderRadius: "50%",
                            border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                        }} aria-hidden />
                        <span>Consultando horarios…</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className="arrivals-skeleton-row" />
                        <div className="arrivals-skeleton-row" />
                        <div className="arrivals-skeleton-row" style={{ opacity: 0.7 }} />
                    </div>
                </div>
            ) : displayArribos.length === 0 ? (
                <div style={{
                    padding: "24px", background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)",
                    textAlign: "center",
                }}>
                    {isConsulting ? (
                        <>
                            <div style={{ marginBottom: 14, lineHeight: 1.5 }}>
                                Sin información en este momento. Podés reintentar o ver todos los ramales si filtraste uno.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
                                <button
                                    type="button"
                                    onClick={fetchArribos}
                                    disabled={loadingArribos}
                                    style={{
                                        minHeight: 44, padding: "12px 14px", borderRadius: 8,
                                        border: "1px solid var(--accent)", background: "rgba(245,166,35,0.12)",
                                        color: "var(--accent)", fontFamily: "var(--display)", fontWeight: 800,
                                        fontSize: 14, letterSpacing: 0.5, cursor: loadingArribos ? "wait" : "pointer",
                                    }}
                                >
                                    Reintentar
                                </button>
                                {selectedRamal !== "TODOS" ? (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRamal("TODOS")}
                                        style={{
                                            minHeight: 44, padding: "12px 14px", borderRadius: 8,
                                            border: "1px solid var(--border)", background: "transparent",
                                            color: "var(--text)", fontFamily: "var(--display)", fontWeight: 700,
                                            fontSize: 14, cursor: "pointer",
                                        }}
                                    >
                                        Ver todos los ramales
                                    </button>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        "Hacé clic en CONSULTAR"
                    )}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {liveSharings.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 12px",
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.25)",
                            borderRadius: 8,
                        }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                background: "#22c55e", boxShadow: "0 0 0 0 rgba(34,197,94,0.4)",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#22c55e" }}>
                                {liveSharings.length === 1
                                    ? "1 persona compartiendo su ubicación en tiempo real"
                                    : `${liveSharings.length} personas compartiendo ubicación en tiempo real`}
                            </span>
                        </div>
                    )}
                    <BusMap
                        arribos={displayArribos}
                        paradaLat={selectedParada?.LatitudParada || displayArribos[0]?.LatitudParada || ""}
                        paradaLon={selectedParada?.LongitudParada || displayArribos[0]?.LongitudParada || ""}
                        lineaCod={codLinea}
                        liveBuses={liveSharings}
                    />
                    {displayArribos.map((a, i) => (
                        <ArriboCard
                            key={i}
                            arribo={a}
                            favId={`${paradaId}_${a.CodigoLineaParada}`}
                            onFav={() => handleFavFromArribos(a)}
                        />
                    ))}
                    {onSelectOtraLinea && (otrasLineas.length > 0 || loadingOtras) && (
                        <OtrasLineasSuggestion
                            lineas={otrasLineas}
                            loading={loadingOtras}
                            onSelect={onSelectOtraLinea}
                        />
                    )}
                </div>
            )}
            {/* Auto-refresh indicator */}
            {isConsulting && !loadingArribos ? (
                <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
                    Actualización automática cada 30s
                </div>
            ) : null}
        </div>
    );
});
