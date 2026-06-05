"use client";

import { IconRefresh } from "@shared/icons/IconRefresh";
import { IconStar } from "@shared/icons/IconStar";
import { ArriboCard } from "@features/arrivals/components/ArriboCard";
import { OtrasLineasSuggestion } from "@features/arrivals/components/OtrasLineasSuggestion";
import { ShareButton } from "@shared/layout/ShareButton";
import { cn } from "@shared/utils";
import {
    resolveArrivalsPanelView,
    type ArrivalsDataSession,
    type ArrivalsConsultSession,
} from "@features/arrivals/types/arrivalsSession";
import { ArrivalsEmpty } from "./ArrivalsEmpty";
import { ArrivalsLoading } from "./ArrivalsLoading";
import { LiveSharingBanner } from "./LiveSharingBanner";

interface ArrivalsPanelProps {
    consult: Pick<
        ArrivalsConsultSession,
        "isConsulting" | "selectedRamal" | "setSelectedRamal" | "paradaId"
    >;
    arrivals: ArrivalsDataSession;
}

export function ArrivalsPanel({ consult, arrivals }: ArrivalsPanelProps) {
    const {
        isConsulting,
        selectedRamal,
        setSelectedRamal,
        paradaId,
    } = consult;
    const {
        displayArribos,
        loadingArribos,
        lastUpdate,
        fetchArribos,
        calleLabel,
        interseccionLabel,
        liveSharings,
        handleToggleFavCurrent,
        isCurrentFavorito,
        otrasLineas,
        loadingOtras,
        onSelectOtraLinea,
    } = arrivals;

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
    });

    if (view === "hidden") return null;

    return (
        <div className="mt-3">
            <div className="mb-2.5 flex items-center justify-between">
                <label className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
                    PRÓXIMOS ARRIBOS
                </label>
                <div className="flex items-center gap-2">
                    {lastUpdate ? (
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {lastUpdate.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
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
                        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-card p-0 text-muted-foreground transition-colors hover:border-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <IconRefresh loading={loadingArribos} />
                    </button>
                </div>
            </div>

            {view === "loading" ? (
                <ArrivalsLoading />
            ) : view === "empty" ? (
                <ArrivalsEmpty
                    mode={isConsulting ? "no-data" : "prompt"}
                    loadingArribos={loadingArribos}
                    selectedRamal={selectedRamal}
                    onRetry={fetchArribos}
                    onResetRamal={() => setSelectedRamal("TODOS")}
                />
            ) : (
                <div className="flex flex-col gap-2">
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

            {isConsulting && !loadingArribos ? (
                <div className="mt-6 flex flex-col gap-4">
                    <button
                        onClick={handleToggleFavCurrent}
                        className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-sans text-[15px] font-bold transition-all active:scale-[0.98]",
                            isCurrentFavorito 
                                ? "bg-secondary/10 text-secondary border border-secondary/20"
                                : "bg-card border border-border text-foreground hover:bg-muted/50"
                        )}
                    >
                        <IconStar filled={isCurrentFavorito} />
                        {isCurrentFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
                    </button>
                    <div className="text-center font-mono text-[10px] text-muted-foreground">
                        Actualización automática cada 30s
                    </div>
                </div>
            ) : null}
        </div>
    );
}
