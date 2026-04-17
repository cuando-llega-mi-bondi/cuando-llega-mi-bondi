"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getLineas, getRecorridoRamales, getParadasParaMapa } from "@/lib/cuandoLlega";
import { getCache, setCache } from "@/lib/localCache";
import type { Linea, RamalData, ParadaMapa, PuntoRecorrido } from "@/lib/cuandoLlega.types";
import { MANUAL_LINES, MANUAL_ROUTES } from "@/lib/manualRoutes";
import { supabase } from "@/lib/supabaseClient";

// Leaflet can't run on the server — dynamic import with ssr:false is mandatory
const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 14, gap: 10 }}>
      <span style={{ width: 16, height: 16, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "spin-slow 0.8s linear infinite" }} />
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
const IconBus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 9h18"/><path d="M8 19v-3m8 3v-3"/><path d="M7 19h10"/><circle cx="7.5" cy="14.5" r=".5" fill="currentColor"/><circle cx="16.5" cy="14.5" r=".5" fill="currentColor"/>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

type Step = "selector" | "map";

export default function RecorridoClient() {
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
  const [liveBuses, setLiveBuses] = useState<{lat: number, lng: number}[]>([]);

  // ── Load lines (with 24h cache) ──────────────────────────────────────────────
  useEffect(() => {
    const rawCache = getCache<any>("RecuperarLineaPorCuandoLlega");
    if (rawCache) {
      const data = Array.isArray(rawCache) ? rawCache : (rawCache.lineas ?? []);
      // Ensure manual lines are present and not duplicated
      const manualCodes = new Set(MANUAL_LINES.map(m => m.CodigoLineaParada));
      const filteredCache = data.filter((l: any) => !manualCodes.has(l.CodigoLineaParada));
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

        const res = await fetch(config.geoJsonPath);
        if (!res.ok) throw new Error("No se pudo cargar el archivo de recorrido");
        const geojson = await res.json();

        // Parse GeoJSON to our format
        const lineFeature = geojson.features.find((f: any) => f.geometry.type === "LineString");
        const stopFeatures = geojson.features.filter((f: any) => f.geometry.type === "Point");

        if (!lineFeature) throw new Error("Trazado no encontrado en el archivo");

        const points: PuntoRecorrido[] = lineFeature.geometry.coordinates.map((coord: [number, number]) => ({
          Latitud: coord[1],
          Longitud: coord[0],
          Descripcion: line.Descripcion,
          IsPuntoPaso: true,
          AbreviaturaBanderaSMP: "",
          AbreviaturaLineaSMP: line.CodigoLineaParada
        }));

        const manualRamal: RamalData = {
          key: "principal",
          label: "Recorrido Completo",
          puntos: points
        };

        const manualStops: ParadaMapa[] = stopFeatures.map((f: any, i: number) => ({
          id: `m_${i}`,
          codigo: `m_${i}`,
          label: `Parada ${i + 1}`,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0]
        }));

        setRamales([manualRamal]);
        setSelectedRamal(manualRamal);
        setParadas(manualStops);
      } else {
        const [ramalData, paradaData] = await Promise.all([
          getRecorridoRamales(line.CodigoLineaParada),
          getParadasParaMapa(line.CodigoLineaParada),
        ]);
        setRamales(ramalData);
        setSelectedRamal(ramalData[0] ?? null);
        setParadas(paradaData);
      }
    } catch (err: any) {
      setMapError(err.message || "No se pudo cargar el recorrido. Verificá tu conexión e intentá de nuevo.");
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
    setLiveBuses([]);
  }

  // ── Supabase Live Locations Subscription ─────────────────────────────────────
  useEffect(() => {
    if (!selectedLine) return;
    const lineaId = selectedLine.CodigoLineaParada;
    
    // Initial fetch of active locations
    supabase
      .from("bus_locations")
      .select("lat, lng")
      .eq("linea", lineaId)
      // Only get recent updates (e.g. from the last hour), so we ignore old sessions
      .gte("updated_at", new Date(Date.now() - 3600000).toISOString())
      .then(({ data }) => setLiveBuses(data || []));

    // Subscribe to realtime changes for this line
    const channel = supabase
      .channel(`bus-updates-${lineaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bus_locations",
          filter: `linea=eq.${lineaId}`
        },
        () => {
          // Re-fetch all valid locations instead of trying to merge locally
          supabase
            .from("bus_locations")
            .select("lat, lng")
            .eq("linea", lineaId)
            .gte("updated_at", new Date(Date.now() - 3600000).toISOString())
            .then(({ data }) => setLiveBuses(data || []));
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

  const mapStops = useMemo(() =>
    paradas.map((p, i) => ({
      id: i + 1,
      lat: p.lat,
      lng: p.lng,
      label: p.label,
    })),
    [paradas]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SELECTOR SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "selector") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Header */}
        <header style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          zIndex: 50, flexShrink: 0,
        }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-dim)", textDecoration: "none", flexShrink: 0 }}
            title="Volver al inicio"
          >
            <IconBack />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: 20, color: "var(--text)", letterSpacing: 0.5, lineHeight: 1.1 }}>
              Explorar <span style={{ color: "var(--accent)" }}>Recorridos</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
              {linesLoading ? "Cargando líneas…" : `${lines.length} líneas disponibles`}
            </div>
          </div>
          <div style={{
            background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: 8, padding: "4px 10px",
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", flexShrink: 0,
          }}>
            MAPA
          </div>
        </header>

        {/* Search bar */}
        <div style={{ padding: "14px 16px 8px", flexShrink: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", pointerEvents: "none" }}>
              <IconSearch />
            </span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar línea por número o destino…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text)", fontFamily: "var(--body)", fontSize: 14,
                padding: "11px 14px 11px 40px", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>
        </div>

        {/* Line list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 24px" }}>
          {linesLoading ? (
            <LineSkeletons />
          ) : filteredLines.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 13 }}>
              No se encontraron líneas para «{search}»
            </div>
          ) : (
            filteredLines.map((line) => (
              <LineItem key={line.CodigoLineaParada} line={line} onSelect={selectLine} />
            ))
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAP SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* Header */}
      <header style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        zIndex: 50, flexShrink: 0,
      }}>
        <button
          onClick={goBack}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-dim)", background: "transparent", cursor: "pointer", flexShrink: 0 }}
          title="Volver a la lista"
        >
          <IconBack />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: 18, color: "var(--text)", letterSpacing: 0.5, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 8 }}>
            {selectedLine && (
              <span style={{ background: "var(--accent)", color: "#000", borderRadius: 6, padding: "1px 8px", fontWeight: 900, fontSize: 20 }}>
                {selectedLine.CodigoLineaParada}
              </span>
            )}
            <span style={{ color: "var(--text)", fontSize: 15 }}>
              {mapLoading ? "Cargando…" : (selectedRamal?.label ?? selectedLine?.Descripcion ?? "")}
            </span>
          </div>
          {!mapLoading && selectedLine && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
              {paradas.length > 0 ? `${paradas.length} paradas · ` : ""}{ramales.length > 1 ? `${ramales.length} ramales` : ""}
            </div>
          )}
        </div>

        <div style={{
          background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)",
          borderRadius: 8, padding: "4px 10px",
          fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", flexShrink: 0,
        }}>
          MAPA
        </div>
      </header>

      {/* Ramal tab bar — only shown when > 1 ramal */}
      {ramales.length > 1 && !mapLoading && (
        <div style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          overflowX: "auto", flexShrink: 0,
          scrollbarWidth: "none",
        }}>
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", width: "max-content" }}>
            {ramales.map((ramal) => {
              const isActive = ramal.key === selectedRamal?.key;
              return (
                <button
                  key={ramal.key}
                  onClick={() => setSelectedRamal(ramal)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 20,
                    border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: isActive ? "rgba(245,166,35,0.15)" : "var(--surface2)",
                    color: isActive ? "var(--accent)" : "var(--text-dim)",
                    fontFamily: "var(--display)", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isActive ? "var(--accent)" : "var(--border)",
                    flexShrink: 0, transition: "background 0.15s ease",
                  }} />
                  {ramal.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Map area */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {mapLoading ? (
          <MapLoadingOverlay />
        ) : mapError ? (
          <MapErrorOverlay message={mapError} onRetry={() => selectedLine && selectLine(selectedLine)} />
        ) : (
          <RouteMap
            routeLine={routeLine}
            stops={mapStops}
            lineNumber={selectedLine?.CodigoLineaParada}
            routeName={selectedRamal?.label ?? selectedLine?.Descripcion}
            accentColor="var(--accent)"
            liveBuses={liveBuses}
            telegramUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "cuandollegamdp_bot"}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LineItem({ line, onSelect }: { line: Linea; onSelect: (l: Linea) => void }) {
  // Clean up description: "COLÓN - AERODROMO" → split into two parts for nicer display
  const desc = line.Descripcion.trim();

  return (
    <button
      onClick={() => onSelect(line)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "12px 14px", cursor: "pointer",
        marginBottom: 6, transition: "border-color 0.15s ease, background 0.15s ease",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.5)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
      }}
    >
      {/* Line number badge */}
      <div style={{
        minWidth: 52, height: 40, background: "var(--surface2)",
        border: "1px solid var(--border)", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--display)", fontWeight: 900, fontSize: 17,
        color: "var(--accent)", letterSpacing: 0.5, flexShrink: 0,
      }}>
        {line.CodigoLineaParada}
      </div>

      {/* Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--body)", fontWeight: 600, fontSize: 14,
          color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {desc}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
          Ver recorrido en mapa
        </div>
      </div>

      {/* Arrow */}
      <svg style={{ color: "var(--border)", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function LineSkeletons() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "12px 14px", marginBottom: 6,
            opacity: 1 - i * 0.1,
          }}
        >
          <div style={{ width: 52, height: 40, borderRadius: 8, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: "60%", borderRadius: 4, background: "var(--surface2)", marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 11, width: "35%", borderRadius: 4, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      ))}
    </>
  );
}

function MapLoadingOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16, background: "var(--bg)",
    }}>
      <span style={{
        width: 40, height: 40, border: "3px solid var(--border)",
        borderTopColor: "var(--accent)", borderRadius: "50%",
        display: "inline-block", animation: "spin-slow 0.8s linear infinite",
      }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)" }}>
        Cargando recorrido…
      </div>
    </div>
  );
}

function MapErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16, background: "var(--bg)", padding: "24px",
    }}>
      <div style={{ color: "var(--text-dim)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <div style={{ fontFamily: "var(--body)", fontSize: 14, color: "var(--text-dim)", textAlign: "center", maxWidth: 280 }}>
        {message}
      </div>
      <button
        onClick={onRetry}
        style={{
          background: "var(--accent)", color: "#000", border: "none", borderRadius: 10,
          padding: "10px 24px", fontFamily: "var(--display)", fontWeight: 800, fontSize: 14,
          cursor: "pointer",
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
