export interface Linea {
    CodigoLineaParada: string;
    Descripcion: string;
    CodigoEntidad: string;
    CodigoEmpresa: number;
    isManual?: boolean;
}

export interface Interseccion {
    Codigo: string;
    Descripcion: string;
}

export interface Parada {
    Codigo: string;
    Identificador: string;
    AbreviaturaBandera: string;
    LatitudParada: string | null;
    LongitudParada: string | null;
}

export interface Arribo {
    DescripcionLinea: string;
    DescripcionBandera: string;
    /** Destino en cartel; a veces viene vacío/omitido en la API. */
    DescripcionCartelBandera?: string;
    Arribo: string;
    CodigoLineaParada: string;
    DesvioHorario: string;
    EsAdaptado: string;
    IdentificadorChofer: string;
    IdentificadorCoche: string;
    Latitud: string;
    LatitudParada: string;
    Longitud: string;
    LongitudParada: string;
    UltimaFechaHoraGPS: string;
    MensajeError: string;
}

export interface HistorialEntry {
    id: string;
    paradaId: string;
    codLinea: string;
    descripcionLinea: string;
    descripcionBandera: string;
    calleLabel?: string;
    interseccionLabel?: string;
    timestamp: number;
}

export interface Favorito {
    id: string;
    nombre: string;
    identificadorParada: string;
    codigoLineaParada: string;
    descripcionLinea: string;
    descripcionBandera: string;
}

export interface PuntoRecorrido {
    Descripcion: string;
    AbreviaturaBanderaSMP: string;
    AbreviaturaLineaSMP: string;
    IsPuntoPaso: boolean;
    Latitud: number;
    Longitud: number;
}

export interface RamalData {
    key: string;
    label: string;
    puntos: PuntoRecorrido[];
}

export interface ParadaMapa {
    id: string;
    codigo: string;
    label: string;
    lat: number;
    lng: number;
    ramales: string[];
}
