import { LINES, type Line } from "./lines";
import { STOPS, type Stop } from "./stops";

export type SearchResult =
    | { kind: "linea"; line: Line }
    | { kind: "parada"; stop: Stop };

const MAX_RESULTS = 12;

export function search(q: string): SearchResult[] {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const results: SearchResult[] = [];

    // 1. Líneas: match por descripción (ej. "541", "BATAN")
    for (const line of LINES) {
        if (line.descripcion.toLowerCase().includes(query)) {
            results.push({ kind: "linea", line });
        }
    }

    // 2. Paradas: match SOLO por nombre/dirección.
    // No matcheamos contra ID interno (P11041, 10041Q) — la gente no lo tipea.
    // Si la query es solo números o números+letra (parece código de línea),
    // tampoco metemos paradas — para ver paradas de una línea, click en la línea.
    const looksLikeLineCode = /^[0-9]+[a-z]?$/i.test(query);
    if (!looksLikeLineCode) {
        for (const stop of STOPS) {
            if (stop.nombre.toLowerCase().includes(query)) {
                results.push({ kind: "parada", stop });
                if (results.length >= MAX_RESULTS) break;
            }
        }
    }

    return results.slice(0, MAX_RESULTS);
}
