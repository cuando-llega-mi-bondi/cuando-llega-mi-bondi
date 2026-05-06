"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import type { Stop } from "@/lib/static/stops";
import { geoCenter, useGeolocation } from "./useGeolocation";

const NEARBY_LIMIT = 50;

function distanceMts(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function userIcon() {
  return L.divIcon({
    className: "v2-user-icon",
    html: `<div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,153,255,0.35), transparent 70%);animation:v2pulse 2.4s ease-out infinite"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#0099FF;border:3px solid white;box-shadow:0 4px 14px -4px rgba(0,153,255,0.7)"></div>
    </div>
    <style>@keyframes v2pulse{0%{transform:scale(0.6);opacity:0.9}80%,100%{transform:scale(1.6);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function stopIcon(numLines: number, active: boolean) {
  const size = Math.min(38, 22 + numLines * 2);
  const ring = active ? "#FFD60A" : "#FAF7F0";
  const fill = active ? "#0F1115" : "#0099FF";
  return L.divIcon({
    className: "v2-stop-icon",
    html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:${fill};color:white;border:3px solid ${ring};box-shadow:0 6px 16px -8px rgba(15,17,21,0.5);font-family:ui-monospace,monospace;font-weight:700;font-size:${Math.min(13, 9 + numLines)}px">${numLines}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitOnFirstFix({ lat, lng, hasFix }: { lat: number; lng: number; hasFix: boolean }) {
  const map = useMap();
  const fittedRef = useRef(false);
  useEffect(() => {
    if (!hasFix || fittedRef.current) return;
    map.setView([lat, lng], 15, { animate: true });
    fittedRef.current = true;
  }, [map, lat, lng, hasFix]);
  return null;
}

function CaptureMap({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

type Props = {
  stops: Stop[];
};

export default function NearbyMapInner({ stops }: Props) {
  const geo = useGeolocation();
  const userLoc = geoCenter(geo);
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const ranked = useMemo(() => {
    return stops
      .map((s) => ({ stop: s, dist: distanceMts(userLoc, { lat: s.lat, lng: s.lng }) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, NEARBY_LIMIT);
  }, [stops, userLoc]);

  const center: [number, number] = [userLoc.lat, userLoc.lng];

  return (
    <div className="relative h-[340px] overflow-hidden rounded-3xl border border-[#E8E2D2] bg-[#EFEAE0] v2-card-shadow">
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
        className="absolute inset-0 z-0"
        style={{ background: "#EFEAE0" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <CaptureMap mapRef={mapRef} />
        <FitOnFirstFix lat={userLoc.lat} lng={userLoc.lng} hasFix={geo.status === "granted"} />
        <Marker position={center} icon={userIcon()} />
        {ranked.map(({ stop }) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={stopIcon(stop.lineas.length, activeId === stop.id)}
            eventHandlers={{
              click: () => setActiveId((prev) => (prev === stop.id ? null : stop.id)),
            }}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
        {(() => {
          const active = activeId ? ranked.find((r) => r.stop.id === activeId) : ranked[0];
          if (!active) return null;
          return (
            <div className="pointer-events-auto rounded-2xl border border-white/60 bg-white/95 p-3 shadow-[0_22px_50px_-22px_rgba(15,17,21,0.4)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#6B7080]">
                    {activeId ? "Parada seleccionada" : "Más cerca"} · {active.dist} m
                  </p>
                  <p className="mt-0.5 font-display text-[15px] font-semibold leading-tight text-[#0F1115]">
                    {active.stop.nombre}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#6B7080]">
                    {active.stop.id} · {active.stop.lineas.length} {active.stop.lineas.length === 1 ? "línea" : "líneas"}
                  </p>
                </div>
                <div className="flex max-w-[140px] flex-wrap justify-end gap-1">
                  {active.stop.lineas.slice(0, 6).map((l) => (
                    <span
                      key={l}
                      className="rounded-md bg-[#0F1115] px-1.5 py-0.5 font-display text-[11px] font-bold text-[#FFD60A]"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        <div className="rounded-full border border-[#E8E2D2] bg-white/85 px-2.5 py-1 font-mono text-[10.5px] text-[#0F1115] backdrop-blur">
          {ranked.length} paradas · {ranked[0]?.dist ?? 0} m
        </div>
        {geo.status === "requesting" ? (
          <div className="rounded-full border border-[#E8E2D2] bg-white/85 px-2.5 py-1 font-mono text-[10.5px] text-[#6B7080] backdrop-blur">
            buscando GPS…
          </div>
        ) : geo.status === "granted" ? (
          <div className="rounded-full border border-[#E8E2D2] bg-white/85 px-2.5 py-1 font-mono text-[10.5px] text-[#0099FF] backdrop-blur">
            ± {geo.accuracyMts} m
          </div>
        ) : geo.status === "denied" ? (
          <div className="rounded-full border border-[#E8E2D2] bg-white/85 px-2.5 py-1 font-mono text-[10.5px] text-[#6B7080] backdrop-blur">
            sin GPS · centro MDP
          </div>
        ) : null}
        {geo.status === "granted" ? (
          <button
            type="button"
            onClick={() => mapRef.current?.setView([userLoc.lat, userLoc.lng], 16, { animate: true })}
            className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-[#0099FF] text-white shadow-[0_10px_28px_-10px_rgba(0,153,255,0.7)] transition active:scale-95"
            aria-label="Centrar en mi ubicación"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
