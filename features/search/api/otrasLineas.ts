import type { Linea } from "@shared/types";
import { post } from "@shared/api/client";

type BanderaParada = { DescripcionCorta?: string; DescripcionLinea?: string };

/** Índices por código exacto y por código numérico para resolver banderas en O(1). */
type CatalogIndex = {
    byExactCode: Map<string, Linea>;
    byNumericCode: Map<number, Linea>;
};

function buildCatalogIndex(catalog: Linea[]): CatalogIndex {
    const byExactCode = new Map<string, Linea>();
    const byNumericCode = new Map<number, Linea>();
    for (const l of catalog) {
        const cod = l.CodigoLineaParada.trim();
        if (!byExactCode.has(cod)) byExactCode.set(cod, l);
        const n = parseInt(cod, 10);
        if (!Number.isNaN(n) && !byNumericCode.has(n)) byNumericCode.set(n, l);
    }
    return { byExactCode, byNumericCode };
}

/** MGP devuelve el número de línea en `DescripcionLinea`; el catálogo usa `CodigoLineaParada` (a veces distinto como string). */
function resolveLineaFromBandera(
    descripcionLinea: string,
    catalog: Linea[],
    index: CatalogIndex,
): Linea | undefined {
    const raw = descripcionLinea.trim();
    if (!raw) return undefined;

    const exact = index.byExactCode.get(raw);
    if (exact) return exact;

    const nApi = parseInt(raw, 10);
    if (!Number.isNaN(nApi)) {
        const byNum = index.byNumericCode.get(nApi);
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

    const index = buildCatalogIndex(todasLasLineas);
    const seen = new Set<string>();
    const result: Linea[] = [];

    for (const b of banderas) {
        const label = String(b?.DescripcionLinea ?? "").trim();
        if (!label) continue;

        const linea = resolveLineaFromBandera(label, todasLasLineas, index);
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
