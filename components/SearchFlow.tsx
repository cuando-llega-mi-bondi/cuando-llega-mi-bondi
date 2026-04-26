import { Combobox } from "./Combobox";
import { ArriboCard } from "./ArriboCard";
import { ShareButton } from "./ShareButton";
import { IconRefresh } from "./icons/IconRefresh";
import { IconX } from "./icons/IconX";
import { type Arribo, type Parada, type Linea } from "@/lib/cuandoLlega.types";
import { memo, useId } from "react";
import dynamic from "next/dynamic";
import { OtrasLineasSuggestion } from "./OtrasLineasSuggestion";

const BusMap = dynamic(() => import('@/components/Map'), { 
    ssr: false, 
    loading: () => <div style={{ height: "260px", width: "100%", borderRadius: "12px", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 13, border: "1px solid var(--border)" }}>Cargando mapa...</div> 
});

interface SearchFlowProps {
    // State & Setters
    codLinea: string;
    setCodLinea: (v: string) => void;
    codCalle: string;
    setCodCalle: (v: string) => void;
    codInterseccion: string;
    setCodInterseccion: (v: string) => void;
    paradaId: string;
    setParadaId: (v: string) => void;
    selectedRamal: string;
    setSelectedRamal: (v: string) => void;
    isConsulting: boolean;

    // Arrays for options
    lineaOptions: { value: string; label: string }[];
    calles: { value: string; label: string }[];
    interOptions: { value: string; label: string }[];
    destinoOptions: { value: string; label: string }[];
    ramalOptions: { value: string; label: string }[];
    
    // Loading/Error states
    loadingLineas: boolean;
    loadingCalles: boolean;
    loadingInter: boolean;
    loadingParadas: boolean;
    loadingArribos: boolean;
    error: string;
    setError: (v: string) => void;
    
    // Data for display
    displayArribos: Arribo[];
    selectedParada?: Parada;
    lastUpdate: Date | null;
    calleLabel?: string;
    interseccionLabel?: string;

    // Actions
    handleConsultar: () => void;
    fetchArribos: () => void;
    handleFavFromArribos: (arribo: Arribo) => void;

    // Otras Lineas Suggestion
    otrasLineas?: Linea[];
    loadingOtras?: boolean;
    onSelectOtraLinea?: (linea: Linea) => void;
}

export const SearchFlow = memo(function SearchFlow({
    codLinea, setCodLinea,
    codCalle, setCodCalle,
    codInterseccion, setCodInterseccion,
    paradaId, setParadaId,
    selectedRamal, setSelectedRamal,
    isConsulting,
    lineaOptions, calles, interOptions, destinoOptions, ramalOptions,
    loadingLineas, loadingCalles, loadingInter, loadingArribos,
    error, setError,
    displayArribos, selectedParada, lastUpdate,
    calleLabel, interseccionLabel,
    handleConsultar, fetchArribos, handleFavFromArribos,
    otrasLineas = [], loadingOtras = false, onSelectOtraLinea
}: SearchFlowProps) {
    const uid = useId();
    const labelLinea = `sf-linea${uid}`;
    const labelCalle = `sf-calle${uid}`;
    const labelInter = `sf-inter${uid}`;
    const labelDestino = `sf-destino${uid}`;
    const labelRamal = `sf-ramal${uid}`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Step 1: Línea */}
            <div>
                <label id={labelLinea} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                    01 / LÍNEA
                </label>
                <Combobox
                    aria-labelledby={labelLinea}
                    placeholder="Seleccioná la línea..."
                    value={codLinea}
                    onChange={setCodLinea}
                    options={lineaOptions}
                    loading={loadingLineas}
                />
            </div>

            {/* Step 2: Calle */}
            {codLinea ? (
                <div className="motion-step">
                    <label id={labelCalle} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        02 / CALLE
                    </label>
                    <Combobox
                        aria-labelledby={labelCalle}
                        placeholder="Seleccioná la calle..."
                        value={codCalle}
                        onChange={setCodCalle}
                        options={calles}
                        loading={loadingCalles}
                        disabled={loadingCalles}
                    />
                </div>
            ) : null}

            {/* Step 3: Intersección */}
            {codCalle ? (
                <div className="motion-step">
                    <label id={labelInter} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        03 / INTERSECCIÓN
                    </label>
                    <Combobox
                        aria-labelledby={labelInter}
                        placeholder="Elegí la esquina..."
                        value={codInterseccion}
                        onChange={setCodInterseccion}
                        options={interOptions}
                        loading={loadingInter}
                        disabled={loadingInter}
                    />
                </div>
            ) : null}

            {/* Step 4: Destino */}
            {codInterseccion && destinoOptions.length > 0 ? (
                <div className="motion-step">
                    <label id={labelDestino} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        04 / DESTINO
                    </label>
                    <Combobox
                        aria-labelledby={labelDestino}
                        placeholder="Elegí el destino..."
                        value={paradaId}
                        onChange={setParadaId}
                        options={destinoOptions}
                    />
                </div>
            ) : null}

            {/* Step 5: Ramal */}
            {paradaId ? (
                <div className="motion-step">
                    <label id={labelRamal} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        05 / RAMAL
                    </label>
                    <Combobox
                        aria-labelledby={labelRamal}
                        placeholder="Elegí el ramal..."
                        value={selectedRamal}
                        onChange={setSelectedRamal}
                        options={ramalOptions}
                    />
                </div>
            ) : null}

            {/* Step 6: Consultar Button */}
            {paradaId && (
                <button
                    type="button"
                    onClick={handleConsultar}
                    disabled={loadingArribos}
                    style={{
                        marginTop: 8,
                        minHeight: 48,
                        padding: "14px 16px",
                        background: "var(--accent)",
                        color: "#000",
                        border: "none",
                        borderRadius: 8,
                        fontFamily: "var(--display)",
                        fontWeight: 800,
                        fontSize: 16,
                        letterSpacing: 1,
                        cursor: "pointer",
                        transition: "transform 0.1s, opacity 0.2s",
                        opacity: loadingArribos ? 0.7 : 1,
                    }}
                    onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
                    onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                    {loadingArribos ? "CONSULTANDO..." : "CONSULTAR"}
                </button>
            )}

            {/* Arrivals */}
            {(loadingArribos || displayArribos.length > 0 || isConsulting) ? (
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
                            <BusMap 
                                arribos={displayArribos} 
                                paradaLat={selectedParada?.LatitudParada || displayArribos[0]?.LatitudParada || ""} 
                                paradaLon={selectedParada?.LongitudParada || displayArribos[0]?.LongitudParada || ""} 
                                lineaCod={codLinea}
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
            ) : null}

            {error && (
                <div style={{
                    padding: "14px 16px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    animation: "slide-up 0.2s ease",
                }}>
                    {/* Warning icon */}
                    <span style={{ flexShrink: 0, marginTop: 1, color: "#ef4444" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                        </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 13, color: "#ef4444", marginBottom: 3 }}>
                            El servidor no responde
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "rgba(239,68,68,0.85)", lineHeight: 1.5 }}>
                            {error}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "rgba(239,68,68,0.6)",
                            cursor: "pointer",
                            flexShrink: 0,
                            minWidth: 44,
                            minHeight: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                        }}
                        aria-label="Cerrar error"
                    >
                        <IconX />
                    </button>
                </div>
            )}
        </div>
    );
});
