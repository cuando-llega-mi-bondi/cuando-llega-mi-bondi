import type { Itinerary, RoutingGraph } from "@/lib/routing/types";
import {
    buildSegLensAndCum,
    projectLatLngOntoPolylineArc,
    slicePolylineBetweenArcs,
} from "@/lib/geo/polylineSlice";

const RIDE_COLORS = ["#0ea5e9", "#a855f7", "#f59e0b", "#10b981"];
export type ItineraryMapSegment = {
    kind: "walk" | "ride";
    color: string;
    /** `null` = línea sólida (bondi) */
    dashArray: string | null;
    /** Posiciones [lat, lng] en orden */
    positions: [number, number][];
};

/** Geometría lista para Leaflet (polilíneas + extremos del viaje). */
export type ItineraryMapView = {
    segments: ItineraryMapSegment[];
    origin: { lat: number; lng: number };
    dest: { lat: number; lng: number };
};

type RideLeg = Extract<Itinerary["legs"][number], { kind: "ride" }>;

function ridePolyline(graph: RoutingGraph, leg: RideLeg): [number, number][] {
    const chordAlongStops = (): [number, number][] => {
        const out: [number, number][] = [];
        for (const id of leg.paradaIdsAlong) {
            const p = graph.paradas.get(id);
            if (!p) continue;
            out.push([p.lat, p.lng]);
        }
        return out;
    };

    const seq = graph.sequences[leg.sequenceIdx];
    const pts = seq?.polylineLatLng;
    if (!pts || pts.length < 2) return chordAlongStops();

    const fromP = graph.paradas.get(leg.fromParadaId);
    const toP = graph.paradas.get(leg.toParadaId);
    if (!fromP || !toP) return chordAlongStops();

    const { segLens, cum } = buildSegLensAndCum(pts);
    const arcFrom = projectLatLngOntoPolylineArc(fromP.lat, fromP.lng, pts, segLens, cum);
    const arcTo = projectLatLngOntoPolylineArc(toP.lat, toP.lng, pts, segLens, cum);
    if (arcFrom == null || arcTo == null) return chordAlongStops();

    const sliced = slicePolylineBetweenArcs(pts, arcFrom, arcTo);
    if (sliced.length < 2) return chordAlongStops();
    return sliced;
}
/**
 * A partir del itinerario y el grafo, arma segmentos para dibujar en el mapa.
 * `oLat`/`oLng` y `dLat`/`dLng` son los puntos del usuario (marcadores).
 */
export function buildItineraryMapView(
    graph: RoutingGraph,
    it: Itinerary,
    oLat: number,
    oLng: number,
    dLat: number,
    dLng: number,
): ItineraryMapView {
    const segments: ItineraryMapSegment[] = [];
    let rideColorIdx = 0;

    for (const leg of it.legs) {
        if (leg.kind === "walk") {
            segments.push({
                kind: "walk",
                color: "#64748b",
                dashArray: "8 10",
                positions: [
                    [leg.fromLat, leg.fromLng],
                    [leg.toLat, leg.toLng],
                ],
            });
        } else {
            const positions = ridePolyline(graph, leg);
            if (positions.length >= 2) {
                segments.push({
                    kind: "ride",
                    color: RIDE_COLORS[rideColorIdx % RIDE_COLORS.length]!,
                    dashArray: null,
                    positions,
                });
            }
            rideColorIdx += 1;
        }
    }

    return {
        segments,
        origin: { lat: oLat, lng: oLng },
        dest: { lat: dLat, lng: dLng },
    };
}
