"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { motion, useTransform, useReducedMotion } from "motion/react";
import { IconX } from "@shared/icons/IconX";
import type { ArrivalsOverlaySession } from "@features/arrivals/types/arrivalsSession";
import { resolveArrivalsPanelView } from "@features/arrivals/types/arrivalsSession";
import { ArrivalsPanel } from "./ArrivalsPanel";
import { ErrorBanner } from "@features/search/components/ErrorBanner";
import { TelegramShareCTA } from "@features/search/components/TelegramShareCTA";
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

/** Badge de línea + calle/intersección + CTA de Telegram (compartido sheet/panel). */
function OverlayHeaderInfo({
  consult,
  telegramUsername,
  action,
}: Pick<ArrivalsOverlayProps, "consult" | "telegramUsername"> & {
  /** Acción al final de la fila del título (ej: botón de cerrar en el sheet). */
  action?: React.ReactNode;
}) {
  const { codLinea, selectedRamal, lineaLabel, calleLabel, interseccionLabel } =
    consult;

  return (
    <>
      <div className="mb-4 flex items-start gap-3">
        {lineaLabel && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {lineaLabel}
          </div>
        )}
        <div className="min-w-0 flex-1">
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
        {action}
      </div>
      <TelegramShareCTA
        codLinea={codLinea}
        selectedRamal={selectedRamal}
        telegramUsername={telegramUsername}
      />
    </>
  );
}

/** Cuerpo con arribos + errores (compartido sheet/panel). */
function OverlayBody({
  consult,
  arrivals,
}: Pick<ArrivalsOverlayProps, "consult" | "arrivals">) {
  const { isConsulting, error, setError } = consult;
  const { displayArribos, loadingArribos } = arrivals;

  const panelView = resolveArrivalsPanelView({
    loadingArribos,
    hasArribos: displayArribos.length > 0,
    hasLiveSharings: arrivals.liveSharings.length > 0,
    isConsulting,
  });

  return (
    <div className="flex flex-col gap-3 pb-5">
      {panelView !== "hidden" ? (
        <ArrivalsPanel consult={consult} arrivals={arrivals} />
      ) : null}
      <ErrorBanner
        message={isConsulting ? error : ""}
        onClose={() => setError("")}
      />
    </div>
  );
}

export function ArrivalsOverlay({
  isOpen,
  onClose,
  consult,
  arrivals,
  telegramUsername,
}: ArrivalsOverlayProps) {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
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
          <motion.aside
            initial={reduceMotion ? false : { x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 top-0 z-10 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-2xl"
            aria-label="Panel de arribos"
          >
            <div className="shrink-0 border-b border-border px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <OverlayHeaderInfo
                    consult={consult}
                    telegramUsername={telegramUsername}
                  />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar panel de arribos"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:border-secondary hover:text-secondary"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4">
              <OverlayBody consult={consult} arrivals={arrivals} />
            </div>
          </motion.aside>
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
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar panel de arribos"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:border-secondary hover:text-secondary"
                  >
                    <IconX size={18} />
                  </button>
                }
              />
            </Sheet.Header>

            <Sheet.Content
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
