import type {
  DemoFavorite,
  DemoItinerario,
  DemoRoutine,
  DemoSearchResult,
  DemoStop,
  DemoUser,
} from "./types";

export const DEMO_STOPS: DemoStop[] = [
  { id: "P1940", nombre: "Av Juan H. Jara y Río Negro", calle: "Av Juan H. Jara", altura: "3850", coords: { lat: -38.0405, lng: -57.565 }, lineas: ["541", "542", "552"] },
  { id: "P0214", nombre: "Plaza San Martín", calle: "San Martín", altura: "2900", coords: { lat: -38.0028, lng: -57.5443 }, lineas: ["511", "522", "541", "552"] },
  { id: "P0876", nombre: "Plaza Mitre", calle: "Av Colón", altura: "2200", coords: { lat: -38.0055, lng: -57.5435 }, lineas: ["511", "551", "562"] },
  { id: "P3201", nombre: "Playa Grande", calle: "Av Patricio Peralta Ramos", altura: "5800", coords: { lat: -38.029, lng: -57.529 }, lineas: ["541", "551", "573"] },
  { id: "P0512", nombre: "Plaza Colón", calle: "Av Pedro Luro", altura: "1500", coords: { lat: -37.9958, lng: -57.5483 }, lineas: ["511", "522", "525", "562"] },
  { id: "P1102", nombre: "Av Independencia y Luro", calle: "Av Independencia", altura: "2300", coords: { lat: -38.0044, lng: -57.5554 }, lineas: ["511", "541", "542", "591"] },
  { id: "P2207", nombre: "Terminal Estación Sur", calle: "Av Champagnat", altura: "2500", coords: { lat: -37.987, lng: -57.5594 }, lineas: ["511", "554", "562", "593"] },
  { id: "P4019", nombre: "Faro Punta Mogotes", calle: "Av Martínez de Hoz", altura: "100", coords: { lat: -38.082, lng: -57.547 }, lineas: ["541", "573"] },
  { id: "P0721", nombre: "Universidad — Funes y Roca", calle: "Funes", altura: "3350", coords: { lat: -38.0107, lng: -57.5491 }, lineas: ["531", "552", "562"] },
  { id: "P1856", nombre: "Av Juan B. Justo y Champagnat", calle: "Av Juan B. Justo", altura: "4500", coords: { lat: -38.0218, lng: -57.5817 }, lineas: ["542", "591"] },
  { id: "P0339", nombre: "Av Edison y Tetamanti", calle: "Av Edison", altura: "1100", coords: { lat: -38.045, lng: -57.5762 }, lineas: ["552", "562"] },
  { id: "P2618", nombre: "Hospital Materno Infantil", calle: "Castelli", altura: "6900", coords: { lat: -38.0392, lng: -57.5871 }, lineas: ["542", "554", "591"] },
  { id: "P1431", nombre: "Aquarium — Av Martínez de Hoz", calle: "Av Martínez de Hoz", altura: "5600", coords: { lat: -38.0888, lng: -57.5462 }, lineas: ["541", "551"] },
  { id: "P3050", nombre: "Av Constitución y Tejedor", calle: "Av Constitución", altura: "5400", coords: { lat: -38.0212, lng: -57.581 }, lineas: ["542", "552"] },
  { id: "P0918", nombre: "Estadio Mundialista", calle: "Av de las Olimpíadas", altura: "1", coords: { lat: -37.937, lng: -57.561 }, lineas: ["521", "525"] },
  { id: "P0145", nombre: "Av Colón y Buenos Aires", calle: "Av Colón", altura: "1500", coords: { lat: -37.998, lng: -57.5471 }, lineas: ["511", "541", "551"] },
  { id: "P2901", nombre: "Punta Iglesia", calle: "Bv. Marítimo", altura: "200", coords: { lat: -38.0065, lng: -57.5388 }, lineas: ["541", "551", "573"] },
  { id: "P0667", nombre: "Av Champagnat y 9 de Julio", calle: "Av Champagnat", altura: "3200", coords: { lat: -37.9925, lng: -57.5612 }, lineas: ["554", "562", "593"] },
];

const stopById = (id: string) => {
  const s = DEMO_STOPS.find((s) => s.id === id);
  if (!s) throw new Error(`stop ${id} not found`);
  return s;
};

export const DEMO_FAVORITES: DemoFavorite[] = [
  { id: "fav-1", apodo: "Casa", stopId: "P1940", emoji: "🏠", proximoArribo: { linea: "541", minutos: 7, bandera: "Centro" } },
  { id: "fav-2", apodo: "Laburo", stopId: "P0214", emoji: "💼", proximoArribo: { linea: "522", minutos: 12, bandera: "Puerto" } },
  { id: "fav-3", apodo: "Gimnasio", stopId: "P3201", emoji: "🏋️", proximoArribo: { linea: "551", minutos: 4, bandera: "Faro Norte" } },
  { id: "fav-4", apodo: "Familia", stopId: "P0876", emoji: "👨‍👩‍👧", proximoArribo: { linea: "562", minutos: 19, bandera: "Aeropuerto" } },
];

export const DEMO_ROUTINES: DemoRoutine[] = [
  {
    id: "rt-despertador",
    kind: "despertador",
    titulo: "Despertador",
    descripcion: "Te aviso 7 min antes del próximo 541 desde Casa",
    hora: "07:00",
    dias: ["L", "M", "X", "J", "V"],
    origen: "Casa",
    linea: "541",
    enabled: true,
    vecesEstaSemana: 4,
  },
  {
    id: "rt-ida-trabajo",
    kind: "ida-trabajo",
    titulo: "Ida al trabajo",
    descripcion: "Itinerario Casa → Laburo, con timing puerta-a-puerta",
    hora: "08:30",
    dias: ["L", "M", "X", "J", "V"],
    origen: "Casa",
    destino: "Laburo",
    linea: "541",
    enabled: true,
    vecesEstaSemana: 4,
  },
  {
    id: "rt-vuelta-trabajo",
    kind: "vuelta-trabajo",
    titulo: "Vuelta del trabajo",
    descripcion: "Itinerario Laburo → Casa, con la línea más rápida ahora",
    hora: "18:00",
    dias: ["L", "M", "X", "J", "V"],
    origen: "Laburo",
    destino: "Casa",
    linea: "522",
    enabled: true,
    vecesEstaSemana: 3,
  },
];

export const DEMO_USER: DemoUser = {
  nombre: "Nahuel",
  iniciales: "N",
  ubicacion: { lat: -38.0405, lng: -57.565 },
  zonaHabitual: "Constitución",
  viajesEstaSemana: 10,
  favoritos: DEMO_FAVORITES,
  rutinas: DEMO_ROUTINES,
};

export const DEMO_LINES: { codigo: string; descripcion: string; recorrido: string }[] = [
  { codigo: "511", descripcion: "Línea 511 — Centro / Aeropuerto", recorrido: "Plaza Colón → Plaza San Martín → Aeropuerto" },
  { codigo: "522", descripcion: "Línea 522 — Puerto / Camet", recorrido: "Puerto → Centro → Camet Norte" },
  { codigo: "525", descripcion: "Línea 525 — Mundialista", recorrido: "Estadio → Centro → Plaza Colón" },
  { codigo: "541", descripcion: "Línea 541 — Centro / Faro", recorrido: "Centro → Constitución → Punta Mogotes" },
  { codigo: "542", descripcion: "Línea 542 — Constitución / Hospital", recorrido: "Hospital MI → Constitución → Centro" },
  { codigo: "551", descripcion: "Línea 551 — Costera Sur", recorrido: "Plaza Mitre → Playa Grande → Aquarium" },
  { codigo: "552", descripcion: "Línea 552 — Universitaria", recorrido: "Universidad → Centro → Constitución" },
  { codigo: "562", descripcion: "Línea 562 — Aeropuerto", recorrido: "Plaza Colón → Camet → Aeropuerto" },
  { codigo: "573", descripcion: "Línea 573 — Costera Norte", recorrido: "Punta Iglesia → Playa Grande → Faro" },
  { codigo: "591", descripcion: "Línea 591 — Sur / Hospital", recorrido: "Av Juan B. Justo → Hospital MI → Centro" },
];

const PLACES: { nombre: string; tipo: string; coords: { lat: number; lng: number } }[] = [
  { nombre: "Plaza San Martín", tipo: "Plaza", coords: { lat: -38.0028, lng: -57.5443 } },
  { nombre: "Plaza Mitre", tipo: "Plaza", coords: { lat: -38.0055, lng: -57.5435 } },
  { nombre: "Universidad CAECE", tipo: "Universidad", coords: { lat: -38.0107, lng: -57.5491 } },
  { nombre: "Aquarium MDP", tipo: "Atracción", coords: { lat: -38.0888, lng: -57.5462 } },
  { nombre: "Hospital Materno Infantil", tipo: "Hospital", coords: { lat: -38.0392, lng: -57.5871 } },
  { nombre: "Estadio Mundialista", tipo: "Estadio", coords: { lat: -37.937, lng: -57.561 } },
  { nombre: "Terminal de Ómnibus", tipo: "Terminal", coords: { lat: -37.987, lng: -57.5594 } },
];

export function searchDemo(q: string): DemoSearchResult[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const results: DemoSearchResult[] = [];

  for (const linea of DEMO_LINES) {
    if (linea.codigo.includes(query) || linea.descripcion.toLowerCase().includes(query)) {
      results.push({ kind: "linea", codigo: linea.codigo, descripcion: linea.descripcion, recorrido: linea.recorrido });
    }
  }
  for (const stop of DEMO_STOPS) {
    if (
      stop.id.toLowerCase().includes(query) ||
      stop.nombre.toLowerCase().includes(query) ||
      stop.calle.toLowerCase().includes(query)
    ) {
      results.push({ kind: "parada", stop });
    }
  }
  for (const place of PLACES) {
    if (place.nombre.toLowerCase().includes(query) || place.tipo.toLowerCase().includes(query)) {
      results.push({ kind: "lugar", nombre: place.nombre, tipo: place.tipo, coords: place.coords });
    }
  }
  return results.slice(0, 12);
}

export const DEMO_ITINERARIOS: DemoItinerario[] = [
  {
    id: "casa-laburo",
    origen: "Casa",
    destino: "Laburo (Plaza San Martín)",
    duracionTotalMin: 28,
    duracionCaminando: 9,
    precio: "$ 480",
    pasos: [
      { tipo: "caminar", duracionMin: 4, distanciaMts: 280, instruccion: "Caminá 280 m hasta la parada Av Juan H. Jara y Río Negro" },
      { tipo: "bus", linea: "541", bandera: "Centro", paradaSubida: stopById("P1940").nombre, paradaBajada: stopById("P0214").nombre, duracionMin: 19, paradas: 14 },
      { tipo: "caminar", duracionMin: 5, distanciaMts: 320, instruccion: "Caminá 320 m hasta tu destino sobre San Martín" },
    ],
  },
  {
    id: "casa-aquarium",
    origen: "Casa",
    destino: "Aquarium MDP",
    duracionTotalMin: 41,
    duracionCaminando: 7,
    precio: "$ 480",
    pasos: [
      { tipo: "caminar", duracionMin: 3, distanciaMts: 180, instruccion: "Caminá 180 m hasta Av Juan H. Jara" },
      { tipo: "bus", linea: "541", bandera: "Faro Sur", paradaSubida: stopById("P1940").nombre, paradaBajada: stopById("P1431").nombre, duracionMin: 34, paradas: 22 },
      { tipo: "caminar", duracionMin: 4, distanciaMts: 250, instruccion: "Caminá 250 m hasta el ingreso del Aquarium" },
    ],
  },
  {
    id: "centro-mundialista",
    origen: "Plaza San Martín",
    destino: "Estadio Mundialista",
    duracionTotalMin: 35,
    duracionCaminando: 10,
    precio: "$ 480",
    pasos: [
      { tipo: "caminar", duracionMin: 6, distanciaMts: 420, instruccion: "Caminá 420 m hasta Plaza Colón" },
      { tipo: "bus", linea: "525", bandera: "Estadio", paradaSubida: stopById("P0512").nombre, paradaBajada: stopById("P0918").nombre, duracionMin: 25, paradas: 18 },
      { tipo: "caminar", duracionMin: 4, distanciaMts: 290, instruccion: "Caminá 290 m hasta el ingreso del estadio" },
    ],
  },
];

export function favoriteByApodo(apodo: string) {
  return DEMO_FAVORITES.find((f) => f.apodo.toLowerCase() === apodo.toLowerCase());
}
export { stopById };
