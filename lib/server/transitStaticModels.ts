import { haversineMeters } from "@/lib/geo/haversine";
import { mergeLineasWithManual } from "@/lib/manualRoutes";
import type { Linea, ParadaMapa, PuntoRecorrido, RamalData } from "@/lib/types";
import { getLineas, getLineaData } from "@/lib/server/loadStaticDump";
import { loadManualStaticLineDump } from "@/lib/server/loadManualStaticDump";
import type { StaticLineDump } from "@/lib/staticDumpTypes";
import { cleanLabel } from "@/lib/utils";
import type {
    ParadaGeo,
    RoutingGraph,
    SequenceRef,
    StopSequence,
    WalkNeighbor,
} from "@/lib/routing/types";

const WALK_RADIUS_METERS = 300;
const GRID_CELL_DEG = 0.003;

type MutableStop = {
    identificador: string;
    lat: number;
    lng: number;
    abreviaturaBandera: string | null;
    calleLabel: string | null;
    interseccionLabel: string | null;
    lineasMap: Map<string, string>;
};

function orderStopsAlongPolyline(
    paradas: ParadaMapa[],
    ramal: RamalData,
): string[] {
    const pts = ramal.puntos;
    if (pts.length < 2) return [];
    const segLens: number[] = [];
    const cumArc: number[] = [0];
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const refLat = (a.Latitud + b.Latitud) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const dx = (b.Longitud - a.Longitud) * cosLat * 111_320;
        const dy = (b.Latitud - a.Latitud) * 111_320;
        segLens[i] = Math.sqrt(dx * dx + dy * dy);
        cumArc[i + 1] = cumArc[i] + segLens[i]!;
    }

    const scored = paradas
        .map((p) => {
            if (p.lat === 0 && p.lng === 0) return null;
            const arc = projectOnto(p.lat, p.lng, pts, segLens, cumArc);
            if (arc == null) return null;
            return { id: p.id, arc };
        })
        .filter((x): x is { id: string; arc: number } => x != null)
        .sort((a, b) => (a.arc === b.arc ? a.id.localeCompare(b.id) : a.arc - b.arc));

    const out: string[] = [];
    const seen = new Set<string>();
    for (const { id } of scored) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

function projectOnto(
    lat: number,
    lng: number,
    pts: PuntoRecorrido[],
    segLens: number[],
    cumArc: number[],
): number | null {
    let bestArc = 0;
    let bestDistSq = Number.POSITIVE_INFINITY;
    let found = false;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const refLat = (a.Latitud + b.Latitud) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const bx = (b.Longitud - a.Longitud) * cosLat * 111_320;
        const by = (b.Latitud - a.Latitud) * 111_320;
        const px = (lng - a.Longitud) * cosLat * 111_320;
        const py = (lat - a.Latitud) * 111_320;
        const segSq = bx * bx + by * by;
        const t =
            segSq < 1e-9 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / segSq));
        const projDx = px - bx * t;
        const projDy = py - by * t;
        const distSq = projDx * projDx + projDy * projDy;
        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestArc = cumArc[i]! + segLens[i]! * t;
            found = true;
        }
    }
    return found ? bestArc : null;
}

function cellKey(lat: number, lng: number): string {
    const latCell = Math.floor(lat / GRID_CELL_DEG);
    const lngCell = Math.floor(lng / GRID_CELL_DEG);
    return `${latCell},${lngCell}`;
}

function computeWalkingNeighbors(paradas: ParadaGeo[]): Map<string, WalkNeighbor[]> {
    const grid = new Map<string, ParadaGeo[]>();
    for (const p of paradas) {
        const k = cellKey(p.lat, p.lng);
        const list = grid.get(k) ?? [];
        list.push(p);
        grid.set(k, list);
    }

    const out = new Map<string, WalkNeighbor[]>();
    for (const p of paradas) {
        const baseLat = Math.floor(p.lat / GRID_CELL_DEG);
        const baseLng = Math.floor(p.lng / GRID_CELL_DEG);
        const neighbors: WalkNeighbor[] = [];
        for (let dLat = -1; dLat <= 1; dLat++) {
            for (let dLng = -1; dLng <= 1; dLng++) {
                const key = `${baseLat + dLat},${baseLng + dLng}`;
                const cell = grid.get(key);
                if (!cell) continue;
                for (const q of cell) {
                    if (q.identificador === p.identificador) continue;
                    const d = haversineMeters(p.lat, p.lng, q.lat, q.lng);
                    if (d <= WALK_RADIUS_METERS) {
                        neighbors.push({
                            toParadaId: q.identificador,
                            distMeters: Math.round(d),
                        });
                    }
                }
            }
        }
        if (neighbors.length > 0) {
            neighbors.sort((a, b) => a.distMeters - b.distMeters);
            out.set(p.identificador, neighbors);
        }
    }
    return out;
}

function buildEsquinasByParada(row: StaticLineDump): Map<
    string,
    { calle: string; inter: string }
> {
    const m = new Map<string, { calle: string; inter: string }>();
    const calles = row.calles ?? [];
    const interByCalle = row.interseccionesByCalle ?? {};
    const parByCi = row.paradasByCalleInterseccion ?? {};
    for (const [rawKey, lista] of Object.entries(parByCi)) {
        const tab = rawKey.indexOf("\t");
        if (tab <= 0) continue;
        const codCalle = rawKey.slice(0, tab);
        const codInter = rawKey.slice(tab + 1);
        const calleLabel = cleanLabel(
            calles.find((c) => c.value === codCalle)?.label ?? "",
        );
        const interRow = interByCalle[codCalle]?.find((i) => i.Codigo === codInter);
        const interLabel = cleanLabel(interRow?.Descripcion ?? "");
        if (!Array.isArray(lista)) continue;
        for (const par of lista) {
            const id = par.Identificador;
            if (!id || m.has(id)) continue;
            m.set(id, { calle: calleLabel, inter: interLabel });
        }
    }
    return m;
}

function mergeIntoAgg(
    agg: Map<string, MutableStop>,
    linea: Linea,
    row: StaticLineDump,
): StopSequence[] {
    const codLinea = linea.CodigoLineaParada;
    const descLinea = linea.Descripcion?.trim() || codLinea;
    const esquinasById = buildEsquinasByParada(row);
    const paradasRec = row.recorrido?.paradas ?? [];
    const ramales = row.recorrido?.ramales ?? [];

    for (const p of paradasRec) {
        if (p.lat === 0 && p.lng === 0) continue;
        const esq = esquinasById.get(p.id);
        let partial = agg.get(p.id);
        if (!partial) {
            partial = {
                identificador: p.id,
                lat: p.lat,
                lng: p.lng,
                abreviaturaBandera: p.label?.trim() || null,
                calleLabel: esq?.calle?.trim() || null,
                interseccionLabel: esq?.inter?.trim() || null,
                lineasMap: new Map(),
            };
            agg.set(p.id, partial);
        }
        partial.lineasMap.set(codLinea, descLinea);
    }

    const sequences: StopSequence[] = [];
    for (const ramal of ramales) {
        if (ramal.puntos.length < 2) continue;
        const paradasDelRamal = paradasRec.filter((p) =>
            p.ramales.some((r) => r === ramal.label || r === ramal.key || r === ""),
        );
        if (paradasDelRamal.length < 2) continue;
        const ordered = orderStopsAlongPolyline(paradasDelRamal, ramal);
        if (ordered.length < 2) continue;
        sequences.push({
            codLinea,
            lineaLabel: descLinea,
            ramalKey: ramal.key,
            ramalLabel: ramal.label,
            paradaIds: ordered,
            polylineLatLng: ramal.puntos.map((pt) => [pt.Latitud, pt.Longitud] as [number, number]),
        });
    }
    return sequences;
}

function toParadaGeoList(agg: Map<string, MutableStop>): ParadaGeo[] {
    return Array.from(agg.values()).map((it) => ({
        identificador: it.identificador,
        lat: it.lat,
        lng: it.lng,
        abreviaturaBandera: it.abreviaturaBandera,
        calleLabel: it.calleLabel,
        interseccionLabel: it.interseccionLabel,
        lineas: Array.from(it.lineasMap.entries()).map(([codigoLineaParada, descripcion]) => ({
            codigoLineaParada,
            descripcion,
        })),
    }));
}

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

            const agg = new Map<string, MutableStop>();
            const allSequences: StopSequence[] = [];

            for (const linea of lineas) {
                const row = linea.isManual
                    ? await loadManualStaticLineDump(linea.CodigoLineaParada)
                    : await getLineaData(linea.CodigoLineaParada);
                if (!row) continue;
                const seq = mergeIntoAgg(agg, linea, row);
                allSequences.push(...seq);
            }

            const paradasList = toParadaGeoList(agg);
            const paradasMap = new Map(paradasList.map((p) => [p.identificador, p]));

            const sequencesByParada = new Map<string, SequenceRef[]>();
            allSequences.forEach((seq, sIdx) => {
                seq.paradaIds.forEach((paradaId, pos) => {
                    const list = sequencesByParada.get(paradaId) ?? [];
                    list.push({ sequenceIdx: sIdx, positionInSequence: pos });
                    sequencesByParada.set(paradaId, list);
                });
            });

            const walkNeighbors = computeWalkingNeighbors(paradasList);

            return {
                paradas: paradasList,
                graph: {
                    sequences: allSequences,
                    sequencesByParada,
                    walkNeighbors,
                    paradas: paradasMap,
                },
            };
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
