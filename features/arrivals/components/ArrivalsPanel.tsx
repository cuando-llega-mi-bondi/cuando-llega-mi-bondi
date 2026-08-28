"use client";

import { IconRefresh } from "@shared/icons/IconRefresh";
import { IconHeart } from "@shared/icons/IconHeart";
import { ArriboCard } from "@features/arrivals/components/ArriboCard";
import { OtrasLineasSuggestion } from "@features/arrivals/components/OtrasLineasSuggestion";
import { ShareButton } from "@shared/layout/ShareButton";
import { IconButton } from "@shared/ui/IconButton";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useUIStore } from "@shared/ui/store/useUIStore";
import { cn } from "@shared/utils";
import {
    resolveArrivalsPanelView,
    type ArrivalsDataSession,
    type ArrivalsConsultSession,
} from "@features/arrivals/types/arrivalsSession";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrivalsEmpty } from "./ArrivalsEmpty";
import { ArrivalsLoading } from "./ArrivalsLoading";
import { LiveSharingBanner } from "./LiveSharingBanner";

interface ArrivalsPanelProps {
    consult: Pick<
        ArrivalsConsultSession,
        | "isConsulting"
        | "selectedRamal"
        | "setSelectedRamal"
        | "paradaId"
        | "codLinea"
        | "lineaLabel"
        | "calleLabel"
        | "interseccionLabel"
        | "selectedParada"
    >;
    arrivals: ArrivalsDataSession;
}

/** Umbral para marcar la última actualización como "vieja". */
const STALE_AFTER_MS = 120_000;

function formatRelative(ms: number): string {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 10) return "recién";
    if (s < 60) return `hace ${s} s`;
    const m = Math.round(s / 60);
    return `hace ${m} min`;
}

export function ArrivalsPanel({ consult, arrivals }: ArrivalsPanelProps) {
    const {
        isConsulting,
        selectedRamal,
        setSelectedRamal,
        paradaId,
        codLinea,
        lineaLabel,
        calleLabel,
        interseccionLabel,
        selectedParada,
    } = consult;
    const {
        displayArribos,
        loadingArribos,
        lastUpdate,
        fetchArribos,
        calleLabel: arrivalsCalleLabel,
        interseccionLabel: arrivalsInterseccionLabel,
        liveSharings,
        otrasLineas,
        loadingOtras,
        onSelectOtraLinea,
        errorInfo,
        retryAt,
        isStale: isStaleFromProxy,
    } = arrivals;

    const { favoritos, removeFavorito } = useFavoritos();
    const setNamingModal = useUIStore((s) => s.setNamingModal);

    const isCurrentFavorito = useMemo(() => {
        const targetId = `${paradaId}_${codLinea}`;
        return favoritos.some((f) => f.id === targetId);
    }, [favoritos, paradaId, codLinea]);

    const handleToggleFavCurrent = useCallback(() => {
        const id = `${paradaId}_${codLinea}`;
        if (isCurrentFavorito) {
            removeFavorito(id);
            return;
        }

        const lineaPart = lineaLabel?.trim() || codLinea || "";
        const banderaPart = selectedParada?.AbreviaturaBandera?.trim() || "";
        const ubicacion = [calleLabel, interseccionLabel].filter(Boolean).join(" y ");

        let nombre = "";
        if (lineaPart && banderaPart) nombre = `${lineaPart} — ${banderaPart}`;
        else if (lineaPart) nombre = lineaPart;
        else if (banderaPart) nombre = banderaPart;
        else if (ubicacion) nombre = ubicacion;
        else nombre = "Parada favorita";

        setNamingModal({
            open: true,
            mode: "add",
            fav: {
                id,
                nombre,
                identificadorParada: paradaId,
                codigoLineaParada: codLinea,
                lineaLabel: lineaLabel?.trim() || lineaPart || codLinea || undefined,
                descripcionLinea: lineaPart || "—",
                descripcionBandera: banderaPart || "—",
                calleLabel,
                interseccionLabel,
            },
        });
    }, [
        codLinea,
        paradaId,
        isCurrentFavorito,
        removeFavorito,
        lineaLabel,
        selectedParada,
        calleLabel,
        interseccionLabel,
        setNamingModal,
    ]);

    // Tick de 10s para mantener fresco el "actualizado hace X".
    const [nowTick, setNowTick] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 10_000);
        return () => clearInterval(id);
    }, []);

    const elapsedMs = lastUpdate ? nowTick - lastUpdate.getTime() : null;
    // Señal real del proxy (X-Cache: STALE) + heurística de tiempo local como
    // respaldo (ej. la pestaña estuvo en background y el polling no corrió).
    const isStale = isStaleFromProxy || (elapsedMs !== null && elapsedMs > STALE_AFTER_MS);

    const hasArribos = displayArribos.length > 0;
    const hasLiveSharings = liveSharings.length > 0;
    const showOtrasLineas =
        Boolean(onSelectOtraLinea) &&
        (otrasLineas.length > 0 || loadingOtras);

    const view = resolveArrivalsPanelView({
        loadingArribos,
        hasArribos,
        hasLiveSharings,
        isConsulting,
        hasErrored: errorInfo !== null,
    });

    if (view === "hidden") return null;

    return (
        <div className="mt-3">
            <div className="mb-2.5 flex items-center justify-between">
                <label className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
                    PRÓXIMOS ARRIBOS
                </label>
                <div className="flex items-center gap-2">
                    {elapsedMs !== null ? (
                        <span
                            className={cn(
                                "font-mono text-[10px]",
                                isStale ? "font-semibold text-amarillo" : "text-muted-foreground",
                            )}
                            title={
                                errorInfo && view === "list"
                                    ? `${errorInfo.title}: ${errorInfo.message}`
                                    : lastUpdate?.toLocaleTimeString("es-AR")
                            }
                        >
                            {isStale
                                ? `Última info ${formatRelative(elapsedMs)}`
                                : formatRelative(elapsedMs)}
                        </span>
                    ) : null}
                    {isConsulting && (
                        <IconButton
                            onClick={handleToggleFavCurrent}
                            aria-label={isCurrentFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
                            aria-pressed={isCurrentFavorito}
                            title={isCurrentFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
                            tone={isCurrentFavorito ? "active" : "default"}
                        >
                            <IconHeart filled={isCurrentFavorito} width={16} height={16} />
                        </IconButton>
                    )}
                    <ShareButton
                        arribos={displayArribos}
                        calleLabel={arrivalsCalleLabel}
                        interseccionLabel={arrivalsInterseccionLabel}
                    />
                    <IconButton
                        onClick={fetchArribos}
                        disabled={loadingArribos}
                        aria-label="Actualizar arribos"
                    >
                        <IconRefresh loading={loadingArribos} />
                    </IconButton>
                </div>
            </div>

            {isConsulting && !loadingArribos ? (
                <p className="-mt-1.5 mb-2.5 font-mono text-[10px] text-muted-foreground">
                    Actualización automática cada 25 s
                </p>
            ) : null}

            {view === "loading" ? (
                <ArrivalsLoading />
            ) : view === "empty" ? (
                <ArrivalsEmpty
                    mode={isConsulting ? "no-data" : "prompt"}
                    errorInfo={isConsulting ? errorInfo : null}
                    retryAt={retryAt}
                    loadingArribos={loadingArribos}
                    selectedRamal={selectedRamal}
                    onRetry={fetchArribos}
                    onResetRamal={() => setSelectedRamal("TODOS")}
                />
            ) : (
                <div className="flex flex-col gap-3">
                    <LiveSharingBanner count={liveSharings.length} />
                    {hasArribos ? (
                        displayArribos.map((a, i) => (
                            <ArriboCard
                                key={`${a.CodigoLineaParada}-${a.Arribo}-${i}`}
                                arribo={a}
                            />
                        ))
                    ) : (
                        <div className="rounded-[10px] border border-success/35 bg-success/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                            Sin datos de arribos de la municipalidad en este momento. Igual podés ver
                            ubicaciones compartidas en tiempo real en el mapa.
                        </div>
                    )}
                </div>
            )}

            {showOtrasLineas && onSelectOtraLinea ? (
                <div className="mt-3">
                    <OtrasLineasSuggestion
                        lineas={otrasLineas}
                        loading={loadingOtras}
                        onSelect={onSelectOtraLinea}
                    />
                </div>
            ) : null}
        </div>
    );
}
