import { Combobox } from "./Combobox";
import { memo, useId } from "react";
import { Button } from "@/components/ui";
import {
    ErrorBanner,
    StepField,
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
    loadingArribos: boolean;
    error: string;
    setError: (v: string) => void;

    // Actions
    handleConsultar: () => void;
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
    handleConsultar,

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
                stepNumber={1}
                stepText="LÍNEA"
                placeholder="Seleccioná la línea"
                value={codLinea}
                onChange={setCodLinea}
                options={lineaOptions}
                loading={loadingLineas}
                isActive={!codLinea}
                isCompleted={!!codLinea}
                required
                description="Seleccioná una línea"
            />

            {codLinea ? (
                <StepField
                    className="motion-step"
                    labelId={labelCalle}
                    stepNumber={2}
                    stepText="CALLE"
                    placeholder="Seleccioná la calle"
                    value={codCalle}
                    onChange={setCodCalle}
                    options={calles}
                    loading={loadingCalles}
                    disabled={loadingCalles}
                    isActive={codLinea && !codCalle}
                    isCompleted={!!codCalle}
                    required
                    description="Seleccioná una calle"
                />
            ) : null}

            {codCalle ? (
                <StepField
                    className="motion-step"
                    labelId={labelInter}
                    stepNumber={3}
                    stepText="INTERSECCIÓN"
                    placeholder="Elegí la esquina"
                    value={codInterseccion}
                    onChange={setCodInterseccion}
                    options={interOptions}
                    loading={loadingInter}
                    disabled={loadingInter}
                    isActive={codCalle && !codInterseccion}
                    isCompleted={!!codInterseccion}
                    required
                    description="Seleccioná una intersección"
                />
            ) : null}

            {codInterseccion && destinoOptions.length > 0 ? (
                <StepField
                    className="motion-step"
                    labelId={labelDestino}
                    stepNumber={4}
                    stepText="PARADA"
                    placeholder="Seleccionar parada"
                    value={paradaId}
                    onChange={setParadaId}
                    options={destinoOptions}
                    isActive={codInterseccion && !paradaId}
                    isCompleted={!!paradaId}
                    required
                    description="Seleccioná una opción"
                />
            ) : null}

            {paradaId ? (
                <StepField
                    className="motion-step"
                    labelId={labelRamal}
                    stepNumber={5}
                    stepText="RAMAL"
                    placeholder="Elegí el ramal"
                    value={selectedRamal}
                    onChange={setSelectedRamal}
                    options={ramalOptions}
                    isActive={paradaId && selectedRamal === "TODOS"}
                    isCompleted={selectedRamal !== "TODOS"}
                    description="Opcional: filtrar por ramal"
                />
            ) : null}

            {paradaId && (
                <div className="motion-step mt-2 px-1">
                    <Button
                        type="button"
                        onClick={handleConsultar}
                        disabled={loadingArribos}
                        variant="primary"
                        size="lg"
                        className="w-full h-14 rounded-3xl text-lg font-bold shadow-lg"
                    >
                        {loadingArribos ? "CONSULTANDO..." : "VER CUANDO LLEGA"}
                    </Button>
                </div>
            )}

            <ErrorBanner message={!isConsulting ? error : ""} onClose={() => setError("")} />
        </div>
    );
});
