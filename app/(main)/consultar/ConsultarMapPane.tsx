"use client";

import dynamic from "next/dynamic";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useArrivalsSession } from "@features/arrivals/context/ArrivalsSessionContext";
import { ArrivalsDockedPanel } from "@features/arrivals/components/ArrivalsDockedPanel";

const BusMap = dynamic(() => import("@shared/map/BusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
});

/** Mismo centro que ComoLlegoMap: Mar del Plata. */
const MDP_CENTER: [number, number] = [-38.0, -57.55];

/**
 * Columna derecha de /consultar en desktop: mapa siempre visible (centrado en
 * MDP antes de consultar, con preview del recorrido al elegir línea) y panel
 * de arribos dockeado adentro al consultar — el formulario queda usable.
 */
export function ConsultarMapPane() {
  const isDesktop = useIsDesktop();
  const { session, closeConsult } = useArrivalsSession();

  // En mobile este pane no existe (la consulta abre el bottom-sheet global);
  // devolver null acá evita que Leaflet siquiera se descargue.
  if (!isDesktop) return null;

  const { consult, arrivals, telegramUsername } = session;
  const {
    codLinea,
    selectedRamal,
    selectedParada,
    paradaBanderaAbrevs,
    isConsulting,
  } = consult;
  const { displayArribos } = arrivals;

  return (
    <div className="relative h-full w-full">
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
        fallbackCenter={MDP_CENTER}
        fallbackZoom={13}
        controlsClassName={isConsulting ? "lg:right-[416px]" : ""}
      />

      {isConsulting ? (
        <ArrivalsDockedPanel
          consult={consult}
          arrivals={arrivals}
          telegramUsername={telegramUsername}
          onClose={closeConsult}
          className="absolute right-0 top-0 z-10 h-full w-[400px]"
        />
      ) : (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 w-full max-w-sm -translate-x-1/2 px-4">
          <div className="rounded-2xl border border-border bg-background/95 p-4 text-center shadow-2xl backdrop-blur">
            <p className="font-display text-sm font-bold tracking-tight">
              ¿Cuándo llega tu bondi?
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              Elegí línea, calle e intersección y tocá{" "}
              <span className="font-bold text-foreground">VER CUANDO LLEGA</span>{" "}
              para ver los micros acá en el mapa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
