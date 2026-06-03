"use client";

import { memo, useId } from "react";
import { Button } from "@shared/ui/Button";
import { useSearchFlowContext } from "@features/search/context/SearchFlowContext";
import { ErrorBanner } from "./ErrorBanner";
import { StepField } from "./StepField";

interface SearchFlowProps {
    loadingArribos: boolean;
}

export const SearchFlow = memo(function SearchFlow({
    loadingArribos,
}: SearchFlowProps) {
    const { state, actions } = useSearchFlowContext();
    const {
        codLinea,
        codCalle,
        codInterseccion,
        paradaId,
        selectedRamal,
        isConsulting,
        lineaOptions,
        calles,
        interOptions,
        destinoOptions,
        ramalOptions,
        loadingLineas,
        loadingCalles,
        loadingInter,
        error,
    } = state;
    const {
        handleLineaChange,
        handleCalleChange,
        handleInterseccionChange,
        handleParadaChange,
        handleSetSelectedRamal,
        handleConsultar,
        setError,
    } = actions;

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
                onChange={handleLineaChange}
                options={lineaOptions}
                loading={loadingLineas}
                stepStatus={!codLinea ? "active" : "completed"}
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
                    onChange={handleCalleChange}
                    options={calles}
                    loading={loadingCalles}
                    disabled={loadingCalles}
                    stepStatus={
                        codLinea && !codCalle ? "active" : codCalle ? "completed" : "idle"
                    }
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
                    onChange={handleInterseccionChange}
                    options={interOptions}
                    loading={loadingInter}
                    disabled={loadingInter}
                    stepStatus={
                        codCalle && !codInterseccion
                            ? "active"
                            : codInterseccion
                              ? "completed"
                              : "idle"
                    }
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
                    onChange={handleParadaChange}
                    options={destinoOptions}
                    stepStatus={
                        codInterseccion && !paradaId
                            ? "active"
                            : paradaId
                              ? "completed"
                              : "idle"
                    }
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
                    onChange={handleSetSelectedRamal}
                    options={ramalOptions}
                    stepStatus={
                        paradaId && selectedRamal === "TODOS" ? "active" : "idle"
                    }
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
