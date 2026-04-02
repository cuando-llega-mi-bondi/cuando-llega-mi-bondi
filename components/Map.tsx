"use client";

import React, { useEffect, useState, useRef, Fragment, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRecorrido } from "@/lib/cuandoLlega";
import { type PuntoRecorrido, type Arribo } from "@/lib/cuandoLlega.types";

// Icons for Map UI Overlay
const IconMaximize = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>;
const IconMinimize = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>;
const IconTarget = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;

const createArrowIcon = (bearing: number) => L.divIcon({
    className: "clear-arrow",
    html: `<div style="transform: rotate(${bearing}deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));">
                <path d="M18 15l-6-6-6 6"/>
            </svg>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Map manager component for imperative actions without re-rendering everything
function MapController({ arribos, paradaCoords, triggerFit, isFullscreen }: { arribos: any[], paradaCoords: [number, number], triggerFit: number, isFullscreen: boolean }) {
    const map = useMap();
    const lastTrigger = useRef(triggerFit);
    const hasInitialized = useRef(false);
    const lastParada = useRef(paradaCoords.join(","));

    // Invalidate size strictly when toggling fullscreen
    useEffect(() => {
        setTimeout(() => map.invalidateSize({ animate: true }), 100);
        setTimeout(() => map.invalidateSize({ animate: true }), 300);
    }, [isFullscreen, map]);

    // Handle Centering and Bounds precisely
    useEffect(() => {
        const currentParada = paradaCoords.join(",");
        
        // Only run logic on mount, stop change, or manual trigger
        if (!hasInitialized.current || lastParada.current !== currentParada || lastTrigger.current !== triggerFit) {
            hasInitialized.current = true;
            lastParada.current = currentParada;
            lastTrigger.current = triggerFit;
            
            const bounds = L.latLngBounds([paradaCoords]);
            let validCount = 1;
            arribos.forEach(a => {
                const lat = parseFloat(a.Latitud);
                const lon = parseFloat(a.Longitud);
                if (!isNaN(lat) && !isNaN(lon) && lat !== 0) {
                    bounds.extend([lat, lon]);
                    validCount++;
                }
            });

            if (validCount > 1) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
            } else {
                map.setView(paradaCoords, 16, { animate: true });
            }
        }
    }, [map, arribos, paradaCoords, triggerFit]);
    
    return null;
}

const BusMap = React.memo(function BusMap({ arribos, paradaLat, paradaLon, lineaCod }: { arribos: any[], paradaLat: string, paradaLon: string, lineaCod?: string }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fitTrigger, setFitTrigger] = useState(0);
    const [routePoints, setRoutePoints] = useState<PuntoRecorrido[]>([]);

    useEffect(() => {
        if (!lineaCod) {
            setRoutePoints([]);
            return;
        }
        let active = true;
        getRecorrido(lineaCod).then(data => {
            if (active) setRoutePoints(data);
        }).catch(console.error);
        return () => { active = false; };
    }, [lineaCod]);

    // Distinct ramales from current arriving buses
    const activeRamales = useMemo(() => 
        new Set(arribos.map(a => a.DescripcionCartelBandera?.toUpperCase() || "")),
    [arribos]);

    // Group route points by Descripcion
    const groupedPoints = useMemo(() => 
        routePoints.reduce((acc, p) => {
            if (!acc[p.Descripcion]) acc[p.Descripcion] = [];
            acc[p.Descripcion].push([p.Latitud, p.Longitud] as [number, number]);
            return acc;
        }, {} as Record<string, [number, number][]>),
    [routePoints]);

    const paradaCoords = useMemo((): [number, number] | null => {
        let pLat = parseFloat(paradaLat);
        let pLon = parseFloat(paradaLon);
        if ((isNaN(pLat) || isNaN(pLon) || pLat === 0) && arribos.length > 0) {
            pLat = parseFloat(arribos[0].LatitudParada);
            pLon = parseFloat(arribos[0].LongitudParada);
        }
        if (isNaN(pLat) || isNaN(pLon) || pLat === 0) return null;
        return [pLat, pLon];
    }, [paradaLat, paradaLon, arribos]);

    if (!paradaCoords) return null;

    // CSS divIcon for Stop (Pulse Effect)
    const StopIcon = useMemo(() => L.divIcon({
        className: 'custom-stop-icon',
        html: `<div class="marker-stop"></div>`,
        iconSize: [0, 0], // Sized via CSS
        iconAnchor: [0, 0] // Centered via negative margin in CSS
    }), []);

    // Color logic
    const getEtaClass = (arriboStr: string) => {
        if (arriboStr.includes("1 min") || arriboStr.toLowerCase().includes("llegando")) return "";
        if (arriboStr.includes("2 min") || arriboStr.includes("3 min") || arriboStr.includes("4 min")) return "warn";
        return "";
    };

    const containerStyle = isFullscreen ? {
        position: "fixed" as const, inset: 0, zIndex: 99999, background: "#000",
        display: "flex", flexDirection: "column" as const, animation: "flip-in 0.2s ease forwards"
    } : {
        height: "320px", width: "100%", borderRadius: "12px", overflow: "hidden", 
        border: "1px solid var(--border)", marginBottom: "16px", position: "relative" as const, zIndex: 1 
    };

    return (
        <div style={containerStyle}>
            {/* Minimalist Mobile UI overlay over Leaflet */}
            <div style={{ position: "absolute", top: isFullscreen ? envLocalSafeAreaTop(16) : 12, right: 12, zIndex: 1000, display: "flex", gap: 10, flexDirection: "column" }}>
                <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
                >
                    {isFullscreen ? <IconMinimize/> : <IconMaximize/>}
                </button>
                <button 
                    onClick={() => setFitTrigger(f => f + 1)}
                    style={{ background: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
                >
                    <IconTarget/>
                </button>
            </div>

            {isFullscreen && (
                <div style={{ position: "absolute", top: envLocalSafeAreaTop(16), left: 16, zIndex: 1000, background: "var(--surface)", padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--border)", boxShadow: "0 6px 16px rgba(0,0,0,0.6)", fontFamily: "var(--display)", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
                    MAR DEL PLATA · TIEMPO REAL
                </div>
            )}

            <MapContainer center={paradaCoords} zoom={16} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 1, flex: 1, background: "#111114" }}>
                {/* Google Maps Tiles Engine */}
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                />
                
                {/* Routes */}
                {Object.entries(groupedPoints).map(([desc, points], i) => {
                    const descUpper = desc.toUpperCase();
                    // Some basic matching between endpoint Descripcion and the arriving bus Ramal display name
                    const isActive = arribos.length === 0 || Array.from(activeRamales).some(ramal => 
                        descUpper.includes(ramal as string) || 
                        (ramal as string).includes((descUpper.split(';')[1] || '').trim())
                    );
                    
                    // Calculate arrows for active routes
                    const arrowMarkers = [];
                    if (isActive && points.length > 5) {
                        for (let j = 5; j < points.length - 2; j += 10) {
                            const p1 = points[Math.max(0, j - 2)];
                            const p2 = points[Math.min(points.length - 1, j + 2)];
                            if (p1 && p2) {
                                const dLon = p2[1] - p1[1];
                                const y = Math.sin(dLon * Math.PI/180) * Math.cos(p2[0] * Math.PI/180);
                                const x = Math.cos(p1[0] * Math.PI/180) * Math.sin(p2[0] * Math.PI/180) -
                                          Math.sin(p1[0] * Math.PI/180) * Math.cos(p2[0] * Math.PI/180) * Math.cos(dLon * Math.PI/180);
                                const bearing = Math.atan2(y, x) * 180 / Math.PI;
                                arrowMarkers.push({ pos: points[j], bearing });
                            }
                        }
                    }
                    
                    return (
                        <Fragment key={i}>
                            <Polyline 
                                positions={points} 
                                color={isActive ? "#f5a623" : "#777777"} 
                                weight={isActive ? 8 : 4} 
                                opacity={isActive ? 1 : 0.4} 
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
                    );
                })}

                {/* Auto-Centering logic */}
                <MapController arribos={arribos} paradaCoords={paradaCoords} triggerFit={fitTrigger} isFullscreen={isFullscreen} />

                {/* Stop Marker */}
                <Marker position={paradaCoords} icon={StopIcon} zIndexOffset={-100}>
                    <Popup>
                        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14 }}>Parada Seleccionada</div>
                    </Popup>
                </Marker>

                {/* Animated Bus Markers */}
                {arribos.map((a, i) => {
                    const lat = parseFloat(a.Latitud);
                    const lon = parseFloat(a.Longitud);
                    if (isNaN(lat) || isNaN(lon) || lat === 0) return null;

                    const html = `
                        <div class="bus-icon-container">
                            <svg width="56" height="36" viewBox="0 0 32 32" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                                <!-- Bus Body -->
                                <rect x="2" y="8" width="28" height="15" rx="3" fill="#f5a623" />
                                
                                <!-- Windows -->
                                <rect x="5" y="10" width="5" height="5" rx="1" fill="#111114" />
                                <rect x="12" y="10" width="6" height="5" rx="1" fill="#111114" />
                                <rect x="20" y="10" width="7" height="5" rx="1" fill="#111114" />
                                
                                <!-- Headlight / Taillight -->
                                <rect x="28" y="18" width="2" height="3" fill="#ffffff" opacity="0.9" />
                                <rect x="2" y="18" width="2" height="3" fill="#ef4444" opacity="0.8" />
                                
                                <!-- Stripe -->
                                <rect x="2" y="16" width="28" height="1" fill="#fff" opacity="0.3" />

                                <!-- Wheels base -->
                                <path d="M 6 23 a 3 3 0 0 1 6 0 z" fill="#111114" />
                                <path d="M 20 23 a 3 3 0 0 1 6 0 z" fill="#111114" />

                                <!-- Wheels -->
                                <circle cx="9" cy="24" r="3" fill="#000" />
                                <circle cx="23" cy="24" r="3" fill="#000" />
                                <circle cx="9" cy="24" r="1.5" fill="#555" />
                                <circle cx="23" cy="24" r="1.5" fill="#555" />
                            </svg>
                        </div>
                    `;

                    const BusIcon = L.divIcon({
                        className: 'custom-bus-icon',
                        html,
                        iconSize: [0, 0], // Sized by CSS
                        iconAnchor: [0, 0] // Centered horizontally & pin bottom via CSS (-X, -Y) margin
                    });

                    return (
                        <Marker key={i} position={[lat, lon]} icon={BusIcon} zIndexOffset={100 + i}>
                            <Popup>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
                                    <div style={{ background: "var(--accent)", color: "#000", padding: "3px 8px", borderRadius: "6px", fontFamily: "var(--display)", fontWeight: 900, fontSize: 16, display: "inline-block", width: "fit-content" }}>
                                        Línea {a.DescripcionLinea}
                                    </div>
                                    <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "#6b6b7a", marginTop: 2 }}>
                                        {a.DescripcionCartelBandera.toUpperCase()}
                                    </div>
                                    <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 800, color: getEtaClass(a.Arribo) === "warn" ? "#f5a623" : "#22c55e", marginTop: 4 }}>
                                        {a.Arribo}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            {isFullscreen && arribos.length > 0 && (
                <div style={{ 
                    position: "absolute", bottom: envLocalSafeAreaBottom(16), left: 16, right: 16, zIndex: 1000, 
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", 
                    padding: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", display: "flex", gap: 16, 
                    alignItems: "center", animation: "slide-up 0.3s ease" 
                }}>
                    <div style={{ 
                        background: "var(--accent)", color: "#000", padding: "8px 12px", borderRadius: "8px", 
                        fontFamily: "var(--display)", fontWeight: 900, fontSize: 24, letterSpacing: 1, flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(245,166,35,0.3)"
                    }}>
                        {arribos[0].DescripcionLinea}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: "var(--text-dim)", letterSpacing: 0.5 }}>
                            {arribos[0].DescripcionCartelBandera.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: getEtaClass(arribos[0].Arribo) === "warn" ? "var(--accent)" : "var(--green)" }}>
                            {arribos[0].Arribo}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default BusMap;

// Fallback for Safari safe-area bottom
function envLocalSafeAreaBottom(fallback: number) {
    if (typeof window !== "undefined" && window.CSS && CSS.supports("padding-bottom: env(safe-area-inset-bottom)")) {
        return "calc(env(safe-area-inset-bottom) + 16px)";
    }
    return fallback;
}

// Fallback for Safari safe-area
function envLocalSafeAreaTop(fallback: number) {
    if (typeof window !== "undefined" && window.CSS && CSS.supports("padding-top: env(safe-area-inset-top)")) {
        return "calc(env(safe-area-inset-top) + 16px)";
    }
    return fallback;
}
