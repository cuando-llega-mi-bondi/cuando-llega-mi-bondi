import dynamic from "next/dynamic";
import { IconRefresh } from "@/components/icons/IconRefresh";
import { ArriboCard } from "@/components/ArriboCard";
import { OtrasLineasSuggestion } from "@/components/OtrasLineasSuggestion";
import { ShareButton } from "@/components/ShareButton";
import type { Arribo, Linea, Parada } from "@/lib/types";
import { ArrivalsEmpty } from "./ArrivalsEmpty";
import { ArrivalsLoading } from "./ArrivalsLoading";
import { LiveSharingBanner } from "./LiveSharingBanner";

const BusMap = dynamic(() => import("@/components/map/BusMap"), {
    ssr: false,
    loading: () => (
        <div className="mb-4 flex h-[260px] w-full items-center justify-center rounded-xl border border-border bg-surface-2 font-mono text-[13px] text-text-dim">
            Cargando mapa...
        </div>
    ),
});

interface ArrivalsPanelProps {
    loadingArribos: boolean;
    displayArribos: Arribo[];
    isConsulting: boolean;
    lastUpdate: Date | null;
    fetchArribos: () => void;
    calleLabel?: string;
    interseccionLabel?: string;
    selectedRamal: string;
    setSelectedRamal: (value: string) => void;
    selectedParada?: Parada;
    codLinea: string;
    paradaId: string;
    liveSharings: { lat: number; lng: number; ramal: string | null }[];
    handleFavFromArribos: (arribo: Arribo) => void;
    otrasLineas?: Linea[];
    loadingOtras?: boolean;
    onSelectOtraLinea?: (linea: Linea) => void;
}

export function ArrivalsPanel({
    loadingArribos,
    displayArribos,
    isConsulting,
    lastUpdate,
    fetchArribos,
    calleLabel,
    interseccionLabel,
    selectedRamal,
    setSelectedRamal,
    selectedParada,
    codLinea,
    paradaId,
    liveSharings,
    handleFavFromArribos,
    otrasLineas = [],
    loadingOtras = false,
    onSelectOtraLinea,
}: ArrivalsPanelProps) {
    const hasArribos = displayArribos.length > 0;
    const hasLiveSharings = liveSharings.length > 0;

    return (
        <div className="mt-3">
            <div className="mb-2.5 flex items-center justify-between">
                <label className="font-mono text-[11px] tracking-[2px] text-text-dim">
                    PRÓXIMOS ARRIBOS
                </label>
                <div className="flex items-center gap-2">
                    {lastUpdate ? (
                        <span className="font-mono text-[10px] text-text-muted">
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
                        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent p-0 text-text-dim transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <IconRefresh loading={loadingArribos} />
                    </button>
                </div>
            </div>

            {loadingArribos && !hasArribos && !hasLiveSharings ? (
                <ArrivalsLoading />
            ) : !hasArribos && !hasLiveSharings ? (
                <ArrivalsEmpty
                    isConsulting={isConsulting}
                    loadingArribos={loadingArribos}
                    selectedRamal={selectedRamal}
                    onRetry={fetchArribos}
                    onResetRamal={() => setSelectedRamal("TODOS")}
                />
            ) : (
                <div className="flex flex-col gap-2">
                    <LiveSharingBanner count={liveSharings.length} />
                    <BusMap
                        arribos={displayArribos}
                        paradaLat={
                            selectedParada?.LatitudParada ||
                            displayArribos[0]?.LatitudParada ||
                            ""
                        }
                        paradaLon={
                            selectedParada?.LongitudParada ||
                            displayArribos[0]?.LongitudParada ||
                            ""
                        }
                        lineaCod={codLinea}
                        liveBuses={liveSharings}
                    />
                    {hasArribos ? (
                        displayArribos.map((a, i) => (
                            <ArriboCard
                                key={`${a.CodigoLineaParada}-${a.Arribo}-${i}`}
                                arribo={a}
                                favId={`${paradaId}_${a.CodigoLineaParada}`}
                                onFav={() => handleFavFromArribos(a)}
                            />
                        ))
                    ) : (
                        <div className="rounded-[10px] border border-success/25 bg-success/5 px-4 py-3 font-mono text-[12px] leading-relaxed text-text-dim">
                            Sin datos de arribos de la municipalidad en este momento. Igual podés ver
                            ubicaciones compartidas en tiempo real en el mapa.
                        </div>
                    )}
                    {onSelectOtraLinea && (otrasLineas.length > 0 || loadingOtras) ? (
                        <OtrasLineasSuggestion
                            lineas={otrasLineas}
                            loading={loadingOtras}
                            onSelect={onSelectOtraLinea}
                        />
                    ) : null}
                </div>
            )}

            {isConsulting && !loadingArribos ? (
                <div className="mt-2 text-center font-mono text-[10px] text-text-muted">
                    Actualización automática cada 30s
                </div>
            ) : null}
        </div>
    );
}
