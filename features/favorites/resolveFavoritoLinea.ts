import type { Favorito } from "@features/favorites/types";

const isValid = (v: unknown): v is string =>
    typeof v === "string" && v !== "" && v !== "undefined";

/**
 * Resuelve el código de línea de un favorito: campo directo, id
 * (formato paradaId_codLinea) o metadata de líneas vía descripción.
 */
export function resolveFavoritoLinea(
    fav: Favorito,
    descripcionToCode: Map<string, string>,
): string | undefined {
    if (isValid(fav.codigoLineaParada)) return fav.codigoLineaParada;

    const fromId = fav.id.split("_")[1];
    if (isValid(fromId)) return fromId;

    const label = fav.lineaLabel?.trim() || fav.descripcionLinea?.trim();
    if (label) return descripcionToCode.get(label);

    return undefined;
}
