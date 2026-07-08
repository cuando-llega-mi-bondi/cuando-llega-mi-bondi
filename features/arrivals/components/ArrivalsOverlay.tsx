"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { useTransform } from "motion/react";
import { IconX } from "@shared/icons/IconX";
import type { ArrivalsOverlaySession } from "@features/arrivals/types/arrivalsSession";
import { resolveArrivalsPanelView } from "@features/arrivals/types/arrivalsSession";
import { ArrivalsPanel } from "./ArrivalsPanel";
import { ErrorBanner } from "@features/search/components/ErrorBanner";
import { TelegramShareCTA } from "@features/search/components/TelegramShareCTA";

const BusMap = dynamic(() => import("@shared/map/BusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
});

interface ArrivalsOverlayProps extends ArrivalsOverlaySession {
  isOpen: boolean;
  onClose: () => void;
}

export function ArrivalsOverlay({
  isOpen,
  onClose,
  consult,
  arrivals,
  telegramUsername,
}: ArrivalsOverlayProps) {
  const sheetRef = useRef<SheetRef>(null);
  const {
    codLinea,
    selectedRamal,
    isConsulting,
    lineaLabel,
    calleLabel,
    interseccionLabel,
    selectedParada,
    paradaBanderaAbrevs,
    error,
    setError,
  } = consult;
  const { displayArribos, loadingArribos } = arrivals;

  const paddingBottom = useTransform(() => {
    return sheetRef.current?.y.get() ?? 0;
  });

  const panelView = resolveArrivalsPanelView({
    loadingArribos,
    hasArribos: displayArribos.length > 0,
    hasLiveSharings: arrivals.liveSharings.length > 0,
    isConsulting,
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
            liveBuses={arrivals.liveSharings}
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
              disableDrag={(state) => state.scrollPosition !== "top"}
              disableScroll={(state) => state.currentSnap !== 3}
              scrollStyle={{ paddingBottom }}
            >
              <div className="flex flex-col gap-3 pb-5">
                {panelView !== "hidden" ? (
                  <ArrivalsPanel consult={consult} arrivals={arrivals} />
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
        className="fixed right-4 top-[max(var(--safe-top),1rem)] z-10001 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-secondary hover:text-secondary"
      >
        <IconX size={20} />
      </button>
    </>
  );
}
