"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MapContainer,
    Marker,
    Polyline,
    TileLayer,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import type { Stop } from "@/lib/static/stops";

function paradaIcon(idx: number, isFirst: boolean, isLast: boolean) {
    const ring = isFirst ? "#0099FF" : isLast ? "#FFD60A" : "#FAF7F0";
    const fill = isFirst ? "#0099FF" : isLast ? "#FFD60A" : "white";
    const text = isFirst || isLast ? "white" : "#0F1115";
    const labelText = isFirst ? "A" : isLast ? "B" : String(idx + 1);
    return L.divIcon({
        className: "v2-linea-stop",
        html: `<div style="display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:${fill};color:${isFirst || isLast ? "white" : text};border:2px solid ${ring};box-shadow:0 4px 10px -6px rgba(15,17,21,0.4);font-family:ui-monospace,monospace;font-size:10px;font-weight:700">${labelText}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
    const map = useMap();
    const fittedRef = useRef(false);
    useEffect(() => {
        if (points.length === 0 || fittedRef.current) return;
        const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
        fittedRef.current = true;
    }, [map, points]);
    return null;
}

export default function LineaMapInner({
    paradas,
    polyline,
    lineaDescripcion,
}: {
    paradas: Stop[];
    /** Polyline opcional ya cargada (geojson manual). Si no se pasa, conectamos paradas por línea recta. */
    polyline?: Array<[number, number]>;
    lineaDescripcion: string;
}) {
    const router = useRouter();
    const points: Array<[number, number]> =
        polyline && polyline.length > 0
            ? polyline
            : paradas.map((p) => [p.lat, p.lng]);

    if (points.length === 0) return null;

    const center = points[Math.floor(points.length / 2)]!;

    return (
        <div className="relative h-[280px] overflow-hidden rounded-3xl border border-[#E8E2D2] bg-[#EFEAE0] v2-card-shadow">
            <MapContainer
                center={center}
                zoom={13}
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
                <FitBounds points={points} />
                <Polyline
                    positions={points}
                    pathOptions={{ color: "#0099FF", weight: 4, opacity: 0.85 }}
                />
                {paradas.map((p, i) => {
                    const isFirst = i === 0;
                    const isLast = i === paradas.length - 1;
                    return (
                        <Marker
                            key={p.id}
                            position={[p.lat, p.lng]}
                            icon={paradaIcon(i, isFirst, isLast)}
                            eventHandlers={{
                                click: () => {
                                    router.push(
                                        `/v2/parada/${encodeURIComponent(p.id)}`,
                                    );
                                },
                            }}
                        />
                    );
                })}
            </MapContainer>

            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
                <div className="rounded-xl border border-[#E8E2D2] bg-white/95 px-3 py-2 backdrop-blur">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#6B7080]">
                        Línea {lineaDescripcion}
                    </p>
                    <p className="font-display text-[12px] font-semibold text-[#0F1115]">
                        Tocá una parada para ver detalle y arribos
                    </p>
                </div>
            </div>
        </div>
    );
}
