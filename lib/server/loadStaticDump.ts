/**
 * Acceso a la referencia estática MGP partida en `data/static/`:
 *
 *   data/static/lineas.json              → `getLineas()`
 *   data/static/linea/<codLinea>.json    → `getLineaData(codLinea)`
 *
 * Ambas funciones usan `'use cache'` con `cacheLife('max')`. Invalidación
 * vía `revalidateTag('mgp-lineas')` / `revalidateTag(\`mgp-linea-<cod>\`)`
 * cuando se regenera el dump.
 *
 * Generación: el script `scripts/split-static-dump.ts` produce estos archivos
 * a partir de `data/mgp-static-dump.json` (la fuente de verdad). El JSON
 * monolítico no se lee en runtime.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { Linea } from "@/lib/types";
import type { StaticLineDump } from "@/lib/staticDumpTypes";

const STATIC_DIR = path.join(
    process.cwd(),
    /* turbopackIgnore: true */ "data",
    "static",
);

export async function getLineas(): Promise<Linea[] | null> {
    "use cache";
    cacheLife("max");
    cacheTag("mgp-lineas");
    try {
        const raw = await readFile(
            path.join(STATIC_DIR, "lineas.json"),
            "utf-8",
        );
        return JSON.parse(raw) as Linea[];
    } catch {
        return null;
    }
}

export async function getLineaData(
    codLinea: string,
): Promise<StaticLineDump | null> {
    "use cache";
    cacheLife("max");
    cacheTag(`mgp-linea-${codLinea}`);
    try {
        const raw = await readFile(
            path.join(STATIC_DIR, "linea", `${codLinea}.json`),
            "utf-8",
        );
        return JSON.parse(raw) as StaticLineDump;
    } catch {
        return null;
    }
}
