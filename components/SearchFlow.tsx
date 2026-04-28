import { Combobox } from "./Combobox";
import type { Arribo, Linea, Parada } from "@/lib/types";
import { memo, useId } from "react";
import { Button } from "@/components/ui";
import {
    ArrivalsPanel,
    ErrorBanner,
    StepField,
    TelegramShareCTA,
} from "@/components/search";

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
}: SearchFlowProps) {
    const uid = useId();
    const labelLinea = `sf-linea${uid}`;
    const labelCalle = `sf-calle${uid}`;
    const labelInter = `sf-inter${uid}`;
    const labelDestino = `sf-destino${uid}`;
    const labelRamal = `sf-ramal${uid}`;

    return (
        <div className="flex flex-col gap-3">
            <StepField
                labelId={labelLinea}
                stepText="01 / LÍNEA"
                placeholder="Seleccioná la línea..."
                value={codLinea}
                onChange={setCodLinea}
                options={lineaOptions}
                loading={loadingLineas}
            />

            {codLinea ? (
                <StepField
                    className="motion-step"
                    labelId={labelCalle}
                    stepText="02 / CALLE"
                    placeholder="Seleccioná la calle..."
                    value={codCalle}
                    onChange={setCodCalle}
                    options={calles}
                    loading={loadingCalles}
                    disabled={loadingCalles}
                />
            ) : null}

            {codCalle ? (
                <StepField
                    className="motion-step"
                    labelId={labelInter}
                    stepText="03 / INTERSECCIÓN"
                    placeholder="Elegí la esquina..."
                    value={codInterseccion}
                    onChange={setCodInterseccion}
                    options={interOptions}
                    loading={loadingInter}
                    disabled={loadingInter}
                />
            ) : null}

            {codInterseccion && destinoOptions.length > 0 ? (
                <StepField
                    className="motion-step"
                    labelId={labelDestino}
                    stepText="04 / DESTINO"
                    placeholder="Elegí el destino..."
                    value={paradaId}
                    onChange={setParadaId}
                    options={destinoOptions}
                />
            ) : null}

            {paradaId ? (
                <div className="motion-step">
                    <label
                        id={labelRamal}
                        className="mb-1.5 block font-mono text-[11px] tracking-[2px] text-text-dim"
                    >
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

            {paradaId && (
                <Button
                    type="button"
                    onClick={handleConsultar}
                    disabled={loadingArribos}
                    variant="primary"
                    size="lg"
                    className="mt-2 text-base tracking-[1px]"
                >
                    {loadingArribos ? "CONSULTANDO..." : "CONSULTAR"}
                </Button>
            )}

            <TelegramShareCTA
                codLinea={codLinea}
                selectedRamal={selectedRamal}
                telegramUsername={telegramUsername}
            />

            {(loadingArribos || displayArribos.length > 0 || isConsulting) ? (
                <ArrivalsPanel
                    loadingArribos={loadingArribos}
                    displayArribos={displayArribos}
                    isConsulting={isConsulting}
                    lastUpdate={lastUpdate}
                    fetchArribos={fetchArribos}
                    calleLabel={calleLabel}
                    interseccionLabel={interseccionLabel}
                    selectedRamal={selectedRamal}
                    setSelectedRamal={setSelectedRamal}
                    selectedParada={selectedParada}
                    codLinea={codLinea}
                    paradaId={paradaId}
                    liveSharings={liveSharings}
                    handleFavFromArribos={handleFavFromArribos}
                    otrasLineas={otrasLineas}
                    loadingOtras={loadingOtras}
                    onSelectOtraLinea={onSelectOtraLinea}
                />
            ) : null}

            <ErrorBanner message={error} onClose={() => setError("")} />
        </div>
    );
});
