"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { useTransform } from "motion/react";
import type { Arribo, Linea, Parada } from "@/lib/types";
import {
  ArrivalsPanel,
  ErrorBanner,
  TelegramShareCTA,
} from "@/components/search";

const BusMap = dynamic(() => import("@/components/map/BusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
});

type LiveSharing = { lat: number; lng: number; ramal: string | null };

interface ArrivalsOverlayProps {
  // ... tus props se mantienen igual ...
  lineaLabel: string;
  isOpen: boolean;
  onClose: () => void;
  codLinea: string;
  paradaId: string;
  selectedRamal: string;
  setSelectedRamal: (value: string) => void;
  isConsulting: boolean;
  loadingArribos: boolean;
  displayArribos: Arribo[];
  paradaBanderaAbrevs: string[];
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
  lineaLabel,
  isOpen,
  onClose,
  codLinea,
  paradaId,
  selectedRamal,
  setSelectedRamal,
  isConsulting,
  loadingArribos,
  displayArribos,
  paradaBanderaAbrevs,
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
  const sheetRef = useRef<SheetRef>(null);

  const paddingBottom = useTransform(() => {
    return sheetRef.current?.y.get() ?? 0;
  });

  return (
    <>
      <div className="arrivals-overlay fixed inset-0 z-90 bg-background">
        <div className="absolute inset-0">
          <BusMap
            arribos={displayArribos}
            selectedRamal={selectedRamal}
            paradaBanderaAbrevs={paradaBanderaAbrevs}
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
          ref={sheetRef}
          isOpen={isOpen}
          onClose={onClose}
          snapPoints={[0, 0.18, 0.5, 1]}
          initialSnap={2}
          disableDismiss
          disableScrollLocking
          modalEffectRootId="main-layout"
        >
          <Sheet.Container className="px-5">
            <Sheet.Header>
              <div className="flex h-10 w-full items-center justify-center pt-2 pb-4">
                <Sheet.DragIndicator />
              </div>

              <div className="flex items-start gap-3 mb-4">
                {lineaLabel && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    {lineaLabel}
                  </div>
                )}
                <div className="min-w-0">
                  {calleLabel && (
                    <h2 className="font-display text-lg font-bold leading-tight tracking-tight">
                      {calleLabel}
                    </h2>
                  )}
                  {interseccionLabel && (
                    <p className="truncate text-sm text-muted-foreground">
                      y {interseccionLabel}
                    </p>
                  )}
                </div>
              </div>
              <TelegramShareCTA
                codLinea={codLinea}
                selectedRamal={selectedRamal}
                telegramUsername={telegramUsername}
              />
            </Sheet.Header>

            <Sheet.Content
              // 1. Permite arrastrar para CERRAR siempre que la lista esté arriba
              disableDrag={(state) => state.scrollPosition !== "top"}
              // 2. NUEVO: Bloquea el scroll interno a menos que el panel esté al 100% (índice 3).
              // Esto garantiza que cualquier gesto hacia arriba en los puntos 0.12 o 0.5 va a arrastrar el panel invariablemente.
              disableScroll={(state) => state.currentSnap !== 3}
              scrollStyle={{ paddingBottom }}
            >
              <div className="flex flex-col gap-3 pb-5">
                {(loadingArribos ||
                  displayArribos.length > 0 ||
                  isConsulting) && (
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
                )}
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
        className="fixed right-4 top-[max(var(--safe-top),1rem)] z-10001 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-secondary hover:text-secondary"
      >
        <IconClose />
      </button>
    </>
  );
}
