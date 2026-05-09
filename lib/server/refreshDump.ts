/**
 * Invalidación del cache de la referencia estática MGP. Llamar después de
 * regenerar `data/mgp-static-dump.json` y correr `bun run split-static`,
 * para que las funciones `'use cache'` en `lib/server/loadStaticDump.ts`
 * sirvan los archivos nuevos sin redeploy.
 *
 * - `refreshLineas()` invalida el listado de líneas.
 * - `refreshLinea(codLinea)` invalida una línea puntual.
 * - `refreshAllLineas(codLineas)` invalida varias en una sola call.
 */

"use server";

import { revalidateTag } from "next/cache";

export async function refreshLineas(): Promise<void> {
    revalidateTag("mgp-lineas", "max");
}

export async function refreshLinea(codLinea: string): Promise<void> {
    revalidateTag(`mgp-linea-${codLinea}`, "max");
}

export async function refreshAllLineas(codLineas: string[]): Promise<void> {
    revalidateTag("mgp-lineas", "max");
    for (const cod of codLineas) {
        revalidateTag(`mgp-linea-${cod}`, "max");
    }
}
