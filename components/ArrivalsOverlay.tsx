"use client";

import dynamic from "next/dynamic";
import { Sheet } from "react-modal-sheet";
import type { Arribo, Linea, Parada } from "@/lib/types";
import { ArrivalsPanel, ErrorBanner, TelegramShareCTA } from "@/components/search";

const BusMap = dynamic(() => import("@/components/map/BusMap"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-muted" />
        ),
});

type LiveSharing = { lat: number; lng: number; ramal: string | null };

interface ArrivalsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    codLinea: string;
    paradaId: string;
    selectedRamal: string;
    setSelectedRamal: (value: string) => void;
    isConsulting: boolean;
    loadingArribos: boolean;
    displayArribos: Arribo[];
    selectedParada?: Parada;
    lastUpdate: Date | null;
    fetchArribos: () => void;
    calleLabel?: string;
    interseccionLabel?: string;
    handleFavFromArribos: (arribo: Arribo) => void;
    otrasLineas?: Linea[];
    loadingOtras?: boolean;
    onSelectOtraLinea?: (linea: Linea) => void;
    liveSharings?: LiveSharing[];
    telegramUsername?: string;
    error: string;
    setError: (value: string) => void;
}

const IconClose = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

export function ArrivalsOverlay({
    isOpen,
    onClose,
    codLinea,
    paradaId,
    selectedRamal,
    setSelectedRamal,
    isConsulting,
    loadingArribos,
    displayArribos,
    selectedParada,
    lastUpdate,
    fetchArribos,
    calleLabel,
    interseccionLabel,
    handleFavFromArribos,
    otrasLineas = [],
    loadingOtras = false,
    onSelectOtraLinea,
    liveSharings = [],
    telegramUsername = "",
    error,
    setError,
}: ArrivalsOverlayProps) {
    return (
        <>
        <div className="arrivals-overlay fixed inset-0 z-90 bg-background">
            <div className="absolute inset-0">
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
                    fillParent
                />
            </div>

            <Sheet
                isOpen={isOpen}
                onClose={onClose}
                snapPoints={[0, 0.12, 0.5, 1]}
                initialSnap={2}
                disableDismiss
                disableScrollLocking
            >
                <Sheet.Container>
                    <Sheet.Header />
                    <Sheet.Content>
                        <div className="flex flex-col gap-3 px-5 pb-sheet-over-nav">
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
                                    paradaId={paradaId}
                                    liveSharings={liveSharings}
                                    handleFavFromArribos={handleFavFromArribos}
                                    otrasLineas={otrasLineas}
                                    loadingOtras={loadingOtras}
                                    onSelectOtraLinea={onSelectOtraLinea}
                                />
                            ) : null}
                            <ErrorBanner
                                message={isConsulting ? error : ""}
                                onClose={() => setError("")}
                            />
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
                <Sheet.Backdrop />
            </Sheet>
        </div>

        <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de arribos"
            className="fixed right-4 top-[max(var(--safe-top),1rem)] z-10001 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-secondary hover:text-secondary"
        >
            <IconClose />
        </button>
        </>
    );
}
