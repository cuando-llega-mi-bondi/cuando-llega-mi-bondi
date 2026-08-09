"use client";

import React, { useEffect, useState, useRef, Fragment, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@shared/map/leaflet.css";
import { useLeafletMapReady } from "@shared/map/useLeafletMapReady";
import { cn } from "@shared/utils";
import { isMapUsable, stopMapSafely } from "@shared/map/leafletSafety";
import { getRecorridoPuntosParaMapa, ramalesFromPuntos } from "@features/route/api/recorrido";
import type { Arribo } from "@features/arrivals/types";
import { arriboBanderaLabel } from "@features/arrivals/utils";
import type { PuntoRecorrido } from "@features/route/types";
import {
    createArrowIcon,
    envLocalSafeAreaBottom,
    envLocalSafeAreaTop,
} from "@shared/map/leafletConfig";
import { headingFromRoute, headingHaciaParada } from "@shared/map/bus/busHeading";
import { createBusSpriteIcon } from "@shared/map/bus/busSpriteIcon";
import { colorForRouteIndex } from "@shared/map/routeColors";

const IconMaximize = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>;
const IconMinimize = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>;
const IconTarget = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;

function firstBusCoords(arribos: Arribo[]): [number, number] | null {
    for (const a of arribos) {
        const lat = parseFloat(a.Latitud);
        const lng = parseFloat(a.Longitud);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0) return [lat, lng];
    }
    return null;
}

type RouteShape = { destinoMedio: string; abrevSMP: string; descripcion: string; points: [number, number][] };

function banderaMatchesRoute(r: string, g: RouteShape): boolean {
    if (!r) return false;
    return (
        r === g.destinoMedio ||
        r === g.abrevSMP ||
        (Boolean(g.destinoMedio) && r.includes(g.destinoMedio)) ||
        (Boolean(g.destinoMedio) && g.destinoMedio.includes(r)) ||
        (Boolean(g.abrevSMP) && g.abrevSMP.length > 1 && r.includes(g.abrevSMP))
    );
}

/**
 * Si el vértice más cercano al colectivo está después del más cercano a la parada,
 * el orden del GDS suele ir en sentido contrario al movimiento hacia la parada: invertimos.
 */
function orientPolylineTowardParada(
    points: [number, number][],
    parada: [number, number],
    bus: [number, number],
): [number, number][] {
    if (points.length < 2) return points;
    let iBus = 0;
    let iParada = 0;
    let dBus = Infinity;
    let dParada = Infinity;
    for (let i = 0; i < points.length; i++) {
        const [lat, lng] = points[i];
        const db = (lat - bus[0]) ** 2 + (lng - bus[1]) ** 2;
        const dp = (lat - parada[0]) ** 2 + (lng - parada[1]) ** 2;
        if (db < dBus) {
            dBus = db;
            iBus = i;
        }
        if (dp < dParada) {
            dParada = dp;
            iParada = i;
        }
    }
    if (iBus === iParada) return points;
    if (iBus > iParada) return [...points].reverse();
    return points;
}

function MapController({
    arribos,
    liveBuses,
    paradaCoords,
    triggerFit,
    isFullscreen,
}: {
    arribos: Arribo[];
    liveBuses: { lat: number; lng: number; ramal: string | null }[];
    paradaCoords: [number, number];
    triggerFit: number;
    isFullscreen: boolean;
}) {
    const map = useMap();
    const lastTrigger = useRef(triggerFit);
    const hasInitialized = useRef(false);
    const lastParada = useRef(paradaCoords.join(","));

    useEffect(() => {
        const t1 = setTimeout(() => { if (isMapUsable(map)) map.invalidateSize({ animate: false }); }, 100);
        const t2 = setTimeout(() => { if (isMapUsable(map)) map.invalidateSize({ animate: false }); }, 300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isFullscreen, map]);

    // Cancela animaciones en vuelo antes de que react-leaflet destruya el mapa.
    useEffect(() => () => stopMapSafely(map), [map]);

    useEffect(() => {
        if (!isMapUsable(map)) return;
        const currentParada = paradaCoords.join(",");
        if (
            !hasInitialized.current ||
            lastParada.current !== currentParada ||
            lastTrigger.current !== triggerFit
        ) {
            hasInitialized.current = true;
            lastParada.current = currentParada;
            lastTrigger.current = triggerFit;

            const bounds = L.latLngBounds([paradaCoords]);
            let validCount = 1;
            arribos.forEach((a) => {
                const lat = parseFloat(a.Latitud);
                const lon = parseFloat(a.Longitud);
                if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat !== 0) {
                    bounds.extend([lat, lon]);
                    validCount += 1;
                }
            });

            liveBuses.forEach((b) => {
                const lat = Number(b.lat);
                const lon = Number(b.lng);
                if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat !== 0) {
                    bounds.extend([lat, lon]);
                    validCount += 1;
                }
            });

            if (validCount > 1) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
            } else {
                map.setView(paradaCoords, 16, { animate: true });
            }
        }
    }, [map, arribos, liveBuses, paradaCoords, triggerFit]);

    return null;
}

const BusMap = React.memo(function BusMap({
    arribos,
    paradaLat,
    paradaLon,
    lineaCod,
    liveBuses = [],
    fillParent = false,
    selectedRamal = "TODOS",
    paradaBanderaAbrevs = [],
    fallbackCenter,
    fallbackZoom = 13,
    controlsClassName,
}: {
    arribos: Arribo[];
    paradaLat: string;
    paradaLon: string;
    lineaCod?: string;
    liveBuses?: { lat: number; lng: number; ramal: string | null }[];
    fillParent?: boolean;
    /** Filtro de ramal en UI; si no es TODOS, prioriza esa abreviatura para el trazo. */
    selectedRamal?: string;
    /** Abreviaturas de bandera asociadas a la parada elegida (RecuperarParadas…). */
    paradaBanderaAbrevs?: string[];
    /** Centro a usar cuando no hay parada aún (mapa "vacío"); sin esto, no renderiza. */
    fallbackCenter?: [number, number];
    fallbackZoom?: number;
    /** Offset de los controles según el host; default asume el panel de 420px del overlay. */
    controlsClassName?: string;
}) {
    const mapReady = useLeafletMapReady();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fitTrigger, setFitTrigger] = useState(0);
    const [routePoints, setRoutePoints] = useState<PuntoRecorrido[]>([]);

    useEffect(() => {
        if (!lineaCod) return;
        let active = true;
        getRecorridoPuntosParaMapa(lineaCod)
            .then((data) => {
                if (active) setRoutePoints(data);
            })
            .catch(console.error);
        return () => {
            active = false;
        };
    }, [lineaCod]);

    const ramalHints = useMemo(() => {
        const sr = (selectedRamal ?? "TODOS").trim();
        if (sr && sr !== "TODOS") {
            return [sr.toUpperCase()].filter(Boolean);
        }
        return paradaBanderaAbrevs.map((x) => x.trim().toUpperCase()).filter(Boolean);
    }, [selectedRamal, paradaBanderaAbrevs]);

    const groupedRoutes = useMemo(() => {
        const ramales = ramalesFromPuntos(routePoints);
        return ramales.map((ramal) => {
            const points = ramal.puntos.map(
                (p) => [p.Latitud, p.Longitud] as [number, number],
            );
            const firstPunto = ramal.puntos[0];
            const smp = (firstPunto?.AbreviaturaBanderaSMP ?? "").trim();
            // Build a synthetic Descripcion key that matches the original format
            const descripcion = `${ramal.key};${ramal.label}`;
            return {
                descripcion,
                points,
                destinoMedio: ramal.label.trim().toUpperCase(),
                abrevSMP: smp.toUpperCase(),
            };
        });
    }, [routePoints]);

    // Un color estable por ramal (por posición, no por contenido): con 2+
    // sentidos superpuestos, antes todo lo no-activo se pintaba igual (gris
    // tenue) y era imposible distinguir un sentido de otro en el mapa.
    const routeColorByDescripcion = useMemo(() => {
        const map = new Map<string, string>();
        groupedRoutes.forEach((route, i) => {
            map.set(route.descripcion, colorForRouteIndex(i));
        });
        return map;
    }, [groupedRoutes]);

    const paradaCoords = useMemo((): [number, number] | null => {
        let pLat = parseFloat(paradaLat);
        let pLon = parseFloat(paradaLon);
        if ((Number.isNaN(pLat) || Number.isNaN(pLon) || pLat === 0) && arribos.length > 0) {
            pLat = parseFloat(arribos[0].LatitudParada);
            pLon = parseFloat(arribos[0].LongitudParada);
        }
        if (
            (Number.isNaN(pLat) || Number.isNaN(pLon) || pLat === 0) &&
            liveBuses.length > 0
        ) {
            pLat = Number(liveBuses[0].lat);
            pLon = Number(liveBuses[0].lng);
        }
        if (Number.isNaN(pLat) || Number.isNaN(pLon) || pLat === 0) return null;
        return [pLat, pLon];
    }, [paradaLat, paradaLon, arribos, liveBuses]);

    /**
     * Qué trazos del GeoJSON van resaltados. Líneas con ramales de verdad (no
     * sólo ida/vuelta, ej. 511) pueden tener una misma parada física servida
     * por 2+ destinos distintos — `paradaBanderaAbrevs`/los arribos ya listan
     * esas banderas. Antes esta lógica siempre colapsaba a UN solo ganador
     * (por ETA o por distancia), así que si la parada realmente tenía 2
     * destinos con arribos, el mapa sólo mostraba uno y el resto desaparecía
     * sin explicación — mismatch entre la lista de arribos y el mapa. Ahora
     * se resalta un trazo por cada bandera distinta presente.
     */
    const activeDescripcionKeys = useMemo(() => {
        if (groupedRoutes.length === 0) return new Set<string>();

        const plat = paradaCoords?.[0];
        const plng = paradaCoords?.[1];
        const hasParada =
            plat != null && plng != null && !Number.isNaN(plat) && !Number.isNaN(plng);

        const distSqToParada = (g: RouteShape): number => {
            if (!hasParada) return Infinity;
            let distSq = Infinity;
            for (const [lat, lng] of g.points) {
                const d = (lat - plat) * (lat - plat) + (lng - plng) * (lng - plng);
                if (d < distSq) distSq = d;
            }
            return distSq;
        };

        /** Mejor trazo para UNA bandera puntual: único match, o el más cercano a la parada si hay varios. */
        const bestMatchFor = (bandera: string): string | null => {
            const hits = groupedRoutes.filter((g) => banderaMatchesRoute(bandera, g));
            if (hits.length === 0) return null;
            if (hits.length === 1) return hits[0].descripcion;
            const ranked = [...hits].sort((x, y) => distSqToParada(x) - distSqToParada(y));
            return ranked[0].descripcion;
        };

        const matchAll = (banderas: Iterable<string>): Set<string> => {
            const matched = new Set<string>();
            for (const b of banderas) {
                const best = bestMatchFor(b);
                if (best) matched.add(best);
            }
            return matched;
        };

        if (arribos.length === 0) {
            const hintMatches = matchAll(ramalHints);
            if (hintMatches.size > 0) return hintMatches;

            if (hasParada && groupedRoutes.length > 0) {
                const sorted = [...groupedRoutes].sort(
                    (a, b) => distSqToParada(a) - distSqToParada(b),
                );
                const best = sorted[0];
                if (best) return new Set([best.descripcion]);
            }

            return new Set<string>();
        }

        // Todas las banderas realmente presentes en los arribos de esta
        // parada — puede haber más de una si la parada sirve varios destinos.
        const banderasEnArribos = new Set(
            arribos.map((a) => arriboBanderaLabel(a).trim().toUpperCase()).filter(Boolean),
        );

        const arriboMatches = matchAll(banderasEnArribos);
        if (arriboMatches.size > 0) return arriboMatches;

        const hintMatches = matchAll(ramalHints);
        if (hintMatches.size > 0) return hintMatches;

        if (hasParada && groupedRoutes.length > 0) {
            const sorted = [...groupedRoutes].sort((a, b) => distSqToParada(a) - distSqToParada(b));
            const best = sorted[0];
            if (best) return new Set([best.descripcion]);
        }

        return new Set<string>();
    }, [groupedRoutes, arribos, ramalHints, paradaCoords]);

    const busCoordsForOrient = useMemo(() => firstBusCoords(arribos), [arribos]);

    const routesForMap = useMemo(() => {
        const routes = groupedRoutes.map(({ descripcion, points }) => {
            let pts = points;
            if (
                activeDescripcionKeys.has(descripcion) &&
                busCoordsForOrient &&
                paradaCoords &&
                points.length >= 2
            ) {
                pts = orientPolylineTowardParada(points, paradaCoords, busCoordsForOrient);
            }
            return { descripcion, points: pts };
        });
        // El ramal activo se dibuja último (encima) para que no quede tapado
        // por el resto de los sentidos donde el trazado se superpone.
        return [...routes].sort((a, b) => {
            const aActive = activeDescripcionKeys.has(a.descripcion) ? 1 : 0;
            const bActive = activeDescripcionKeys.has(b.descripcion) ? 1 : 0;
            return aActive - bActive;
        });
    }, [groupedRoutes, activeDescripcionKeys, paradaCoords, busCoordsForOrient]);

    // Cuando ya sabemos qué ramal es el relevante (arribo con bandera clara,
    // o pista fuerte de la parada), mostrar SOLO ese trazado — ida y vuelta
    // casi siempre comparten la mayor parte del recorrido, así que pintar
    // ambos a la vez es más ruido que información. Sólo en el caso ambiguo
    // (sin match, `activeDescripcionKeys` vacío) mostramos todos los ramales
    // con su propio color + leyenda, para que el usuario pueda orientarse.
    const visibleRoutes = useMemo(() => {
        if (activeDescripcionKeys.size === 0) return routesForMap;
        return routesForMap.filter(({ descripcion }) => activeDescripcionKeys.has(descripcion));
    }, [routesForMap, activeDescripcionKeys]);

    // Con un solo ramal activo lo pintamos en el azul "este es el que importa".
    // Con 2+ (parada compartida por varios destinos) ese mismo azul para todos
    // los volvería indistinguibles entre sí, así que cada uno usa su color de
    // la paleta en vez del azul especial.
    const isSingleActive = activeDescripcionKeys.size === 1;

    // La leyenda sólo debe listar lo que efectivamente se está dibujando
    // (`visibleRoutes`), no todos los ramales de la línea — si no, con una
    // parada de 2 destinos entre 12 ramales totales mostraría los 12.
    const visibleDescripciones = new Set(visibleRoutes.map((r) => r.descripcion));
    const legendRoutes = groupedRoutes.filter((r) => visibleDescripciones.has(r.descripcion));

    /**
     * Arribos con coordenadas válidas más el rumbo con el que hay que dibujarlos.
     *
     * Cada bondi se orienta contra la traza de **su propia bandera**, no contra
     * la que está pintada de azul. Las líneas traen ida y vuelta como banderas
     * separadas que recorren la misma avenida en sentidos opuestos (la 522, por
     * ejemplo, tiene "AL FARO" norte→sur y "A BERUTI Y 228" sur→norte), así que
     * usar una sola traza para todos deja a los de la bandera contraria mirando
     * exactamente 180° al revés.
     *
     * Se usan los puntos crudos de `groupedRoutes` y no los de `routesForMap`
     * justamente porque el orden crudo del GDS ya es el sentido de circulación:
     * de 142 banderas, 133 tienen su inversa cargada como bandera aparte.
     * `routesForMap` en cambio da vuelta la traza activa con una heurística
     * pensada para dibujar un trazo, que acá rompería el rumbo.
     */
    const rumbosPorArribo = useMemo<number[]>(() => {
        // Sólo para arribos cuya bandera no matchea ningún ramal: ahí la traza
        // activa orientada hacia la parada es la mejor conjetura disponible.
        const activa = routesForMap.find((r) =>
            activeDescripcionKeys.has(r.descripcion),
        );
        const trazaFallback = activa?.points ?? [];

        return arribos.map((a) => {
            const lat = parseFloat(a.Latitud);
            const lng = parseFloat(a.Longitud);
            if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0) return 0;

            const bandera = arriboBanderaLabel(a).trim().toUpperCase();
            const hits = bandera
                ? groupedRoutes.filter((g) => banderaMatchesRoute(bandera, g))
                : [];
            // Las variantes "X B" de una misma bandera van para el mismo lado,
            // así que cualquiera sirve; igual se prefiere la coincidencia exacta.
            const propia =
                hits.find(
                    (g) => g.destinoMedio === bandera || g.abrevSMP === bandera,
                ) ?? hits[0];

            const pos: [number, number] = [lat, lng];
            return (
                headingFromRoute(pos, propia?.points ?? trazaFallback) ??
                headingHaciaParada(pos, paradaCoords)
            );
        });
    }, [
        arribos,
        groupedRoutes,
        routesForMap,
        activeDescripcionKeys,
        paradaCoords,
    ]);

    const centerCoords = paradaCoords ?? fallbackCenter ?? null;
    if (!centerCoords) return null;

    const stopIcon = L.divIcon({
        className: "custom-stop-icon",
        html: `<div class="marker-stop"></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

    const getEtaClass = (arriboStr: string) => {
        if (arriboStr.includes("1 min") || arriboStr.toLowerCase().includes("llegando")) return "";
        if (
            arriboStr.includes("2 min") ||
            arriboStr.includes("3 min") ||
            arriboStr.includes("4 min")
        ) return "warn";
        return "";
    };

    const containerStyle = fillParent
        ? {
              height: "100%",
              width: "100%",
              overflow: "hidden",
              position: "relative" as const,
              zIndex: 1,
          }
        : isFullscreen
        ? {
              position: "fixed" as const,
              inset: 0,
              zIndex: 99999,
              background: "#000",
              display: "flex",
              flexDirection: "column" as const,
              animation: "flip-in 0.2s ease forwards",
          }
        : {
              height: "320px",
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--color-border)",
              marginBottom: "16px",
              position: "relative" as const,
              zIndex: 1,
          };

    const controlsTop = fillParent
        ? "calc(env(safe-area-inset-top) + 16px)"
        : isFullscreen
          ? envLocalSafeAreaTop(16)
          : 12;

    return (
        <div style={containerStyle}>
            {/* En desktop (fillParent) el panel de arribos ocupa 420px a la derecha */}
            <div
                className={cn(
                    "absolute right-3 z-[1000] flex flex-col gap-2.5",
                    controlsClassName ?? (fillParent ? "lg:right-[436px]" : ""),
                )}
                style={{ top: controlsTop }}
            >
                {!fillParent ? (
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{ background: "var(--color-card)", color: "var(--color-foreground)", border: "1px solid var(--color-border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
                    >
                        {isFullscreen ? <IconMinimize/> : <IconMaximize/>}
                    </button>
                ) : null}
                <button
                    onClick={() => setFitTrigger((f) => f + 1)}
                    style={{ background: "var(--color-card)", color: "var(--color-secondary)", border: "1px solid var(--color-border)", borderRadius: "10px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.6)" }}
                >
                    <IconTarget/>
                </button>
            </div>

            {isFullscreen ? (
                <div style={{ position: "absolute", top: envLocalSafeAreaTop(16), left: 16, zIndex: 1000, background: "var(--color-card)", padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--color-border)", boxShadow: "0 6px 16px rgba(0,0,0,0.6)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
                    MAR DEL PLATA · TIEMPO REAL
                </div>
            ) : null}

            {/* Leyenda de sentidos: sólo tiene sentido mostrarla cuando hay más de
                un ramal pintado a la vez. En fullscreen se omite para no chocar
                con la tarjeta de resumen inferior. */}
            {!isFullscreen && visibleRoutes.length > 1 ? (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        bottom: envLocalSafeAreaBottom(12),
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        maxWidth: 190,
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        padding: "8px 10px",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
                    }}
                >
                    {legendRoutes.map((route, i) => {
                        const isActive = activeDescripcionKeys.has(route.descripcion);
                        const dotColor =
                            isActive && isSingleActive
                                ? "#0099ff"
                                : (routeColorByDescripcion.get(route.descripcion) ?? "#777777");
                        return (
                            <div
                                key={route.descripcion}
                                style={{ display: "flex", alignItems: "center", gap: 6, opacity: isActive ? 1 : 0.75 }}
                            >
                                <span
                                    style={{
                                        width: 9,
                                        height: 9,
                                        borderRadius: "50%",
                                        background: dotColor,
                                        flexShrink: 0,
                                        boxShadow: isActive ? "0 0 0 2px rgba(0,153,255,0.35)" : undefined,
                                    }}
                                />
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 10.5,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {route.destinoMedio || `Ramal ${i + 1}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {mapReady ? (
            <MapContainer center={centerCoords} zoom={paradaCoords ? 16 : fallbackZoom} scrollWheelZoom style={{ height: "100%", width: "100%", zIndex: 1, flex: 1, background: "#090909" }}>
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Maps"
                />

                {visibleRoutes.map(({ descripcion, points }) => {
                    const isActive = activeDescripcionKeys.has(descripcion);

                    const arrowMarkers = [];
                    if (isActive && points.length > 5) {
                        for (let j = 5; j < points.length - 2; j += 10) {
                            const p1 = points[Math.max(0, j - 2)];
                            const p2 = points[Math.min(points.length - 1, j + 2)];
                            if (p1 && p2) {
                                const dLon = p2[1] - p1[1];
                                const y = Math.sin((dLon * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180);
                                const x = Math.cos((p1[0] * Math.PI) / 180) * Math.sin((p2[0] * Math.PI) / 180) - Math.sin((p1[0] * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180) * Math.cos((dLon * Math.PI) / 180);
                                const bearing = (Math.atan2(y, x) * 180) / Math.PI;
                                arrowMarkers.push({ pos: points[j], bearing });
                            }
                        }
                    }

                    // Un solo activo: azul fuerte y sólido (igual que el ícono de
                    // colectivo, "este es el que importa"). Con 2+ activos a la vez
                    // (parada compartida por varios destinos) o ninguno (ambiguo),
                    // cada trazo usa su propio color de la paleta — nunca gris
                    // uniforme — para poder distinguirlos entre sí.
                    const routeColor =
                        isActive && isSingleActive
                            ? "#0099ff"
                            : (routeColorByDescripcion.get(descripcion) ?? "#777777");

                    return (
                        <Fragment key={descripcion}>
                            <Polyline
                                positions={points}
                                color={routeColor}
                                weight={isActive ? 8 : 5}
                                opacity={isActive ? 1 : 0.65}
                                lineCap="round"
                                lineJoin="round"
                            />
                            {arrowMarkers.map((arr, idx) => (
                                <Marker key={`arr-${idx}`} position={arr.pos} icon={createArrowIcon(arr.bearing)} interactive={false} />
                            ))}
                        </Fragment>
                    );
                })}

                {/* Sin parada aún (mapa fallback) no hay nada que encuadrar ni marcar;
                    cuando aparece, MapController se monta y anima hacia la parada. */}
                {paradaCoords ? (
                    <MapController
                        arribos={arribos}
                        liveBuses={liveBuses}
                        paradaCoords={paradaCoords}
                        triggerFit={fitTrigger}
                        isFullscreen={isFullscreen}
                    />
                ) : null}

                {paradaCoords ? (
                    <Marker position={paradaCoords} icon={stopIcon} zIndexOffset={-100}>
                        <Popup>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>
                                Parada Seleccionada
                            </div>
                        </Popup>
                    </Marker>
                ) : null}

                {liveBuses.map((b, i) => {
                    const LiveBusIcon = L.divIcon({
                        className: "custom-live-bus-icon",
                        html: `<div style="
                            width: 14px; height: 14px; border-radius: 50%;
                            background: #22c55e;
                            border: 2.5px solid #fff;
                            box-shadow: 0 0 0 3px rgba(34,197,94,0.35), 0 2px 8px rgba(0,0,0,0.5);
                        "></div>`,
                        iconSize: [14, 14],
                        iconAnchor: [7, 7],
                    });
                    return (
                        <Marker key={`live-${i}`} position={[b.lat, b.lng]} icon={LiveBusIcon} zIndexOffset={200 + i}>
                            <Popup>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "2px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#22c55e" }}>
                                            En tiempo real
                                        </span>
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b7a" }}>
                                        Ubicación compartida por un pasajero
                                        {b.ramal ? ` · ${b.ramal}` : ""}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {arribos.map((a, i) => {
                    const lat = parseFloat(a.Latitud);
                    const lon = parseFloat(a.Longitud);
                    if (Number.isNaN(lat) || Number.isNaN(lon) || lat === 0) return null;

                    return (
                        <Marker
                            key={i}
                            position={[lat, lon]}
                            icon={createBusSpriteIcon(rumbosPorArribo[i] ?? 0)}
                            zIndexOffset={100 + i}
                        >
                            <Popup>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
                                    <div style={{ background: "var(--color-secondary)", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, display: "inline-block", width: "fit-content" }}>
                                        Línea {a.DescripcionLinea}
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#6b6b7a", marginTop: 2 }}>
                                        {(a.DescripcionCartelBandera ?? a.DescripcionBandera ?? "").toUpperCase()}
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: getEtaClass(a.Arribo) === "warn" ? "#0099ff" : "#22c55e", marginTop: 4 }}>
                                        {a.Arribo}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            ) : (
                <div
                    style={{ height: "100%", width: "100%", flex: 1, background: "#090909", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-hidden
                >
                    <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "3px solid rgba(255,255,255,0.1)",
                        borderTopColor: "var(--color-accent, #0099ff)",
                        animation: "spin 0.8s linear infinite",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}

            {isFullscreen && arribos.length > 0 ? (
                <div style={{ position: "absolute", bottom: envLocalSafeAreaBottom(16), left: 16, right: 16, zIndex: 1000, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", display: "flex", gap: 16, alignItems: "center", animation: "slide-up 0.3s ease" }}>
                    <div style={{ background: "var(--color-secondary)", color: "#fff", padding: "8px 12px", borderRadius: "8px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, letterSpacing: 1, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,153,255,0.3)" }}>
                        {arribos[0].DescripcionLinea}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--color-text-dim)", letterSpacing: 0.5 }}>
                            {(arribos[0].DescripcionCartelBandera ?? arribos[0].DescripcionBandera ?? "").toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 800, color: getEtaClass(arribos[0].Arribo) === "warn" ? "var(--color-secondary)" : "var(--color-success)" }}>
                            {arribos[0].Arribo}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
});

export default BusMap;
