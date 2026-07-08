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
