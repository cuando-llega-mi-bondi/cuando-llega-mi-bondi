import { Combobox } from "./Combobox";
import { ArriboCard } from "./ArriboCard";
import { IconRefresh } from "./icons/IconRefresh";
import { IconX } from "./icons/IconX";
import { type Arribo, type Parada } from "@/lib/cuandoLlega.types";
import { memo } from "react";
import dynamic from "next/dynamic";

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
    setIsConsulting: (v: boolean) => void;
    
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
    
    // Actions
    handleConsultar: () => void;
    fetchArribos: () => void;
    handleFavFromArribos: (arribo: Arribo) => void;
}

export const SearchFlow = memo(function SearchFlow({
    codLinea, setCodLinea,
    codCalle, setCodCalle,
    codInterseccion, setCodInterseccion,
    paradaId, setParadaId,
    selectedRamal, setSelectedRamal,
    isConsulting, setIsConsulting,
    lineaOptions, calles, interOptions, destinoOptions, ramalOptions,
    loadingLineas, loadingCalles, loadingInter, loadingParadas, loadingArribos,
    error, setError,
    displayArribos, selectedParada, lastUpdate,
    handleConsultar, fetchArribos, handleFavFromArribos
}: SearchFlowProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Step 1: Línea */}
            <div>
                <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                    01 / LÍNEA
                </label>
                <Combobox
                    placeholder="Seleccioná la línea..."
                    value={codLinea}
                    onChange={setCodLinea}
                    options={lineaOptions}
                    loading={loadingLineas}
                />
            </div>

            {/* Step 2: Calle */}
            {codLinea ? (
                <div style={{ animation: "slide-up 0.25s ease" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        02 / CALLE
                    </label>
                    <Combobox
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
                <div style={{ animation: "slide-up 0.25s ease" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        03 / INTERSECCIÓN
                    </label>
                    <Combobox
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
                <div style={{ animation: "slide-up 0.25s ease" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        04 / DESTINO
                    </label>
                    <Combobox
                        placeholder="Elegí el destino..."
                        value={paradaId}
                        onChange={(val) => {
                            setParadaId(val);
                            setIsConsulting(false);
                            setSelectedRamal("TODOS");
                        }}
                        options={destinoOptions}
                    />
                </div>
            ) : null}

            {/* Step 5: Ramal */}
            {paradaId ? (
                <div style={{ animation: "slide-up 0.25s ease" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2, display: "block", marginBottom: 6 }}>
                        05 / RAMAL
                    </label>
                    <Combobox
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
                    onClick={handleConsultar}
                    disabled={loadingArribos}
                    style={{
                        marginTop: 8, padding: "14px", background: "var(--accent)", color: "#000",
                        border: "none", borderRadius: 8, fontFamily: "var(--display)",
                        fontWeight: 800, fontSize: 16, letterSpacing: 1, cursor: "pointer",
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
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {lastUpdate ? (
                                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)" }}>
                                    {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </span>
                            ) : null}
                            <button
                                onClick={fetchArribos}
                                disabled={loadingArribos}
                                style={{
                                    background: "none", border: "1px solid var(--border)", borderRadius: 6,
                                    color: "var(--text-dim)", padding: "4px 8px", cursor: "pointer", display: "flex",
                                }}
                            >
                                <IconRefresh loading={loadingArribos} />
                            </button>
                        </div>
                    </div>

                    {loadingArribos && displayArribos.length === 0 ? (
                        <div style={{
                            padding: "32px", textAlign: "center", fontFamily: "var(--mono)",
                            fontSize: 13, color: "var(--text-dim)", letterSpacing: 2,
                        }}>
                            <div className="blink">CONSULTANDO...</div>
                        </div>
                    ) : displayArribos.length === 0 ? (
                        <div style={{
                            padding: "24px", background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: 10, fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)",
                            textAlign: "center",
                        }}>
                            {isConsulting ? "Sin información en este momento" : "Hacé click en CONSULTAR"}
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
                    padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8, color: "#ef4444", fontFamily: "var(--mono)", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    {error}
                    <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                        <IconX />
                    </button>
                </div>
            )}
        </div>
    );
});
