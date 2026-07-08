/**
 * Auditoría del ordenamiento de paradas sobre la polilínea de cada ramal.
 *
 * Detecta pares adyacentes "imposibles": el arco entre dos paradas consecutivas
 * es bastante menor que su distancia en línea recta (el camino sobre la ruta
 * nunca puede ser más corto que la recta) → alguna se proyectó al tramo
 * equivocado. Compara distintos umbrales de distancia perpendicular máxima
 * parada→polilínea (`maxPerp`): el dump asigna a algunos ramales paradas de
 * otras variantes del servicio, y filtrarlas elimina casi todos los errores.
 *
 * Hallazgo previo (2026-06): penalizar proyecciones donde la parada queda a la
 * izquierda del sentido de circulación EMPEORA los resultados (129 → 157 pares
 * imposibles con penalidad 100 m); las coordenadas del dump no codifican el
 * lado de subida de forma consistente. No insistir por ese camino.
 *
 * Uso: npx tsx scripts/audit-stop-order.ts [--verbose]
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { haversineMeters } from "../shared/geo/haversine";
import {
    buildPolylineGeometry,
    scoreStopsAlongPolyline,
    stopsOfRamal,
} from "../lib/server/transitGraph";
import type { StaticLineDump } from "../lib/server/staticDumpTypes";

const STATIC_LINEA_DIR = resolve(process.cwd(), "data", "static", "linea");
const MAX_PERP_VARIANTS = [Number.POSITIVE_INFINITY, 150, 120, 80];
const VERBOSE = process.argv.includes("--verbose");

type RamalAudit = {
    codLinea: string;
    ramalLabel: string;
    numStops: number;
    impossiblePairs: number;
    worstGapMeters: number;
};

function auditRamal(
    codLinea: string,
    row: StaticLineDump,
    ramalIdx: number,
    maxPerp: number,
): RamalAudit | null {
    const ramal = row.recorrido?.ramales?.[ramalIdx];
    if (!ramal || ramal.puntos.length < 2) return null;
    const paradas = stopsOfRamal(row.recorrido?.paradas ?? [], ramal);
    if (paradas.length < 2) return null;

    const segs = buildPolylineGeometry(ramal.puntos);
    const byId = new Map(paradas.map((p) => [p.id, p]));

    // La misma función con la que producción ordena las secuencias.
    const ordered = scoreStopsAlongPolyline(paradas, segs, maxPerp);
    if (ordered.length < 2) return null;

    let impossiblePairs = 0;
    let worstGapMeters = 0;
    for (let i = 0; i < ordered.length - 1; i++) {
        const a = byId.get(ordered[i]!.id)!;
        const b = byId.get(ordered[i + 1]!.id)!;
        const straight = haversineMeters(a.lat, a.lng, b.lat, b.lng);
        const dArc = ordered[i + 1]!.arc - ordered[i]!.arc;
        const gap = straight - dArc;
        // Tolerancia: las paradas no están exactamente sobre la polilínea.
        if (gap > Math.max(40, straight * 0.25)) {
            impossiblePairs++;
            worstGapMeters = Math.max(worstGapMeters, Math.round(gap));
            if (VERBOSE) {
                console.log(
                    `    [maxPerp=${maxPerp}] linea ${codLinea} ${ramal.label || ramal.key}: ${a.id} -> ${b.id}  recta=${Math.round(straight)}m  arco=${Math.round(dArc)}m`,
                );
            }
        }
    }

    return {
        codLinea,
        ramalLabel: ramal.label || ramal.key,
        numStops: ordered.length,
        impossiblePairs,
        worstGapMeters,
    };
}

function main(): void {
    const files = readdirSync(STATIC_LINEA_DIR).filter((f) => f.endsWith(".json"));

    for (const maxPerp of MAX_PERP_VARIANTS) {
        let totalPairs = 0;
        let totalImpossible = 0;
        let totalStops = 0;
        const offenders: RamalAudit[] = [];

        for (const file of files) {
            const codLinea = file.replace(/\.json$/, "");
            const row = JSON.parse(
                readFileSync(join(STATIC_LINEA_DIR, file), "utf-8"),
            ) as StaticLineDump;
            const numRamales = row.recorrido?.ramales?.length ?? 0;
            for (let r = 0; r < numRamales; r++) {
                const audit = auditRamal(codLinea, row, r, maxPerp);
                if (!audit) continue;
                totalPairs += audit.numStops - 1;
                totalStops += audit.numStops;
                totalImpossible += audit.impossiblePairs;
                if (audit.impossiblePairs > 0) offenders.push(audit);
            }
        }

        offenders.sort((a, b) => b.impossiblePairs - a.impossiblePairs);
        console.log(`\n=== maxPerp=${maxPerp}m ===`);
        const pct =
            totalPairs > 0
                ? `${((totalImpossible / totalPairs) * 100).toFixed(2)}%`
                : "sin pares";
        console.log(
            `pares imposibles: ${totalImpossible}/${totalPairs} (${pct})  | paradas en secuencias: ${totalStops}`,
        );
        for (const o of offenders.slice(0, 8)) {
            console.log(
                `  linea ${o.codLinea} · ${o.ramalLabel}: ${o.impossiblePairs} pares (peor gap ${o.worstGapMeters}m, ${o.numStops} paradas)`,
            );
        }
    }
}

main();
