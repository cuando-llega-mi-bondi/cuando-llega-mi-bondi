"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map/leaflet.css";
import { MDP_CENTER, useGeolocation } from "../../_components/useGeolocation";

function pinIcon() {
    return L.divIcon({
        className: "v2-pin-picker",
        html: `<div style="position:relative;width:36px;height:46px;transform:translateY(-18px)">
      <svg viewBox="0 0 24 32" width="36" height="46">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0Z"
              fill="#0099FF" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4.2" fill="white"/>
      </svg>
    </div>`,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
    });
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function CenterOnce({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    const doneRef = useRef(false);
    useEffect(() => {
        if (doneRef.current) return;
        map.setView([lat, lng], 14, { animate: false });
        doneRef.current = true;
    }, [map, lat, lng]);
    return null;
}

export default function PinPickerMapInner({
    initial,
    onConfirm,
    onCancel,
}: {
    initial?: { lat: number; lng: number } | null;
    onConfirm: (coords: { lat: number; lng: number }) => void;
    onCancel: () => void;
}) {
    const geo = useGeolocation();
    const startCenter =
        initial ?? (geo.status === "granted" ? geo.coords : MDP_CENTER);

    const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
        initial ?? null,
    );

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAF7F0]">
            <div className="flex items-center gap-2 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="grid h-9 w-9 place-items-center rounded-full border border-[#E8E2D2] bg-white text-[#0F1115]"
                    aria-label="Cancelar"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path
                            d="m6 6 12 12M18 6 6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Marcá el destino
                    </p>
                    <p className="truncate font-display text-[15px] font-semibold text-[#0F1115]">
                        Tocá donde querés ir
                    </p>
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
                <MapContainer
                    center={[startCenter.lat, startCenter.lng]}
                    zoom={14}
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
                    <CenterOnce lat={startCenter.lat} lng={startCenter.lng} />
                    <ClickToPlace onPick={(lat, lng) => setPin({ lat, lng })} />
                    {pin ? (
                        <Marker
                            position={[pin.lat, pin.lng]}
                            icon={pinIcon()}
                            draggable
                            eventHandlers={{
                                dragend: (e) => {
                                    const ll = e.target.getLatLng();
                                    setPin({ lat: ll.lat, lng: ll.lng });
                                },
                            }}
                        />
                    ) : null}
                </MapContainer>

                {!pin ? (
                    <div className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-2xl border border-[#E8E2D2] bg-white/95 px-4 py-3 backdrop-blur">
                        <p className="font-display text-[13.5px] font-semibold text-[#0F1115]">
                            Tocá el mapa para fijar el destino.
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#6B7080]">
                            Después podés arrastrarlo para ajustarlo.
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
                <button
                    type="button"
                    disabled={!pin}
                    onClick={() => pin && onConfirm(pin)}
                    className="w-full rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)] transition active:scale-[0.99] disabled:bg-[#9DB6CC] disabled:shadow-none"
                >
                    {pin ? "Usar este punto" : "Tocá el mapa primero"}
                </button>
            </div>
        </div>
    );
}
