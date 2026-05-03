import type { Linea } from "@/lib/types";
import { post } from "./client";

type BanderaParada = { DescripcionCorta?: string; DescripcionLinea?: string };

/** MGP devuelve el número de línea en `DescripcionLinea`; el catálogo usa `CodigoLineaParada` (a veces distinto como string). */
function resolveLineaFromBandera(
    descripcionLinea: string,
    catalog: Linea[],
): Linea | undefined {
    const raw = descripcionLinea.trim();
    if (!raw) return undefined;

    const exact = catalog.find((l) => l.CodigoLineaParada.trim() === raw);
    if (exact) return exact;

    const nApi = parseInt(raw, 10);
    if (!Number.isNaN(nApi)) {
        const byNum = catalog.find((l) => {
            const cod = l.CodigoLineaParada.trim();
            const n = parseInt(cod, 10);
            return !Number.isNaN(n) && n === nApi;
        });
        if (byNum) return byNum;
    }

    return catalog.find((l) => {
        const d = l.Descripcion.trim();
        return d === raw || d.startsWith(`${raw} `) || d.startsWith(`${raw}-`);
    });
}

function sameLineServiceCode(a: string, b: string): boolean {
    const ta = a.trim();
    const tb = b.trim();
    if (ta === tb) return true;
    const na = parseInt(ta, 10);
    const nb = parseInt(tb, 10);
    return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb;
}

/**
 * Líneas distintas a la actual que pasan por la misma parada física (MGP).
 */
export async function findOtrasLineasEnParada(
    identificadorParada: string,
    currentLineaCode: string,
    todasLasLineas: Linea[],
): Promise<Linea[]> {
    const data = await post("RecuperarBanderasAsociadasAParada", {
        identificadorParada,
    });

    const banderas = data?.banderas as BanderaParada[] | undefined;
    if (!Array.isArray(banderas) || banderas.length === 0) return [];

    const seen = new Set<string>();
    const result: Linea[] = [];

    for (const b of banderas) {
        const label = String(b?.DescripcionLinea ?? "").trim();
        if (!label) continue;

        const linea = resolveLineaFromBandera(label, todasLasLineas);
        if (!linea || linea.isManual) continue;

        if (
            linea.CodigoLineaParada === currentLineaCode ||
            sameLineServiceCode(linea.CodigoLineaParada, currentLineaCode)
        ) {
            continue;
        }

        if (seen.has(linea.CodigoLineaParada)) continue;
        seen.add(linea.CodigoLineaParada);
        result.push(linea);
    }

    result.sort((a, b) => {
        const na = parseInt(a.CodigoLineaParada, 10);
        const nb = parseInt(b.CodigoLineaParada, 10);
        if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) {
            return na - nb;
        }
        return a.CodigoLineaParada.localeCompare(b.CodigoLineaParada);
    });

    return result;
}
