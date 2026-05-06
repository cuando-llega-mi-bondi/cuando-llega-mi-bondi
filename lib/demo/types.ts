export type DemoCoords = { lat: number; lng: number };

export type DemoStop = {
  id: string;
  nombre: string;
  calle: string;
  altura?: string;
  coords: DemoCoords;
  lineas: string[];
};

export type DemoFavorite = {
  id: string;
  apodo: string;
  stopId: string;
  emoji: string;
  proximoArribo: { linea: string; minutos: number; bandera: string };
};

export type DemoRoutineKind = "despertador" | "ida-trabajo" | "vuelta-trabajo";

export type DemoRoutine = {
  id: string;
  kind: DemoRoutineKind;
  titulo: string;
  descripcion: string;
  hora: string;
  dias: ("L" | "M" | "X" | "J" | "V" | "S" | "D")[];
  origen?: string;
  destino?: string;
  linea: string;
  enabled: boolean;
  vecesEstaSemana: number;
};

export type DemoUser = {
  nombre: string;
  iniciales: string;
  ubicacion: DemoCoords;
  zonaHabitual: string;
  viajesEstaSemana: number;
  favoritos: DemoFavorite[];
  rutinas: DemoRoutine[];
};

export type DemoSearchResult =
  | { kind: "linea"; codigo: string; descripcion: string; recorrido: string }
  | { kind: "parada"; stop: DemoStop }
  | { kind: "lugar"; nombre: string; tipo: string; coords: DemoCoords };

export type DemoItinerarioPaso =
  | { tipo: "caminar"; duracionMin: number; distanciaMts: number; instruccion: string }
  | { tipo: "bus"; linea: string; bandera: string; paradaSubida: string; paradaBajada: string; duracionMin: number; paradas: number };

export type DemoItinerario = {
  id: string;
  origen: string;
  destino: string;
  duracionTotalMin: number;
  duracionCaminando: number;
  precio: string;
  pasos: DemoItinerarioPaso[];
};
