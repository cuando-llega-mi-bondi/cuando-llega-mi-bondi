"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import { useGeolocation } from "../../../_components/useGeolocation";
import type { WalkRoute } from "@/lib/osrm";

function userIcon() {
    return L.divIcon({
        className: "v2-user-icon",
        html: `<div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,153,255,0.35), transparent 70%);animation:v2pulse 2.4s ease-out infinite"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#0099FF;border:3px solid white;box-shadow:0 4px 14px -4px rgba(0,153,255,0.7)"></div>
    </div>
    <style>@keyframes v2pulse{0%{transform:scale(0.6);opacity:0.9}80%,100%{transform:scale(1.6);opacity:0}}</style>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

function stopIcon() {
    return L.divIcon({
        className: "v2-stop-icon",
        html: `<div style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#0F1115;color:#FFD60A;border:3px solid #FFD60A;box-shadow:0 6px 16px -8px rgba(15,17,21,0.6)">
      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor"/></svg>
    </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 16, { animate: true });
            return;
        }
        const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17, animate: true });
    }, [map, points]);
    return null;
}

export default function StopMapInner({
    stopLat,
    stopLng,
    route,
}: {
    stopLat: number;
    stopLng: number;
    route: WalkRoute | null;
}) {
    const geo = useGeolocation();
    const stopPoint: [number, number] = [stopLat, stopLng];
    const userPoint: [number, number] | null =
        geo.status === "granted" ? [geo.coords.lat, geo.coords.lng] : null;

    const fitPoints = route?.polyline.length
        ? route.polyline
        : userPoint
          ? [stopPoint, userPoint]
          : [stopPoint];

    return (
        <div className="relative h-[260px] overflow-hidden rounded-3xl border border-[#E8E2D2] bg-[#EFEAE0] v2-card-shadow">
            <MapContainer
                center={stopPoint}
                zoom={16}
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
                <FitBounds points={fitPoints} />

                {/* Ruta real (polyline OSRM) si está disponible, sino línea recta punteada */}
                {route?.polyline.length ? (
                    <Polyline
                        positions={route.polyline}
                        pathOptions={{ color: "#0099FF", weight: 4, opacity: 0.85 }}
                    />
                ) : userPoint ? (
                    <Polyline
                        positions={[userPoint, stopPoint]}
                        pathOptions={{
                            color: "#0099FF",
                            weight: 3,
                            opacity: 0.5,
                            dashArray: "6 6",
                        }}
                    />
                ) : null}

                <Marker position={stopPoint} icon={stopIcon()} />
                {userPoint ? <Marker position={userPoint} icon={userIcon()} /> : null}
            </MapContainer>
        </div>
    );
}
