export interface Linea {
  CodigoLineaParada: string;
  Descripcion: string;
  CodigoEntidad: string;
  CodigoEmpresa: number;
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
  DescripcionCartelBandera: string;
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
