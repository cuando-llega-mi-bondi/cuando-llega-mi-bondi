import type { Linea } from "@shared/types";

/**
 * `CodigoLineaParada` es el código interno de MGP (ej. "100"), no lo que
 * dice la gente en la parada. El número real de línea es el que arranca
 * `Descripcion` — "521" para líneas MGP, "221 COSTA AZUL" para las manuales.
 */
export function lineaNumero(line: Linea): string {
    return line.Descripcion.trim().match(/^\d+/)?.[0] ?? line.CodigoLineaParada;
}
