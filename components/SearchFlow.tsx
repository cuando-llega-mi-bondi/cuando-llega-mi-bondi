import { Combobox } from "./Combobox";
import { IconX } from "./icons/IconX";
import { TelegramShare } from "./TelegramShare";
import { ArrivalsPanel } from "./ArrivalsPanel";
import { type Arribo, type Parada, type Linea } from "@/lib/cuandoLlega.types";
import { memo, useId } from "react";
import { Sheet } from "react-modal-sheet";


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

    // Live sharing
    liveSharings?: { lat: number; lng: number; ramal: string | null }[];

    // Telegram share
    telegramUsername?: string;

    // Sheet control
    sheetOpen: boolean;
    onCloseSheet: () => void;
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
    otrasLineas = [], loadingOtras = false, onSelectOtraLinea,
    liveSharings = [],
    telegramUsername = "",
    sheetOpen, onCloseSheet,

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

{/* Error outside sheet (for non-consulting errors like lineas load failure) */}
{!isConsulting && error && (
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
                            background: "none", border: "none", color: "rgba(239,68,68,0.6)",
                            cursor: "pointer", flexShrink: 0, minWidth: 44, minHeight: 44,
                            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                        }}
                        aria-label="Cerrar error"
                    >
                        <IconX />
                    </button>
                </div>
            )}

            {/* ── Arrivals Bottom Sheet ── */}
            <Sheet
                isOpen={sheetOpen}
                onClose={onCloseSheet}
                snapPoints={[0, 0.5, 1]}
                initialSnap={1}
                disableScrollLocking
            >
                <Sheet.Container>
                    <Sheet.Header />
                    <Sheet.Content disableDrag>
                        <div style={{
                            padding: "0 20px 32px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}>
                            {/* Telegram share inside the sheet */}
                            <TelegramShare
                                codLinea={codLinea}
                                selectedRamal={selectedRamal}
                                telegramUsername={telegramUsername}
                            />
                            {/* Arrivals content */}
                            <ArrivalsPanel
                                codLinea={codLinea}
                                paradaId={paradaId}
                                selectedRamal={selectedRamal}
                                setSelectedRamal={setSelectedRamal}
                                isConsulting={isConsulting}
                                loadingArribos={loadingArribos}
                                displayArribos={displayArribos}
                                selectedParada={selectedParada}
                                lastUpdate={lastUpdate}
                                calleLabel={calleLabel}
                                interseccionLabel={interseccionLabel}
                                fetchArribos={fetchArribos}
                                handleFavFromArribos={handleFavFromArribos}
                                otrasLineas={otrasLineas}
                                loadingOtras={loadingOtras}
                                onSelectOtraLinea={onSelectOtraLinea}
                                liveSharings={liveSharings}
                            />
                            {/* Error inside sheet */}
                            {isConsulting && error && (
                                <div style={{
                                    padding: "14px 16px",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.35)",
                                    borderRadius: 10,
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                }}>
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
                                            background: "none", border: "none", color: "rgba(239,68,68,0.6)",
                                            cursor: "pointer", flexShrink: 0, minWidth: 44, minHeight: 44,
                                            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                        }}
                                        aria-label="Cerrar error"
                                    >
                                        <IconX />
                                    </button>
                                </div>
                            )}
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
                <Sheet.Backdrop onTap={onCloseSheet} />
            </Sheet>
        </div>
    );
});
