"use client";

import Link from "next/link";
import React, { useEffect, useState, useRef, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import { encodeLiveSharePayload } from "@/lib/liveSharePayload";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMaximize = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
);
const IconMinimize = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
  </svg>
);
const IconTarget = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconNav = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const IconTelegram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stop {
  id: number;
  /** Identificador MGP de la parada (para enlace a la home). */
  identificadorParada?: string;
  lat: number;
  lng: number;
  label: string;
}

interface RouteMapProps {
  /** Ordered [lat, lng] pairs that form the route polyline. */
  routeLine: [number, number][];
  /** Bus stops to show as numbered markers. */
  stops: Stop[];
  /** Line number badge, e.g. "522" */
  lineNumber?: string;
  /** Código de línea MGP para armar `/?linea=&parada=` hacia la home. */
  codigoLineaParada?: string;
  routeName?: string;
  accentColor?: string;
  /** Live bus locations from Telegram/Supabase */
  liveBuses?: {
    lat: number;
    lng: number;
    count: number;
    ramalCode?: string | null;
    mixedRamales?: boolean;
  }[];
  /** Ramal (branch) for Telegram deep link — included in start= payload. */
  ramalKey?: string;
  /** Human label for the selected ramal (e.g. destination). */
  ramalLabel?: string;
  /** Telegram bot username for deep link CTA */
  telegramUsername?: string;
}

// ─── Direction arrow icon ─────────────────────────────────────────────────────

function createArrowIcon(bearing: number) {
  return L.divIcon({
    className: "clear-arrow",
    html: `<div style="transform: rotate(${bearing}deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ─── Stop marker icon ─────────────────────────────────────────────────────────

function createStopIcon(index: number, isSelected: boolean, accentColor: string) {
  const size = isSelected ? 32 : 22;
  const bg = isSelected ? accentColor : "#090909";
  const border = isSelected ? "#fff" : accentColor;
  const textColor = "#fff";
  const shadow = isSelected
    ? `0 0 0 4px rgba(0,153,255,0.35), 0 4px 16px rgba(0,0,0,0.7)`
    : `0 2px 8px rgba(0,0,0,0.5)`;

  return L.divIcon({
    className: "stop-icon-clear",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:2.5px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-family:'var(--font-display)',sans-serif;
      font-weight:900;font-size:${isSelected ? 13 : 10}px;
      color:${textColor};
      box-shadow:${shadow};
      cursor:pointer;
    ">${index}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

// ─── Live bus marker icon ─────────────────────────────────────────────────────

function createLiveBusIcon(count = 1) {
  const badgeHTML = count > 1 
    ? `<div style="
        position: absolute; top: -36px; right: -26px;
        background: #e74c3c; color: white;
        border-radius: 12px; padding: 2px 6px;
        font-family: var(--display); font-size: 11px; font-weight: 800;
        border: 2px solid #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        z-index: 10;
      ">+${count}</div>` 
    : '';

  const html = `
    <div style="position: relative;">
        <!-- Aura pulse -->
        <div style="
            position: absolute; 
            top: -20px; left: -20px; 
            width: 40px; height: 40px; 
            background: rgba(0,153,255,0.4); 
            border-radius: 50%; 
            animation: pulse-ring 2s infinite ease-out;
            z-index: -1;
        "></div>
        <div class="bus-icon-container">
            <svg width="56" height="36" viewBox="0 0 32 32" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                <!-- Bus Body -->
                <rect x="2" y="8" width="28" height="15" rx="3" fill="#0099ff" />
                
                <!-- Windows -->
                <rect x="5" y="10" width="5" height="5" rx="1" fill="#090909" />
                <rect x="12" y="10" width="6" height="5" rx="1" fill="#090909" />
                <rect x="20" y="10" width="7" height="5" rx="1" fill="#090909" />
                
                <!-- Headlight / Taillight -->
                <rect x="28" y="18" width="2" height="3" fill="#ffffff" opacity="0.9" />
                <rect x="2" y="18" width="2" height="3" fill="#ef4444" opacity="0.8" />
                
                <!-- Stripe -->
                <rect x="2" y="16" width="28" height="1" fill="#fff" opacity="0.3" />

                <!-- Wheels base -->
                <path d="M 6 23 a 3 3 0 0 1 6 0 z" fill="#090909" />
                <path d="M 20 23 a 3 3 0 0 1 6 0 z" fill="#090909" />

                <!-- Wheels -->
                <circle cx="9" cy="24" r="3" fill="#000" />
                <circle cx="23" cy="24" r="3" fill="#000" />
                <circle cx="9" cy="24" r="1.5" fill="#555" />
                <circle cx="23" cy="24" r="1.5" fill="#555" />
            </svg>
        </div>
        ${badgeHTML}
    </div>
  `;

  return L.divIcon({
    className: "custom-bus-icon",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -36],
  });
}

// ─── Map auto-fit and invalidate ──────────────────────────────────────────────

function MapController({
  bounds,
  triggerFit,
  isFullscreen,
}: {
  bounds: L.LatLngBoundsExpression | null;
  triggerFit: number;
  isFullscreen: boolean;
}) {
  const map = useMap();
  const fitted = useRef(false);
  const lastTrigger = useRef(triggerFit);

  useEffect(() => {
    setTimeout(() => map.invalidateSize({ animate: true }), 100);
    setTimeout(() => map.invalidateSize({ animate: true }), 300);
  }, [isFullscreen, map]);

  useEffect(() => {
    if (!bounds) return;
    if (!fitted.current || lastTrigger.current !== triggerFit) {
      fitted.current = true;
      lastTrigger.current = triggerFit;
      setTimeout(() => {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [60, 60], animate: true });
      }, 120);
    }
  }, [map, bounds, triggerFit]);

  return null;
}

// ─── Google Maps helpers ──────────────────────────────────────────────────────

function googleMapsUrl(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
function googleDirUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

function homeConsultSearch(line: string, paradaId: string) {
  return `/?linea=${encodeURIComponent(line)}&parada=${encodeURIComponent(paradaId)}`;
}

function showArribosEnHomeCta(codigoLineaParada?: string, identificadorParada?: string) {
  return Boolean(codigoLineaParada && identificadorParada && !identificadorParada.startsWith("m_"));
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RouteMap({
  routeLine,
  stops,
  lineNumber = "",
  codigoLineaParada = "",
  routeName = "Recorrido",
  accentColor = "#0099ff",
  liveBuses = [],
  ramalKey = "",
  ramalLabel = "",
  telegramUsername = "",
}: RouteMapProps) {
  const [selectedStop, setSelectedStop] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStopList, setShowStopList] = useState(false);
  const [search, setSearch] = useState("");
  const [fitTrigger, setFitTrigger] = useState(0);

  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (routeLine.length === 0) return null;
    return L.latLngBounds(routeLine);
  }, [routeLine]);

  // Direction arrows along the route
  const arrowMarkers = useMemo(() => {
    const arrows: { pos: [number, number]; bearing: number }[] = [];
    if (routeLine.length < 5) return arrows;
    for (let j = 10; j < routeLine.length - 2; j += 20) {
      const p1 = routeLine[Math.max(0, j - 2)];
      const p2 = routeLine[Math.min(routeLine.length - 1, j + 2)];
      if (p1 && p2) {
        const dLon = p2[1] - p1[1];
        const y = Math.sin((dLon * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180);
        const x =
          Math.cos((p1[0] * Math.PI) / 180) * Math.sin((p2[0] * Math.PI) / 180) -
          Math.sin((p1[0] * Math.PI) / 180) *
            Math.cos((p2[0] * Math.PI) / 180) *
            Math.cos((dLon * Math.PI) / 180);
        const bearing = (Math.atan2(y, x) * 180) / Math.PI;
        arrows.push({ pos: routeLine[j], bearing });
      }
    }
    return arrows;
  }, [routeLine]);

  const filteredStops = useMemo(() => {
    if (!search.trim()) return stops;
    const q = search.toLowerCase();
    return stops.filter(
      (s) => s.label.toLowerCase().includes(q) || String(s.id).includes(q)
    );
  }, [stops, search]);

  const selected = stops.find((s) => s.id === selectedStop) ?? null;

  const center: [number, number] = routeLine.length > 0
    ? routeLine[Math.floor(routeLine.length / 2)]
    : [-38.0, -57.5];

  const telegramStartPayload = useMemo(() => {
    if (!lineNumber) return "";
    if (ramalKey) {
      try {
        return encodeLiveSharePayload(lineNumber, ramalKey);
      } catch {
        return lineNumber;
      }
    }
    return lineNumber;
  }, [lineNumber, ramalKey]);

  if (stops.length === 0 && routeLine.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
        Cargando recorrido…
      </div>
    );
  }

  const containerStyle: React.CSSProperties = isFullscreen
    ? { position: "fixed", inset: 0, zIndex: 99999, background: "#000", display: "flex", flexDirection: "column" }
    : { height: "100%", width: "100%", overflow: "hidden", position: "relative", zIndex: 1, display: "flex", flexDirection: "column" };

  return (
    <div style={containerStyle}>
      {/* ── Floating top-left header (fullscreen only) ── */}
      {isFullscreen && (
        <div style={{
          position: "absolute", top: 16, left: 16, zIndex: 1000,
          background: "var(--surface)", padding: "10px 16px", borderRadius: "10px",
          border: "1px solid var(--border)", boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
          fontFamily: "var(--display)", fontWeight: 800, fontSize: 15, letterSpacing: 1,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {lineNumber && (
            <span style={{ background: accentColor, color: "#fff", borderRadius: 6, padding: "2px 10px", fontWeight: 900, fontSize: 18 }}>{lineNumber}</span>
          )}
          <span style={{ color: "var(--text)", fontSize: 13 }}>{routeName}</span>
        </div>
      )}

      {/* ── Floating right buttons ── */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 1000,
        display: "flex", gap: 10, flexDirection: "column",
      }}>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
          title={isFullscreen ? "Minimizar" : "Pantalla completa"}
        >
          {isFullscreen ? <IconMinimize /> : <IconMaximize />}
        </button>
        <button
          onClick={() => setFitTrigger((f) => f + 1)}
          style={{ background: "var(--surface)", color: accentColor, border: "1px solid var(--border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
          title="Centrar recorrido"
        >
          <IconTarget />
        </button>
        <button
          onClick={() => { setShowStopList(!showStopList); setSelectedStop(null); }}
          style={{ background: showStopList ? accentColor : "var(--surface)", color: showStopList ? "#fff" : "var(--text)", border: "1px solid var(--border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
          title="Ver paradas"
        >
          <IconList />
        </button>
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 1, flex: 1, background: "#090909" }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />

        {/* Route line */}
        {routeLine.length > 0 && (
          <Fragment>
            <Polyline
              positions={routeLine}
              color={accentColor}
              weight={8}
              opacity={1}
              lineCap="round"
              lineJoin="round"
            />
            {arrowMarkers.map((arr, idx) => (
              <Marker
                key={`arr-${idx}`}
                position={arr.pos}
                icon={createArrowIcon(arr.bearing)}
                interactive={false}
              />
            ))}
          </Fragment>
        )}

        {/* Stop markers */}
        {stops.map((stop) => {
          const isSel = stop.id === selectedStop;
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={createStopIcon(stop.id, isSel, accentColor)}
              eventHandlers={{ click: () => setSelectedStop(isSel ? null : stop.id) }}
              zIndexOffset={isSel ? 1000 : 0}
            >
              <Popup maxWidth={260}>
                <StopPopup stop={stop} accentColor={accentColor} codigoLineaParada={codigoLineaParada} />
              </Popup>
            </Marker>
          );
        })}

        <MapController bounds={bounds} triggerFit={fitTrigger} isFullscreen={isFullscreen} />

        {/* Live buses */}
        {liveBuses.map((bus, i) => {
          const n = bus.count || 1;
          const ramaInfo = bus.mixedRamales
            ? "Varios ramales"
            : bus.ramalCode
              ? `Ramal: ${bus.ramalCode}`
              : null;
          return (
            <Marker
              key={`bus-${i}-${bus.lat}-${bus.lng}`}
              position={[bus.lat, bus.lng]}
              icon={createLiveBusIcon(n)}
              zIndexOffset={2000}
            >
              <Popup>
                <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 13, textAlign: "center" }}>
                  🚌 ¡El {lineNumber} está acá!
                  {ramaInfo && (
                    <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4, fontWeight: 600 }}>{ramaInfo}</div>
                  )}
                  {n > 1 && <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>({n} pasajeros transmitiendo)</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Telegram CTA ── */}
      {telegramUsername && lineNumber && telegramStartPayload && (
        <a
          href={`https://t.me/${telegramUsername}?start=${encodeURIComponent(telegramStartPayload)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={ramalLabel ? `Transmisión asociada al ramal: ${ramalLabel}` : "Indicar que vas en este recorrido"}
          style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: "#2AABEE", color: "#fff", zIndex: 1000,
            padding: "12px 20px", borderRadius: 30, textDecoration: "none",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(42,171,238,0.5)",
            fontFamily: "var(--display)", fontWeight: 800, fontSize: 14,
            transition: "transform 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <IconTelegram />
          Compartí tu ubicación en vivo
        </a>
      )}

      {/* ── Stop list drawer (bottom sheet) ── */}
      {showStopList && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: "var(--surface)", borderTop: "1px solid var(--border)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.7)",
          maxHeight: isFullscreen ? "55dvh" : "60%",
          display: "flex", flexDirection: "column",
          animation: "slide-up 0.25s ease",
        }}>
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
          </div>

          {/* Drawer header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 16px 10px" }}>
            {lineNumber && (
              <div style={{
                background: accentColor, color: "#fff", borderRadius: 6,
                padding: "3px 10px", fontFamily: "var(--display)", fontWeight: 900,
                fontSize: 18, letterSpacing: 1, flexShrink: 0,
              }}>{lineNumber}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{routeName}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{stops.length} paradas</div>
            </div>
            <button
              onClick={() => setShowStopList(false)}
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-dim)", flexShrink: 0 }}
            >
              <IconClose />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", padding: "0 16px 10px" }}>
            <span style={{ position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar parada…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text)", fontFamily: "var(--body)", fontSize: 13,
                padding: "8px 10px 8px 32px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Stops list */}
          <div style={{ overflowY: "auto", padding: "0 12px 16px" }}>
            {filteredStops.map((stop) => {
              const isSel = stop.id === selectedStop;
              return (
                <button
                  key={stop.id}
                  onClick={() => {
                    setSelectedStop(isSel ? null : stop.id);
                    setShowStopList(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    background: isSel ? `rgba(0,153,255,0.12)` : "transparent",
                    border: isSel ? `1px solid rgba(0,153,255,0.4)` : "1px solid transparent",
                    borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                    marginBottom: 3, transition: "all 0.15s ease", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: isSel ? accentColor : "var(--surface2)",
                    border: `2px solid ${isSel ? accentColor : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--display)", fontWeight: 900, fontSize: 11,
                    color: isSel ? "#fff" : "var(--text-dim)", transition: "all 0.15s ease",
                  }}>
                    {stop.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--body)", fontSize: 13, color: isSel ? "var(--text)" : "var(--text-dim)", fontWeight: isSel ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {stop.label}
                    </div>
                  </div>
                  <svg style={{ color: isSel ? accentColor : "var(--border)", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
            {filteredStops.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--mono)", fontSize: 12, padding: "12px 0" }}>
                No se encontraron paradas
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Selected stop action bar ── */}
      {selected && !showStopList && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          zIndex: 1000, background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          animation: "slide-up 0.25s ease",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.7)",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: accentColor, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--display)", fontWeight: 900, fontSize: 16, color: "#fff",
            boxShadow: `0 4px 12px rgba(0,153,255,0.35)`,
          }}>
            {selected.id}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected.label}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>
              Parada {selected.id} de {stops.length}
            </div>
          </div>
          {showArribosEnHomeCta(codigoLineaParada, selected.identificadorParada) &&
          codigoLineaParada &&
          selected.identificadorParada ? (
            <Link
              href={homeConsultSearch(codigoLineaParada, selected.identificadorParada)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface2)",
                color: accentColor,
                border: `2px solid ${accentColor}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: 12,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Cuándo llega
            </Link>
          ) : null}
          <a
            href={googleMapsUrl(selected.lat, selected.lng)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: accentColor, color: "#fff",
              borderRadius: 10, padding: "10px 14px",
              fontFamily: "var(--display)", fontWeight: 800, fontSize: 13,
              cursor: "pointer", textDecoration: "none", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,153,255,0.35)",
            }}
          >
            <GoogleMapsIcon />
            Maps
          </a>
          <a
            href={googleDirUrl(selected.lat, selected.lng)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface2)", color: "var(--text)",
              border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px",
              fontFamily: "var(--display)", fontWeight: 700, fontSize: 13,
              cursor: "pointer", textDecoration: "none", flexShrink: 0,
            }}
          >
            <IconNav />
            Ir
          </a>
          <button
            onClick={() => setSelectedStop(null)}
            style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-dim)", flexShrink: 0 }}
          >
            <IconClose />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stop Popup ───────────────────────────────────────────────────────────────

function StopPopup({
  stop,
  accentColor,
  codigoLineaParada = "",
}: {
  stop: Stop;
  accentColor: string;
  codigoLineaParada?: string;
}) {
  const canCta = showArribosEnHomeCta(codigoLineaParada, stop.identificadorParada);
  const manualStop = Boolean(stop.identificadorParada?.startsWith("m_"));

  return (
    <div style={{ fontFamily: "var(--body)", minWidth: 200, padding: "2px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          background: accentColor, color: "#fff", borderRadius: "50%",
          width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--display)", fontWeight: 900, fontSize: 13, flexShrink: 0,
        }}>
          {stop.id}
        </div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, color: "var(--text)", lineHeight: 1.2 }}>
          {stop.label}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <a
          href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: accentColor, color: "#fff", borderRadius: 8,
            padding: "8px 0", fontFamily: "var(--display)", fontWeight: 800, fontSize: 12,
            textDecoration: "none",
          }}
        >
          <GoogleMapsIcon /> Maps
        </a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "8px 0", fontFamily: "var(--display)", fontWeight: 700, fontSize: 12,
            textDecoration: "none",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Ir
        </a>
      </div>
      {canCta && codigoLineaParada && stop.identificadorParada ? (
        <Link
          href={homeConsultSearch(codigoLineaParada, stop.identificadorParada)}
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--surface)",
            color: accentColor,
            border: `2px solid ${accentColor}`,
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Ver cuándo llega
        </Link>
      ) : manualStop ? (
        <div
          style={{
            marginTop: 10,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Horarios no disponibles para este recorrido
        </div>
      ) : null}
    </div>
  );
}

function GoogleMapsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );
}
