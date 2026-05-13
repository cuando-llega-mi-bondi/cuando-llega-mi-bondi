export type LineaEnParada = {
    codigoLineaParada: string;
    descripcion: string;
};

/** Parada física agregada (todas las líneas que pasan). */
export type ParadaGeo = {
    identificador: string;
    lat: number;
    lng: number;
    abreviaturaBandera: string | null;
    calleLabel: string | null;
    interseccionLabel: string | null;
    lineas: LineaEnParada[];
};

export type StopSequence = {
    codLinea: string;
    lineaLabel: string;
    ramalKey: string;
    ramalLabel: string;
    paradaIds: string[];
    /** Vértices [lat, lng] del ramal (misma geometría que Recorridos). Vacío si no hay puntos. */
    polylineLatLng: [number, number][];
};

export type WalkNeighbor = {
    toParadaId: string;
    distMeters: number;
};

export type SequenceRef = {
    sequenceIdx: number;
    positionInSequence: number;
};

export type RoutingGraph = {
    sequences: StopSequence[];
    sequencesByParada: Map<string, SequenceRef[]>;
    walkNeighbors: Map<string, WalkNeighbor[]>;
    paradas: Map<string, ParadaGeo>;
};

export type RouteLegWalk = {
    kind: "walk";
    fromKey: string;
    toKey: string;
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    meters: number;
};

export type RouteLegRide = {
    kind: "ride";
    /** Índice en `graph.sequences` (geometría del ramal). */
    sequenceIdx: number;
    codLinea: string;
    lineaLabel: string;
    ramalKey: string;
    ramalLabel: string;
    fromParadaId: string;
    toParadaId: string;
    fromEsquinaLabel: string | null;
    toEsquinaLabel: string | null;
    paradaIdsAlong: string[];
};

export type RouteLeg = RouteLegWalk | RouteLegRide;

export type Itinerary = {
    legs: RouteLeg[];
    totalRides: number;
    totalWalkMeters: number;
    totalRideMeters: number;
};

export const ORIGIN_KEY = "__origin__";
export const DEST_KEY = "__dest__";
