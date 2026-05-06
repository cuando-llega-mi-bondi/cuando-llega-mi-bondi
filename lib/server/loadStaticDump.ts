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

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { MgpStaticDump } from "@/lib/staticDumpTypes";

type DumpCacheEntry = {
    path: string;
    mtimeMs: number;
    dump: MgpStaticDump;
};

let dumpCache: DumpCacheEntry | null = null;

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

/**
 * Loads and parses the static dump once per process (or when the file changes).
 * `unstable_cache` is not used: Next.js caps Data Cache entries at 2MB and this dump is larger.
 */
export async function getCachedStaticDump(): Promise<MgpStaticDump | null> {
    const dumpPath = resolveDumpPath();
    try {
        const st = await stat(dumpPath);
        if (
            dumpCache &&
            dumpCache.path === dumpPath &&
            dumpCache.mtimeMs === st.mtimeMs
        ) {
            return dumpCache.dump;
        }
        const raw = await readFile(dumpPath, "utf-8");
        const dump = JSON.parse(raw) as MgpStaticDump;
        dumpCache = { path: dumpPath, mtimeMs: st.mtimeMs, dump };
        return dump;
    } catch {
        if (dumpCache?.path === dumpPath) {
            dumpCache = null;
        }
        return null;
    }
}
