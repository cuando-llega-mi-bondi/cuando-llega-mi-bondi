"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { useTransform } from "motion/react";
import { IconX } from "@shared/icons/IconX";
import { IconButton } from "@shared/ui/IconButton";
import type { ArrivalsOverlaySession } from "@features/arrivals/types/arrivalsSession";
import {
  ArrivalsDockedPanel,
  OverlayHeaderInfo,
  OverlayBody,
} from "./ArrivalsDockedPanel";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { cn } from "@shared/utils";

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
  const isDesktop = useIsDesktop();
  const sheetRef = useRef<SheetRef>(null);
  const { codLinea, selectedRamal, selectedParada, paradaBanderaAbrevs } =
    consult;
  const { displayArribos } = arrivals;

  const paddingBottom = useTransform(() => {
    return sheetRef.current?.y.get() ?? 0;
  });

  const busMap = (
    <BusMap
      arribos={displayArribos}
      selectedRamal={selectedRamal}
      paradaBanderaAbrevs={paradaBanderaAbrevs}
      paradaLat={
        selectedParada?.LatitudParada || displayArribos[0]?.LatitudParada || ""
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
  );

  /*
   * Árbol unificado: el contenedor y el div del mapa mantienen SIEMPRE la misma
   * posición para que Leaflet no se remonte al cruzar el breakpoint (remount
   * con reuso de DOM ⇒ "Map container is being reused by another instance").
   * Solo el panel (sheet mobile / aside desktop) cambia entre ramas.
   */
  return (
    <>
      <div
        className={cn(
          "arrivals-overlay fixed inset-0 z-90 bg-background",
          isDesktop && "left-60",
        )}
      >
        <div className="absolute inset-0">{busMap}</div>

        {isDesktop ? (
          /* ── Desktop: panel docked a la derecha (sin bottom-sheet) ── */
          <ArrivalsDockedPanel
            consult={consult}
            arrivals={arrivals}
            telegramUsername={telegramUsername}
            onClose={onClose}
            className="absolute right-0 top-0 z-10 h-full w-[420px] shadow-2xl"
          />
        ) : (
          /* ── Mobile: bottom-sheet draggable (comportamiento original) ── */
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
              <OverlayHeaderInfo
                consult={consult}
                telegramUsername={telegramUsername}
                action={
                  <IconButton onClick={onClose} aria-label="Cerrar panel de arribos">
                    <IconX size={16} />
                  </IconButton>
                }
              />
            </Sheet.Header>

            <Sheet.Content
              scrollClassName="no-scrollbar"
              disableDrag={(state) => state.scrollPosition !== "top"}
              disableScroll={(state) => state.currentSnap !== 3}
              scrollStyle={{ paddingBottom: paddingBottom as unknown as number }}
            >
              <OverlayBody consult={consult} arrivals={arrivals} />
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop />
        </Sheet>
        )}
      </div>
    </>
  );
}
