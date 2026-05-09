/**
 * Divide `data/mgp-static-dump.json` (la fuente canónica de referencia MGP) en
 * archivos chicos por acción, bajo `data/static/`:
 *
 *   data/static/lineas.json              — solo el array `lineas`
 *   data/static/linea/<codLinea>.json    — `StaticLineDump` por línea
 *
 * Es una transformación pura del dump existente: NO hace fetch a la API
 * municipal. El JSON original queda intacto y sigue siendo la fuente de
 * verdad.
 *
 * Uso: bun run split-static  (npm run split-static)
 *
 * Override del input: `STATIC_REFERENCE_DUMP_PATH` (igual que en
 * `lib/server/loadStaticDump.ts`).
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { MgpStaticDump } from "../lib/staticDumpTypes";

function resolveDumpPath(): string {
    const override = process.env.STATIC_REFERENCE_DUMP_PATH?.trim();
    if (override) {
        return isAbsolute(override) ? override : resolve(process.cwd(), override);
    }
    return resolve(process.cwd(), "data", "mgp-static-dump.json");
}

function main(): void {
    const dumpPath = resolveDumpPath();
    const raw = readFileSync(dumpPath, "utf-8");
    const dump = JSON.parse(raw) as MgpStaticDump;

    const outDir = resolve(process.cwd(), "data", "static");
    const lineDir = join(outDir, "linea");

    // Limpiar solo el subdirectorio per-line para que líneas removidas del
    // dump no queden como archivos huérfanos. `lineas.json` se sobrescribe.
    rmSync(lineDir, { recursive: true, force: true });
    mkdirSync(lineDir, { recursive: true });

    writeFileSync(
        join(outDir, "lineas.json"),
        JSON.stringify(dump.lineas ?? []),
        "utf-8",
    );

    let count = 0;
    for (const [codLinea, line] of Object.entries(dump.byLinea ?? {})) {
        writeFileSync(
            join(lineDir, `${codLinea}.json`),
            JSON.stringify(line),
            "utf-8",
        );
        count += 1;
    }

    console.log(
        `split-static: wrote lineas.json (${dump.lineas?.length ?? 0} lineas) + ${count} per-line files to ${outDir}`,
    );
}

main();
