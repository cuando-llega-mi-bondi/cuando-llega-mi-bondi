/**
 * Catálogo curado de lugares populares en Mar del Plata para el flujo
 * "Cómo llego". Coordenadas aproximadas (±100m); el routing OSRM corrige
 * el último tramo a pie.
 */

export type PlaceCategory =
    | "transporte"
    | "playa"
    | "plaza"
    | "comercio"
    | "salud"
    | "educacion"
    | "cultura"
    | "deporte";

export type Place = {
    id: string;
    name: string;
    /** Sinónimos / alias para búsqueda. */
    aliases?: string[];
    category: PlaceCategory;
    lat: number;
    lng: number;
    /** Una nota corta para mostrar (barrio, calle, etc.). */
    hint?: string;
    /** Lugares destacados aparecen como chips de sugerencia. */
    featured?: boolean;
};

export const PLACES: Place[] = [
    // Transporte
    {
        id: "terminal-omnibus",
        name: "Terminal de Ómnibus",
        aliases: ["terminal", "micros", "Sáenz Peña"],
        category: "transporte",
        lat: -38.0093,
        lng: -57.5481,
        hint: "Sáenz Peña 100",
        featured: true,
    },
    {
        id: "aeropuerto-piazzolla",
        name: "Aeropuerto Astor Piazzolla",
        aliases: ["aeropuerto", "camet"],
        category: "transporte",
        lat: -37.9342,
        lng: -57.5733,
        hint: "Camet",
    },
    {
        id: "estacion-norte",
        name: "Estación de Tren",
        aliases: ["tren", "ferrocarril", "estación norte"],
        category: "transporte",
        lat: -38.0142,
        lng: -57.555,
        hint: "Av. Luro y Italia",
    },

    // Playas
    {
        id: "playa-bristol",
        name: "Playa Bristol",
        aliases: ["bristol", "rambla", "centro"],
        category: "playa",
        lat: -38.0061,
        lng: -57.5429,
        featured: true,
    },
    {
        id: "playa-grande",
        name: "Playa Grande",
        aliases: ["grande"],
        category: "playa",
        lat: -38.0274,
        lng: -57.5266,
        featured: true,
    },
    {
        id: "playa-varese",
        name: "Playa Varese",
        aliases: ["varese"],
        category: "playa",
        lat: -38.0163,
        lng: -57.5301,
    },
    {
        id: "playa-chica",
        name: "Playa Chica",
        category: "playa",
        lat: -38.0235,
        lng: -57.5279,
    },
    {
        id: "la-perla",
        name: "La Perla",
        aliases: ["playa la perla"],
        category: "playa",
        lat: -37.9921,
        lng: -57.554,
        featured: true,
    },
    {
        id: "punta-mogotes",
        name: "Punta Mogotes",
        aliases: ["mogotes", "balnearios"],
        category: "playa",
        lat: -38.0735,
        lng: -57.5377,
    },
    {
        id: "faro",
        name: "Faro de Punta Mogotes",
        aliases: ["faro"],
        category: "playa",
        lat: -38.0866,
        lng: -57.5269,
    },

    // Plazas y paseos
    {
        id: "plaza-mitre",
        name: "Plaza Mitre",
        aliases: ["mitre"],
        category: "plaza",
        lat: -38.0048,
        lng: -57.5483,
        featured: true,
    },
    {
        id: "plaza-colon",
        name: "Plaza Colón",
        aliases: ["colón", "colon"],
        category: "plaza",
        lat: -38.0122,
        lng: -57.5443,
    },
    {
        id: "plaza-san-martin",
        name: "Plaza San Martín",
        aliases: ["san martín", "san martin", "catedral"],
        category: "plaza",
        lat: -38.0023,
        lng: -57.5526,
    },
    {
        id: "plaza-espana",
        name: "Plaza España",
        aliases: ["españa", "espana"],
        category: "plaza",
        lat: -38.0193,
        lng: -57.5476,
    },
    {
        id: "plaza-del-agua",
        name: "Plaza del Agua",
        aliases: ["plaza agua", "biblioteca agua"],
        category: "plaza",
        lat: -38.0085,
        lng: -57.5572,
    },
    {
        id: "parque-camet",
        name: "Parque Camet",
        aliases: ["camet"],
        category: "plaza",
        lat: -37.9314,
        lng: -57.5786,
    },

    // Cultura
    {
        id: "catedral",
        name: "Catedral",
        aliases: ["catedral san pedro", "iglesia"],
        category: "cultura",
        lat: -38.0021,
        lng: -57.5524,
        hint: "Plaza San Martín",
    },
    {
        id: "casino-central",
        name: "Casino Central",
        aliases: ["casino", "rambla"],
        category: "cultura",
        lat: -38.0078,
        lng: -57.5419,
        featured: true,
    },
    {
        id: "torre-tanque",
        name: "Torre Tanque",
        aliases: ["torre", "stella maris"],
        category: "cultura",
        lat: -38.0179,
        lng: -57.5364,
    },
    {
        id: "villa-victoria",
        name: "Villa Victoria",
        aliases: ["victoria ocampo", "villa ocampo"],
        category: "cultura",
        lat: -38.0173,
        lng: -57.5359,
    },
    {
        id: "museo-mar",
        name: "Museo MAR",
        aliases: ["mar"],
        category: "cultura",
        lat: -37.9695,
        lng: -57.5645,
        hint: "Av. Camet y López de Gomara",
    },
    {
        id: "teatro-auditorium",
        name: "Teatro Auditorium",
        aliases: ["auditorium"],
        category: "cultura",
        lat: -38.0084,
        lng: -57.5439,
    },

    // Comercio
    {
        id: "shopping-los-gallegos",
        name: "Shopping Los Gallegos",
        aliases: ["los gallegos", "shopping centro"],
        category: "comercio",
        lat: -38.0028,
        lng: -57.5527,
        featured: true,
    },
    {
        id: "paseo-aldrey",
        name: "Paseo Aldrey",
        aliases: ["aldrey"],
        category: "comercio",
        lat: -38.0099,
        lng: -57.5438,
    },
    {
        id: "centro-comercial-guemes",
        name: "Comercial Güemes",
        aliases: ["güemes", "guemes"],
        category: "comercio",
        lat: -38.0237,
        lng: -57.546,
    },
    {
        id: "mercado-puerto",
        name: "Mercado del Puerto",
        aliases: ["centro comercial puerto"],
        category: "comercio",
        lat: -38.04,
        lng: -57.5403,
    },

    // Salud
    {
        id: "higa",
        name: "HIGA Mar del Plata",
        aliases: ["higa", "hospital interzonal", "hospital regional"],
        category: "salud",
        lat: -37.9928,
        lng: -57.5821,
    },
    {
        id: "hospital-materno",
        name: "Hospital Materno Infantil",
        aliases: ["materno", "materno infantil"],
        category: "salud",
        lat: -37.9826,
        lng: -57.5731,
    },
    {
        id: "hospital-privado",
        name: "Hospital Privado de Comunidad",
        aliases: ["hpc", "privado comunidad"],
        category: "salud",
        lat: -38.0289,
        lng: -57.5453,
    },
    {
        id: "clinica-pueyrredon",
        name: "Clínica Pueyrredón",
        aliases: ["pueyrredon"],
        category: "salud",
        lat: -38.001,
        lng: -57.5471,
    },

    // Educación
    {
        id: "unmdp-funes",
        name: "UNMdP — Complejo Universitario Funes",
        aliases: ["unmdp", "universidad", "funes"],
        category: "educacion",
        lat: -37.9357,
        lng: -57.5582,
        featured: true,
    },
    {
        id: "unmdp-deanfunes",
        name: "UNMdP — Económicas",
        aliases: ["económicas", "fce"],
        category: "educacion",
        lat: -37.9893,
        lng: -57.5563,
    },
    {
        id: "utn-mdp",
        name: "UTN Mar del Plata",
        aliases: ["utn"],
        category: "educacion",
        lat: -38.0246,
        lng: -57.5379,
    },

    // Deporte / eventos
    {
        id: "estadio-minella",
        name: "Estadio José María Minella",
        aliases: ["minella", "mundialista"],
        category: "deporte",
        lat: -37.9398,
        lng: -57.5526,
        featured: true,
    },
    {
        id: "estadio-aldosivi",
        name: "Estadio Aldosivi (José María Minella alterno)",
        aliases: ["aldosivi"],
        category: "deporte",
        lat: -37.9398,
        lng: -57.5526,
    },
    {
        id: "polideportivo-islas-malvinas",
        name: "Polideportivo Islas Malvinas",
        aliases: ["polideportivo"],
        category: "deporte",
        lat: -37.9412,
        lng: -57.5546,
    },
    {
        id: "aquasol",
        name: "Aquasol Resort",
        aliases: ["aquasol"],
        category: "deporte",
        lat: -37.9355,
        lng: -57.6001,
    },
];

const norm = (s: string) =>
    s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

export function searchPlaces(q: string, limit = 10): Place[] {
    const query = norm(q.trim());
    if (!query) return [];
    const out: Array<{ p: Place; score: number }> = [];
    for (const p of PLACES) {
        const haystacks = [p.name, ...(p.aliases ?? [])].map(norm);
        let best = -1;
        for (const h of haystacks) {
            if (h === query) {
                best = 100;
                break;
            }
            if (h.startsWith(query)) {
                best = Math.max(best, 80);
                continue;
            }
            if (h.includes(query)) {
                best = Math.max(best, 50);
            }
        }
        if (best > 0) out.push({ p, score: best });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, limit).map((x) => x.p);
}

export const FEATURED_PLACES = PLACES.filter((p) => p.featured);
