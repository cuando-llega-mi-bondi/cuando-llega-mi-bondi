"use client";

import { memo, useId } from "react";
import { Button } from "@shared/ui/Button";
import { useSearchFlowData } from "@features/search/context/SearchFlowContext";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { ErrorBanner } from "./ErrorBanner";
import { StepField } from "./StepField";

interface SearchFlowProps {
    loadingArribos: boolean;
}

export const SearchFlow = memo(function SearchFlow({
    loadingArribos,
}: SearchFlowProps) {
    const {
        lineaOptions,
        calles,
        interOptions,
        destinoOptions,
        ramalOptions,
        loadingLineas,
        loadingCalles,
        loadingInter,
        handleLineaChange,
    } = useSearchFlowData();

    const codLinea = useSearchFlowStore((s) => s.codLinea);
    const codCalle = useSearchFlowStore((s) => s.codCalle);
    const codInterseccion = useSearchFlowStore((s) => s.codInterseccion);
    const paradaId = useSearchFlowStore((s) => s.paradaId);
    const selectedRamal = useSearchFlowStore((s) => s.selectedRamal);
    const isConsulting = useSearchFlowStore((s) => s.isConsulting);
    const isResolving = useSearchFlowStore((s) => s.isResolving);
    const error = useSearchFlowStore((s) => s.error);

    const selectCalle = useSearchFlowStore((s) => s.selectCalle);
    const selectInterseccion = useSearchFlowStore((s) => s.selectInterseccion);
    const selectParada = useSearchFlowStore((s) => s.selectParada);
    const setSelectedRamal = useSearchFlowStore((s) => s.setSelectedRamal);
    const consultar = useSearchFlowStore((s) => s.consultar);
    const setError = useSearchFlowStore((s) => s.setError);

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
            />

            {codLinea ? (
                <StepField
                    className="motion-step"
                    labelId={labelCalle}
                    stepNumber={2}
                    stepText="CALLE"
                    placeholder="Seleccioná la calle"
                    value={codCalle}
                    onChange={selectCalle}
                    options={calles}
                    loading={loadingCalles || isResolving}
                    disabled={loadingCalles || isResolving}
                    stepStatus={
                        codLinea && !codCalle ? "active" : codCalle ? "completed" : "idle"
                    }
                    required
                />
            ) : null}

            {codCalle || isResolving ? (
                <StepField
                    className="motion-step"
                    labelId={labelInter}
                    stepNumber={3}
                    stepText="INTERSECCIÓN"
                    placeholder="Elegí la esquina"
                    value={codInterseccion}
                    onChange={selectInterseccion}
                    options={interOptions}
                    loading={loadingInter || isResolving}
                    disabled={loadingInter || isResolving}
                    stepStatus={
                        codCalle && !codInterseccion
                            ? "active"
                            : codInterseccion
                              ? "completed"
                              : "idle"
                    }
                    required
                />
            ) : null}

            {(codInterseccion || isResolving) && (destinoOptions.length > 0 || isResolving) ? (
                <StepField
                    className="motion-step"
                    labelId={labelDestino}
                    stepNumber={4}
                    stepText="PARADA"
                    placeholder="Seleccionar parada"
                    value={paradaId}
                    onChange={selectParada}
                    options={destinoOptions}
                    loading={isResolving}
                    disabled={isResolving}
                    stepStatus={
                        codInterseccion && !paradaId
                            ? "active"
                            : paradaId
                              ? "completed"
                              : "idle"
                    }
                    required
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
                    stepStatus={
                        paradaId && selectedRamal === "TODOS" ? "active" : "idle"
                    }
                    description="Opcional: filtrar por ramal"
                />
            ) : null}

            {paradaId ? (
                <div className="motion-step mt-2 px-1">
                    <Button
                        type="button"
                        onClick={consultar}
                        disabled={loadingArribos}
                        variant="primary"
                        size="lg"
                        className="w-full h-14 rounded-3xl text-lg font-bold shadow-lg"
                    >
                        {loadingArribos ? "CONSULTANDO..." : "VER CUANDO LLEGA"}
                    </Button>
                </div>
            ) : null}

            <ErrorBanner message={!isConsulting ? error : ""} onClose={() => setError("")} />
        </div>
    );
});
