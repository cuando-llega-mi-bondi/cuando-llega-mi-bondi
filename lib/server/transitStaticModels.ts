import { haversineMeters } from "@shared/geo/haversine";
import { mergeLineasWithManual } from "@features/route/manualRoutes";
import { getLineas, getLineaData } from "@/lib/server/loadStaticDump";
import { loadManualStaticLineDump } from "@/lib/server/loadManualStaticDump";
import { buildTransitModels } from "@/lib/server/transitGraph";
import type { ParadaGeo, RoutingGraph } from "@features/trip-planner/types";

let buildPromise: Promise<{ paradas: ParadaGeo[]; graph: RoutingGraph }> | null =
    null;

/**
 * Construye índice de paradas + grafo de routing una sola vez por proceso
 * (primer request a geo/plan o paradas-cercanas).
 */
export function getTransitStaticModels(): Promise<{
    paradas: ParadaGeo[];
    graph: RoutingGraph;
}> {
    if (!buildPromise) {
        buildPromise = (async () => {
            const lineasRaw = await getLineas();
            const lineas = mergeLineasWithManual(lineasRaw ?? []);
            if (!lineas.length) {
                return {
                    paradas: [],
                    graph: {
                        sequences: [],
                        sequencesByParada: new Map(),
                        walkNeighbors: new Map(),
                        paradas: new Map(),
                    },
                };
            }

            const lineRows = await Promise.all(
                lineas.map(async (linea) => ({
                    linea,
                    row: linea.isManual
                        ? await loadManualStaticLineDump(linea.CodigoLineaParada)
                        : await getLineaData(linea.CodigoLineaParada),
                })),
            );

            return buildTransitModels(lineRows);
        })();
    }
    return buildPromise;
}

export function paradasCercanasDe(
    paradas: ParadaGeo[],
    lat: number,
    lng: number,
    maxMeters: number,
    limit: number,
): { parada: ParadaGeo; distanciaMetros: number }[] {
    return paradas
        .map((p) => ({
            parada: p,
            distanciaMetros: Math.round(haversineMeters(lat, lng, p.lat, p.lng)),
        }))
        .filter((x) => x.distanciaMetros <= maxMeters)
        .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
        .slice(0, limit);
}
