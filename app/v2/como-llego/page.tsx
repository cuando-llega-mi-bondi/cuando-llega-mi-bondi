"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useGeolocation } from "../_components/useGeolocation";
import {
  FEATURED_PLACES,
  searchPlaces,
  type Place,
} from "@/lib/static/places";
import {
  findBestRoute,
  findRoutes,
  type Itinerary,
  type MultiLineItinerary,
} from "@/lib/v2/route-finder";
import { PinPickerMap } from "./_components/PinPickerMap";

type Destino = {
  label: string;
  hint?: string;
  lat: number;
  lng: number;
  source: "place" | "pin";
};

type ManualOrigen = { lat: number; lng: number };

type OrigenEfectivo =
  | { source: "gps"; coords: { lat: number; lng: number }; accuracyMts: number }
  | { source: "manual"; coords: { lat: number; lng: number } }
  | null;

type PinPurpose = "origen" | "destino";

function placeToDestino(p: Place): Destino {
  return {
    label: p.name,
    hint: p.hint,
    lat: p.lat,
    lng: p.lng,
    source: "place",
  };
}

export default function ComoLlegoPage() {
  const geo = useGeolocation();
  const [destinoQuery, setDestinoQuery] = useState("");
  const [destino, setDestino] = useState<Destino | null>(null);
  const [manualOrigen, setManualOrigen] = useState<ManualOrigen | null>(null);
  const [pinPurpose, setPinPurpose] = useState<PinPurpose | null>(null);

  // Manual gana sobre GPS — si el user marcó un punto, lo respetamos.
  const origen: OrigenEfectivo = manualOrigen
    ? { source: "manual", coords: manualOrigen }
    : geo.status === "granted"
      ? { source: "gps", coords: geo.coords, accuracyMts: geo.accuracyMts }
      : null;

  const candidates = useMemo<Place[]>(() => {
    return searchPlaces(destinoQuery, 8);
  }, [destinoQuery]);

  const itineraries = useMemo<Itinerary[]>(() => {
    if (!origen || !destino) return [];
    return findRoutes(
      origen.coords,
      { lat: destino.lat, lng: destino.lng },
      { radiusMts: 500 },
    );
  }, [origen, destino]);

  const bestMultiLine = useMemo<MultiLineItinerary | null>(() => {
    if (!origen || !destino) return null;
    return findBestRoute(
      origen.coords,
      { lat: destino.lat, lng: destino.lng },
      { radiusMts: 500 },
    );
  }, [origen, destino]);

  // Mostramos la opción con transbordo solo si:
  //  - no hay ninguna directa, o
  //  - aporta valor (al menos 1 transbordo y mejora notablemente el tiempo)
  const showTransfer = useMemo(() => {
    if (!bestMultiLine) return false;
    if (itineraries.length === 0) return true;
    if (bestMultiLine.transfers === 0) return false;
    const bestDirect = itineraries[0];
    return bestMultiLine.totalMin + 4 < bestDirect.estTotalMin;
  }, [bestMultiLine, itineraries]);

  return (
    <div className="space-y-5">
      <header className="px-5 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-[#0F1115]">
          Cómo llego
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-[#6B7080]">
          Tu ubicación + adónde querés ir. Te decimos qué línea conviene.
        </p>
      </header>

      <div className="px-5">
        <div className="rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow">
          <OriginRow
            geo={geo}
            origen={origen}
            onPickManual={() => setPinPurpose("origen")}
            onClearManual={() => setManualOrigen(null)}
          />
          <div className="mx-4 h-3 border-l-2 border-dashed border-[#E8E2D2]" />
          <DestinoRow
            destino={destino}
            query={destinoQuery}
            setQuery={setDestinoQuery}
            onClear={() => {
              setDestino(null);
              setDestinoQuery("");
            }}
          />
        </div>

        {!destino ? (
          <div className="mt-3 space-y-3">
            {destinoQuery.trim().length >= 2 ? (
              <div className="overflow-hidden rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow">
                {candidates.length === 0 ? (
                  <p className="px-4 py-3 font-mono text-[12px] text-[#6B7080]">
                    Sin resultados. Probá con otro nombre o usá el mapa.
                  </p>
                ) : (
                  candidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setDestino(placeToDestino(p));
                        setDestinoQuery("");
                      }}
                      className="flex w-full items-center gap-3 border-b border-[#F1ECDD] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAF7F0]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFD60A] text-[#0F1115]">
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                          <path
                            d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[13.5px] font-semibold text-[#0F1115]">
                          {p.name}
                        </p>
                        {p.hint ? (
                          <p className="truncate font-mono text-[10.5px] text-[#6B7080]">
                            {p.hint}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                  Sugerencias
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEATURED_PLACES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDestino(placeToDestino(p))}
                      className="rounded-full border border-[#E8E2D2] bg-white px-3 py-1.5 font-mono text-[12px] text-[#0F1115] transition hover:border-[#0099FF] hover:text-[#0099FF]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setPinPurpose("destino")}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#0099FF]/40 bg-[#EAF6FF] px-4 py-3 text-left transition hover:bg-[#D7EDFF]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0099FF] text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-semibold text-[#0F1115]">
                  Marcar en el mapa
                </p>
                <p className="font-mono text-[11px] text-[#6B7080]">
                  Tocá un punto exacto si no encontrás el lugar.
                </p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#0099FF]">
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {destino && origen ? (
        <ItinerariesList
          itineraries={itineraries}
          multiLine={showTransfer ? bestMultiLine : null}
        />
      ) : null}

      {destino && !origen ? (
        <div className="px-5">
          <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-5 text-center">
            <p className="font-display text-[15px] font-semibold text-[#0F1115]">
              Necesitamos un punto de partida
            </p>
            <p className="mt-1 font-mono text-[11px] text-[#6B7080]">
              Activá el GPS o marcá tu origen en el mapa.
            </p>
            <button
              type="button"
              onClick={() => setPinPurpose("origen")}
              className="mt-3 rounded-2xl bg-[#0099FF] px-4 py-2 font-display text-[13px] font-semibold text-white"
            >
              Marcar en el mapa
            </button>
          </div>
        </div>
      ) : null}

      {pinPurpose ? (
        <PinPickerMap
          initial={
            pinPurpose === "destino"
              ? destino && destino.source === "pin"
                ? { lat: destino.lat, lng: destino.lng }
                : null
              : manualOrigen
          }
          onCancel={() => setPinPurpose(null)}
          onConfirm={({ lat, lng }) => {
            if (pinPurpose === "destino") {
              setDestino({
                label: "Punto en el mapa",
                hint: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                lat,
                lng,
                source: "pin",
              });
              setDestinoQuery("");
            } else {
              setManualOrigen({ lat, lng });
            }
            setPinPurpose(null);
          }}
        />
      ) : null}
    </div>
  );
}

function OriginRow({
  geo,
  origen,
  onPickManual,
  onClearManual,
}: {
  geo: ReturnType<typeof useGeolocation>;
  origen: OrigenEfectivo;
  onPickManual: () => void;
  onClearManual: () => void;
}) {
  const isManual = origen?.source === "manual";
  const gpsBusy = geo.status === "requesting" || geo.status === "idle";
  const noGps = geo.status === "denied" || geo.status === "unavailable";

  let label = "";
  if (isManual && origen) {
    label = `Punto en el mapa · ${origen.coords.lat.toFixed(4)}, ${origen.coords.lng.toFixed(4)}`;
  } else if (origen?.source === "gps") {
    label = `Tu ubicación · ± ${origen.accuracyMts} m`;
  } else if (gpsBusy) {
    label = "Buscando tu ubicación…";
  } else if (noGps) {
    label = geo.status === "denied" ? "GPS desactivado" : "GPS no disponible";
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${
          isManual ? "bg-[#FFD60A] text-[#0F1115]" : "bg-[#0099FF]"
        }`}
      >
        {isManual ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B7080]">
          Desde {isManual ? "· marcado en mapa" : null}
        </p>
        <p className="truncate font-display text-[15px] font-semibold leading-tight text-[#0F1115]">
          {label}
        </p>
        {(noGps || isManual) && !gpsBusy ? (
          <button
            type="button"
            onClick={isManual ? onClearManual : onPickManual}
            className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#0099FF] hover:underline"
          >
            {isManual ? "Volver a usar GPS" : "Marcar en el mapa"}
          </button>
        ) : null}
      </div>
      {origen?.source === "gps" && !isManual ? (
        <button
          type="button"
          onClick={onPickManual}
          className="grid h-7 w-7 place-items-center rounded-full bg-[#FAF7F0] text-[#6B7080] hover:bg-[#0F1115] hover:text-white"
          aria-label="Marcar otro origen"
          title="Marcar otro origen en el mapa"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function DestinoRow({
  destino,
  query,
  setQuery,
  onClear,
}: {
  destino: Destino | null;
  query: string;
  setQuery: (q: string) => void;
  onClear: () => void;
}) {
  if (destino) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFD60A] text-[#0F1115]">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B7080]">
            Hacia {destino.source === "pin" ? "· punto en mapa" : null}
          </p>
          <p className="truncate font-display text-[15px] font-semibold leading-tight text-[#0099FF]">
            {destino.label}
          </p>
          {destino.hint ? (
            <p className="truncate font-mono text-[10.5px] text-[#6B7080]">
              {destino.hint}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="grid h-7 w-7 place-items-center rounded-full bg-[#FAF7F0] text-[#6B7080] hover:bg-[#0F1115] hover:text-white"
          aria-label="Cambiar destino"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFD60A] text-[#0F1115]">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B7080]">
          Hacia
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ej. "Catedral", "Terminal", "Playa Grande"'
          className="w-full bg-transparent font-display text-[15px] font-medium text-[#0F1115] outline-none placeholder:text-[#6B7080]/70"
        />
      </div>
    </div>
  );
}

function ItinerariesList({
  itineraries,
  multiLine,
}: {
  itineraries: Itinerary[];
  multiLine: MultiLineItinerary | null;
}) {
  if (itineraries.length === 0 && !multiLine) {
    return (
      <div className="px-5">
        <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-5 text-center">
          <p className="font-display text-[15px] font-semibold text-[#0F1115]">
            No encontramos una combinación viable.
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#6B7080]">
            Probá con un destino más cerca de una parada.
          </p>
        </div>
      </div>
    );
  }

  const total = itineraries.length + (multiLine ? 1 : 0);
  return (
    <div className="px-5">
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
        {total} {total === 1 ? "opción" : "opciones"} ordenadas por tiempo
      </p>
      <div className="space-y-3">
        {itineraries.map((it, i) => (
          <ItineraryCard key={`${it.line.descripcion}-${it.bandera}`} it={it} index={i} />
        ))}
        {multiLine ? (
          <MultiLineCard ml={multiLine} index={itineraries.length} />
        ) : null}
      </div>
    </div>
  );
}

function ItineraryCard({ it, index }: { it: Itinerary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="overflow-hidden rounded-3xl border border-[#E8E2D2] bg-white v2-card-shadow"
    >
      <div className="flex items-end justify-between gap-3 bg-[#0F1115] p-4 text-white">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            Tiempo total
          </p>
          <p className="mt-0.5 font-display text-[40px] font-semibold leading-none">
            {it.estTotalMin}
            <span className="ml-1 text-[14px] font-medium text-white/60">min</span>
          </p>
        </div>
        <Link
          href={`/v2/linea/${it.line.descripcion}`}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFD60A] font-display text-[15px] font-bold text-[#0F1115] transition hover:bg-white"
        >
          {it.line.descripcion}
        </Link>
      </div>

      <div className="space-y-2 p-4">
        <Step
          icon="walk"
          title={`Caminá ${it.estWalkMin > 0 ? Math.round(it.walkToBoardMts / 83) : 0} min`}
          subtitle={`${it.walkToBoardMts} m hasta la parada`}
          highlight={it.boardStop.nombre}
        />
        <Step
          icon="bus"
          title={`${it.line.descripcion} · ${it.bandera}`}
          subtitle={
            it.busStopCount > 0
              ? `~${it.estBusMin} min · ${it.busStopCount} paradas`
              : `~${it.estBusMin} min`
          }
          highlight={`Bajás en ${it.alightStop.nombre}`}
        />
        <Step
          icon="walk"
          title={`Caminá ${Math.round(it.walkFromAlightMts / 83)} min`}
          subtitle={`${it.walkFromAlightMts} m hasta el destino`}
        />
      </div>
    </motion.div>
  );
}

function MultiLineCard({ ml, index }: { ml: MultiLineItinerary; index: number }) {
  const busLines = ml.segments
    .filter((s): s is Extract<typeof s, { type: "bus" }> => s.type === "bus")
    .map((s) => s.line);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="overflow-hidden rounded-3xl border border-[#E8E2D2] bg-white v2-card-shadow"
    >
      <div className="flex items-end justify-between gap-3 bg-[#0F1115] p-4 text-white">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            Con {ml.transfers} {ml.transfers === 1 ? "transbordo" : "transbordos"} ·
            tiempo total
          </p>
          <p className="mt-0.5 font-display text-[40px] font-semibold leading-none">
            {ml.totalMin}
            <span className="ml-1 text-[14px] font-medium text-white/60">min</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {busLines.map((l, i) => (
            <Link
              key={`${l}-${i}`}
              href={`/v2/linea/${l}`}
              className="grid h-12 min-w-12 place-items-center rounded-2xl bg-[#FFD60A] px-2 font-display text-[14px] font-bold text-[#0F1115] transition hover:bg-white"
            >
              {l}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2 p-4">
        {ml.segments.map((seg, i) => {
          if (seg.type === "walk") {
            const isInitial = i === 0;
            return (
              <Step
                key={`walk-${i}`}
                icon="walk"
                title={`Caminá ${Math.max(1, Math.round(seg.min))} min`}
                subtitle={`${seg.mts} m ${isInitial ? "hasta la parada" : "hasta el destino"}`}
                highlight={isInitial ? seg.toStop?.nombre : undefined}
              />
            );
          }
          if (seg.type === "bus") {
            return (
              <Step
                key={`bus-${i}`}
                icon="bus"
                title={`${seg.line} · ${seg.bandera}`}
                subtitle={
                  seg.stops > 0
                    ? `~${Math.round(seg.min)} min · ${seg.stops} ${seg.stops === 1 ? "parada" : "paradas"}`
                    : `~${Math.round(seg.min)} min`
                }
                highlight={`Bajás en ${seg.toStop.nombre}`}
              />
            );
          }
          return (
            <Step
              key={`tr-${i}`}
              icon="walk"
              title={`Transbordo · ${Math.max(1, Math.round(seg.min))} min`}
              subtitle={`${seg.mts} m hasta la próxima parada`}
              highlight={seg.toStop.nombre}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

function Step({
  icon,
  title,
  subtitle,
  highlight,
}: {
  icon: "walk" | "bus";
  title: string;
  subtitle: string;
  highlight?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${icon === "walk" ? "bg-[#FAF7F0] text-[#0F1115]" : "bg-[#FFD60A] text-[#0F1115]"}`}
      >
        {icon === "walk" ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M13 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-2 7-3 3 1 5-2 4m6-12 2 4 4 2-3 5 1 4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5M5 11h14M5 11v6a2 2 0 0 0 2 2v1m12-9v6a2 2 0 0 1-2 2v1M9 19h6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-semibold text-[#0F1115]">{title}</p>
        <p className="font-mono text-[11px] text-[#6B7080]">{subtitle}</p>
        {highlight ? (
          <p className="mt-0.5 truncate font-display text-[12.5px] text-[#0099FF]">
            {highlight}
          </p>
        ) : null}
      </div>
    </div>
  );
}
