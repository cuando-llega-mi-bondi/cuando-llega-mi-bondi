"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getLineas, getParadasParaMapa, getRecorridoRamales } from "@/lib/api";
import { getCache, setCache } from "@/lib/storage/localCache";
import type { Linea, ParadaMapa, PuntoRecorrido, RamalData } from "@/lib/types";
import { MANUAL_LINES, MANUAL_ROUTES } from "@/lib/manualRoutes";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import {
  LineItem,
  LineSkeletons,
  MapErrorOverlay,
  MapLoadingOverlay,
} from "@/components/recorrido";
import { useFavoritos } from "@/lib/hooks";
import { BottomNav } from "@/components/BottomNav";

// Leaflet can't run on the server — dynamic import with ssr:false is mandatory
const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2.5 font-sans text-sm tracking-[-0.01em] text-text-dim">
      <span className="spin-slow inline-block h-4 w-4 rounded-full border-2 border-white/15 border-t-accent" />
      Cargando mapa…
    </div>
  ),
});

// ─── Inline icons ─────────────────────────────────────────────────────────────

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

type CachedLineas = Linea[] | { lineas?: Linea[] };
type GeoFeature = {
  geometry: {
    type: string;
    coordinates: [number, number][] | [number, number];
  };
};
type GeoJsonCollection = {
  features: GeoFeature[];
};

function normalizeRamal(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Main component ───────────────────────────────────────────────────────────

type Step = "selector" | "map";

export default function RecorridoClient() {
  const { favoritos } = useFavoritos();
  // ── Line selector state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("selector");
  const [lines, setLines] = useState<Linea[]>([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Map state ────────────────────────────────────────────────────────────────
  const [selectedLine, setSelectedLine] = useState<Linea | null>(null);
  const [ramales, setRamales] = useState<RamalData[]>([]);
  const [selectedRamal, setSelectedRamal] = useState<RamalData | null>(null);
  const [paradas, setParadas] = useState<ParadaMapa[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [rawLiveBuses, setRawLiveBuses] = useState<{ lat: number; lng: number; ramal: string | null }[]>([]);

  // Same línea, selected ramal, or legacy rows without ramal
  const liveRowsForMap = useMemo(() => {
    if (!selectedRamal?.key) return rawLiveBuses;
    const k = selectedRamal.key;
    return rawLiveBuses.filter((r) => r.ramal == null || r.ramal === k);
  }, [rawLiveBuses, selectedRamal?.key]);

  // ── Cluster nearby buses ─────────────────────────────────────────────────────
  const liveBuses = useMemo(() => {
    // Agrupa (clusteriza) ubicaciones que estén a ~100 metros a la redonda
    const THRESHOLD = 0.001;
    const clusters: {
      lat: number;
      lng: number;
      count: number;
      ramalCodes: (string | null)[];
    }[] = [];

    for (const loc of liveRowsForMap) {
      let found = false;
      for (const c of clusters) {
        const dLat = c.lat - loc.lat;
        const dLng = c.lng - loc.lng;
        if (Math.sqrt(dLat * dLat + dLng * dLng) < THRESHOLD) {
          c.lat = (c.lat * c.count + loc.lat) / (c.count + 1);
          c.lng = (c.lng * c.count + loc.lng) / (c.count + 1);
          c.count++;
          c.ramalCodes.push(loc.ramal);
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({ lat: loc.lat, lng: loc.lng, count: 1, ramalCodes: [loc.ramal] });
      }
    }
    return clusters.map((c) => {
      const set = new Set(
        c.ramalCodes.map((r) => (r === null || r === "" ? "__legacy__" : r))
      );
      return {
        lat: c.lat,
        lng: c.lng,
        count: c.count,
        ramalCode: set.size === 1 ? c.ramalCodes[0] ?? null : null,
        mixedRamales: set.size > 1,
      };
    });
  }, [liveRowsForMap]);

  // ── Load lines (with 24h cache) ──────────────────────────────────────────────
  useEffect(() => {
    const rawCache = getCache<CachedLineas>("RecuperarLineaPorCuandoLlega");
    if (rawCache) {
      const data = Array.isArray(rawCache) ? rawCache : (rawCache.lineas ?? []);
      // Ensure manual lines are present and not duplicated
      const manualCodes = new Set(MANUAL_LINES.map(m => m.CodigoLineaParada));
      const filteredCache = data.filter((l) => !manualCodes.has(l.CodigoLineaParada));
      const merged = [...filteredCache, ...MANUAL_LINES];

      setLines(merged);
      setLinesLoading(false);
      return;
    }
    getLineas()
      .then((data) => {
        const merged = [...data, ...MANUAL_LINES];
        setLines(merged);
        setCache("RecuperarLineaPorCuandoLlega", merged);
      })
      .catch(() => {
        setLines(MANUAL_LINES);
      })
      .finally(() => setLinesLoading(false));
  }, []);

  // Auto-focus search when selector appears
  useEffect(() => {
    if (step === "selector") {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [step]);

  // ── Filtered lines ───────────────────────────────────────────────────────────
  const filteredLines = useMemo(() => {
    const linesList = Array.isArray(lines) ? lines : [];
    if (!search.trim()) return linesList;
    const q = search.toLowerCase();
    return linesList.filter(
      (l) =>
        l.CodigoLineaParada.toLowerCase().includes(q) ||
        l.Descripcion.toLowerCase().includes(q)
    );
  }, [lines, search]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function selectLine(line: Linea) {
    setSelectedLine(line);
    setMapLoading(true);
    setMapError(null);
    setStep("map");
    setRamales([]);
    setSelectedRamal(null);
    setParadas([]);

    try {
      if (line.isManual) {
        const config = MANUAL_ROUTES.find(r => r.line.CodigoLineaParada === line.CodigoLineaParada);
        if (!config) throw new Error("Configuración manual no encontrada");

        const ramalDefs =
          config.ramales && config.ramales.length > 0
            ? config.ramales
            : config.geoJsonPath
              ? [
                  {
                    key: "principal",
                    label: "Recorrido Completo",
                    geoJsonPath: config.geoJsonPath,
                  },
                ]
              : null;

        if (!ramalDefs?.length) {
          throw new Error("Configuración manual incompleta (sin ramales ni geoJsonPath)");
        }

        type RamalDef = (typeof ramalDefs)[number];

        const parsed = await Promise.all(
          ramalDefs.map(async (def: RamalDef) => {
            const res = await fetch(def.geoJsonPath);
            if (!res.ok) throw new Error(`No se pudo cargar el recorrido (${def.label})`);
            const geojson = (await res.json()) as GeoJsonCollection;
            return { def, geojson };
          }),
        );

        const builtRamales: RamalData[] = [];
        const allStops: ParadaMapa[] = [];

        for (const { def, geojson } of parsed) {
          const lineFeature = geojson.features.find(
            (f) => f.geometry.type === "LineString",
          );
          const stopFeatures = geojson.features.filter(
            (f) => f.geometry.type === "Point",
          );

          if (!lineFeature) throw new Error(`Trazado no encontrado (${def.label})`);
          const lineCoordinates = lineFeature.geometry
            .coordinates as [number, number][];

          const points: PuntoRecorrido[] = lineCoordinates.map((coord) => ({
            Latitud: coord[1],
            Longitud: coord[0],
            Descripcion: line.Descripcion,
            IsPuntoPaso: true,
            AbreviaturaBanderaSMP: "",
            AbreviaturaLineaSMP: line.CodigoLineaParada,
          }));

          builtRamales.push({
            key: def.key,
            label: def.label,
            puntos: points,
          });

          for (let i = 0; i < stopFeatures.length; i++) {
            const f = stopFeatures[i];
            const [lng, lat] = f.geometry.coordinates as [number, number];
            allStops.push({
              id: `m_${def.key}_${i}`,
              codigo: `m_${def.key}_${i}`,
              label: `Parada ${i + 1}`,
              lat,
              lng,
              ramales: [def.label],
            });
          }
        }

        setRamales(builtRamales);
        setSelectedRamal(builtRamales[0] ?? null);
        setParadas(allStops);
      } else {
        const [ramalData, paradaData] = await Promise.all([
          getRecorridoRamales(line.CodigoLineaParada),
          getParadasParaMapa(line.CodigoLineaParada),
        ]);
        setRamales(ramalData);
        setSelectedRamal(ramalData[0] ?? null);
        setParadas(paradaData);
      }
    } catch (err: unknown) {
      setMapError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el recorrido. Verificá tu conexión e intentá de nuevo.",
      );
    } finally {
      setMapLoading(false);
    }
  }

  function goBack() {
    setStep("selector");
    setSearch("");
    setSelectedLine(null);
    setRamales([]);
    setSelectedRamal(null);
    setParadas([]);
    setMapError(null);
    setRawLiveBuses([]);
  }

  // ── Supabase Live Locations Subscription ─────────────────────────────────────
  useEffect(() => {
    if (!selectedLine) return;
    const lineaId = selectedLine.CodigoLineaParada;

    function fetchBuses() {
      return supabase
        .from("bus_locations")
        .select("lat, lng, ramal")
        .eq("linea", lineaId)
        .gte("updated_at", new Date(Date.now() - 180000).toISOString())
        .then(({ data }) => {
          const rows = (data || []) as { lat: number; lng: number; ramal: string | null }[];
          setRawLiveBuses(
            rows.map((r) => ({ lat: r.lat, lng: r.lng, ramal: r.ramal ?? null }))
          );
        });
    }

    fetchBuses();

    const channel = supabase
      .channel(`bus-updates-${lineaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bus_locations",
          filter: `linea=eq.${lineaId}`,
        },
        () => {
          fetchBuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLine]);

  // ── Derived map data ─────────────────────────────────────────────────────────
  const routeLine = useMemo<[number, number][]>(() => {
    if (!selectedRamal) return [];
    return selectedRamal.puntos.map((p) => [p.Latitud, p.Longitud]);
  }, [selectedRamal]);

  const filteredParadas = useMemo(() => {
    if (!selectedRamal) return paradas;

    const selectedLabel = normalizeRamal(selectedRamal.label);
    const selectedKey = normalizeRamal(selectedRamal.key);

    const filtered = paradas.filter((parada) => {
      if (!parada.ramales.length) return true;
      return parada.ramales.some((ramal) => {
        const normalized = normalizeRamal(ramal);
        return normalized === selectedLabel || normalized === selectedKey;
      });
    });

    // Fallback safety: if upstream labels drift unexpectedly, avoid emptying the map.
    return filtered.length > 0 ? filtered : paradas;
  }, [paradas, selectedRamal]);

  const mapStops = useMemo(
    () =>
      filteredParadas.map((p, i) => ({
        id: i + 1,
        identificadorParada: p.id,
        lat: p.lat,
        lng: p.lng,
        label: p.label,
      })),
    [filteredParadas]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SELECTOR SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "selector") {
    return (
      <div className="flex min-h-pwa-shell flex-col bg-bg">
        <header className="z-50 flex shrink-0 items-center gap-3 border-b border-white/10 px-[calc(20px+var(--safe-left))] pt-[calc(16px+var(--safe-top))] pr-[calc(20px+var(--safe-right))] pb-3.5">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-text-dim no-underline transition hover:border-white/20 hover:text-text"
            title="Volver al inicio"
          >
            <IconBack />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[24px] font-semibold tracking-[-0.04em] text-text">
              Explorar <span className="text-accent">Recorridos</span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-text-dim">
              {linesLoading ? "Cargando líneas…" : `${lines.length} líneas disponibles`}
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-accent/35 bg-accent/12 px-3 py-1 font-sans text-[11px] font-medium tracking-[-0.01em] text-accent">
            MAPA
          </div>
        </header>

        <div className="shrink-0 border-b border-white/10  px-4 pb-2 pt-3.5">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim">
              <IconSearch />
            </span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar línea por número o destino…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="box-border w-full rounded-full border border-border bg-card py-[11px] pl-10 pr-3.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-45 pt-2">
          {linesLoading ? (
            <LineSkeletons />
          ) : filteredLines.length === 0 ? (
            <div className="py-10 text-center font-mono text-[13px] text-text-dim">
              No se encontraron líneas para «{search}»
            </div>
          ) : (
            filteredLines.map((line) => (
              <LineItem key={line.CodigoLineaParada} line={line} onSelect={selectLine} />
            ))
          )}
        </div>
        <BottomNav tab="buscar" setTab={() => { }} favCount={favoritos.length} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAP SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-background pb-nav">
      <header className="z-50 flex shrink-0 items-center gap-3 border-b border-border bg-background/90 backdrop-blur-md px-[calc(16px+var(--safe-left))] pr-[calc(16px+var(--safe-right))] pt-[calc(10px+var(--safe-top))] pb-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:border-secondary hover:text-foreground"
          title="Volver a la lista"
        >
          <IconBack />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {selectedLine && (
              <span className="shrink-0 rounded-full border border-secondary/45 bg-secondary/12 px-2.5 py-0.5 font-display text-base font-semibold tracking-[-0.03em] text-secondary">
                {selectedLine.CodigoLineaParada}
              </span>
            )}
            <span className="min-w-0 truncate font-sans text-[15px] font-semibold tracking-[-0.02em] text-foreground">
              {mapLoading ? "Cargando…" : (selectedLine?.Descripcion ?? "")}
            </span>
          </div>
          {!mapLoading && selectedRamal && (
            <p className="mt-0.5 truncate font-sans text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground/85">Sentido: </span>
              {selectedRamal.label}
            </p>
          )}
          {!mapLoading && selectedLine && (
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {mapStops.length > 0 ? `${mapStops.length} paradas` : ""}
              {mapStops.length > 0 && ramales.length > 1 ? " · " : ""}
              {ramales.length > 1 ? `${ramales.length} ramales` : ""}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-full border border-secondary/35 bg-secondary/12 px-3 py-1 font-sans text-[11px] font-medium tracking-[-0.01em] text-secondary">
          MAPA
        </div>
      </header>

      {ramales.length > 1 && !mapLoading && (
        <div className="shrink-0 overflow-x-auto border-b border-border bg-background/90 backdrop-blur-md [scrollbar-width:none]">
          <div className="flex w-max gap-2 px-[calc(12px+var(--safe-left))] py-2.5 pr-[calc(12px+var(--safe-right))]">
            {ramales.map((ramal) => {
              const isActive = ramal.key === selectedRamal?.key;
              return (
                <button
                  key={ramal.key}
                  type="button"
                  onClick={() => setSelectedRamal(ramal)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-[7px] font-sans text-[13px] font-medium tracking-[-0.01em] transition",
                    isActive
                      ? "border-secondary bg-secondary/14 text-secondary"
                      : "border-border bg-muted text-muted-foreground hover:border-secondary/50 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 flex-shrink-0 rounded-full transition-colors",
                      isActive ? "bg-secondary" : "bg-muted-foreground/35",
                    )}
                  />
                  {ramal.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {mapLoading ? (
          <MapLoadingOverlay />
        ) : mapError ? (
          <MapErrorOverlay message={mapError} onRetry={() => selectedLine && selectLine(selectedLine)} />
        ) : (
          <RouteMap
            key={`${selectedLine?.CodigoLineaParada ?? ""}-${selectedRamal?.key ?? ""}`}
            routeLine={routeLine}
            stops={mapStops}
            lineNumber={selectedLine?.CodigoLineaParada}
            codigoLineaParada={selectedLine?.CodigoLineaParada}
            routeName={selectedRamal?.label ?? selectedLine?.Descripcion}
            accentColor="var(--secondary)"
            liveBuses={liveBuses}
            ramalKey={selectedRamal?.key}
            ramalLabel={selectedRamal?.label}
            telegramUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "cuandollegamdp_bot"}
          />
        )}
      </div>
      <BottomNav tab="buscar" setTab={() => { }} favCount={favoritos.length} />
    </div>
  );
}
