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
