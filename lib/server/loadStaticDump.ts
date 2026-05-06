/**
 * Carga `data/mgp-static-dump.json` (generado con `bun run dump-static` / `npm run dump-static`).
 *
 * Activación en cliente: `NEXT_PUBLIC_USE_STATIC_REFERENCE=true` en [`lib/api/client.ts`](../api/client.ts),
 * que llama a `GET /api/reference` en lugar de la muni para acciones de catálogo.
 *
 * Deploy: la carpeta `data/` está en `.gitignore`; en producción hay que proveer el archivo
 * (artifact en CI, volumen, blob, o quitar el ignore si versionás el dump).
 *
 * Override de ruta: `STATIC_REFERENCE_DUMP_PATH` (absoluto o relativo al cwd del proceso Node).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import type { MgpStaticDump } from "@/lib/staticDumpTypes";

export const STATIC_DUMP_REVALIDATE_S = 3600;

function resolveDumpPath(): string {
    const override = process.env.STATIC_REFERENCE_DUMP_PATH?.trim();
    if (override) {
        return path.isAbsolute(override)
            ? override
            : path.join(process.cwd(), override);
    }
    return path.join(
        process.cwd(),
        /* turbopackIgnore: true */ "data",
        "mgp-static-dump.json",
    );
}

export const getCachedStaticDump = unstable_cache(
    async (): Promise<MgpStaticDump | null> => {
        try {
            const raw = await readFile(resolveDumpPath(), "utf-8");
            return JSON.parse(raw) as MgpStaticDump;
        } catch {
            return null;
        }
    },
    ["mgp-static-dump-parse"],
    { revalidate: STATIC_DUMP_REVALIDATE_S },
);
