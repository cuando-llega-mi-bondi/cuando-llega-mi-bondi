/**
 * Construcción pura del grafo de routing (paradas + secuencias + vecinos a pie)
 * a partir de los dumps estáticos ya cargados. Sin dependencias de Next: se usa
 * tanto en runtime (vía `transitStaticModels`) como en scripts de auditoría
 * (`scripts/audit-stop-order.ts`, `scripts/smoke-plan.ts`).
 */

import { haversineMeters } from "@shared/geo/haversine";
import { cleanLabel } from "@shared/utils";
import type { Linea } from "@shared/types";
import type { ParadaMapa, PuntoRecorrido, RamalData } from "@features/route/types";
import type { StaticLineDump } from "@/lib/server/staticDumpTypes";
import type {
    ParadaGeo,
    RoutingGraph,
    SequenceRef,
    StopSequence,
    WalkNeighbor,
} from "@features/trip-planner/types";

const WALK_RADIUS_METERS = 300;
const GRID_CELL_DEG = 0.003;

/**
 * Paradas a más de esta distancia de la polilínea no pertenecen al ramal: el
 * dump asigna a algunos ramales paradas de otras variantes del servicio, y al
 * proyectarlas rompen el orden de la secuencia. Umbral elegido con
 * `scripts/audit-stop-order.ts` (129 → 4 pares de orden imposible).
 */
export const MAX_STOP_TO_POLYLINE_METERS = 80;

type MutableStop = {
    identificador: string;
    lat: number;
    lng: number;
    abreviaturaBandera: string | null;
    calleLabel: string | null;
    interseccionLabel: string | null;
    lineasMap: Map<string, string>;
};

type SegGeom = {
    aLat: number;
    aLng: number;
    /** Vector del segmento en metros (x = este, y = norte). */
    bx: number;
    by: number;
    cosLat: number;
    len: number;
    /** Longitud de arco acumulada al inicio del segmento. */
    cumArc: number;
};

export function buildPolylineGeometry(pts: PuntoRecorrido[]): SegGeom[] {
    const segs: SegGeom[] = [];
    let cumArc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const refLat = (a.Latitud + b.Latitud) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const bx = (b.Longitud - a.Longitud) * cosLat * 111_320;
        const by = (b.Latitud - a.Latitud) * 111_320;
        const len = Math.sqrt(bx * bx + by * by);
        segs.push({ aLat: a.Latitud, aLng: a.Longitud, bx, by, cosLat, len, cumArc });
        cumArc += len;
    }
    return segs;
}

export type StopProjection = {
    arcMeters: number;
    /** Distancia perpendicular de la parada a la polilínea. */
    perpMeters: number;
};

export function projectStopOntoPolyline(
    lat: number,
    lng: number,
    segs: SegGeom[],
): StopProjection | null {
    let best: StopProjection | null = null;
    for (const s of segs) {
        const px = (lng - s.aLng) * s.cosLat * 111_320;
        const py = (lat - s.aLat) * 111_320;
        const segSq = s.bx * s.bx + s.by * s.by;
        const t =
            segSq < 1e-9 ? 0 : Math.max(0, Math.min(1, (px * s.bx + py * s.by) / segSq));
        const dx = px - s.bx * t;
        const dy = py - s.by * t;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!best || dist < best.perpMeters) {
            best = { arcMeters: s.cumArc + s.len * t, perpMeters: dist };
        }
    }
    return best;
}

/** Paradas del recorrido que pertenecen a un ramal dado. */
export function stopsOfRamal(paradas: ParadaMapa[], ramal: RamalData): ParadaMapa[] {
    return paradas.filter((p) =>
        p.ramales.some((r) => r === ramal.label || r === ramal.key || r === ""),
    );
}

export function orderStopsAlongPolyline(
    paradas: ParadaMapa[],
    ramal: RamalData,
    maxPerpMeters: number = MAX_STOP_TO_POLYLINE_METERS,
): string[] {
    if (ramal.puntos.length < 2) return [];
    const segs = buildPolylineGeometry(ramal.puntos);

    const scored = paradas
        .map((p) => {
            if (p.lat === 0 && p.lng === 0) return null;
            const proj = projectStopOntoPolyline(p.lat, p.lng, segs);
            if (proj == null || proj.perpMeters > maxPerpMeters) return null;
            return { id: p.id, arc: proj.arcMeters };
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
        const paradasDelRamal = stopsOfRamal(paradasRec, ramal);
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

export type LineRow = { linea: Linea; row: StaticLineDump | null };

export function buildTransitModels(lineRows: LineRow[]): {
    paradas: ParadaGeo[];
    graph: RoutingGraph;
} {
    const agg = new Map<string, MutableStop>();
    const allSequences: StopSequence[] = [];

    for (const { linea, row } of lineRows) {
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
}
