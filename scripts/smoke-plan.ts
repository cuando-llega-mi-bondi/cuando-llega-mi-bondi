/**
 * Corrida de humo del planner de "Cómo llego" sobre el grafo real, fuera de
 * Next. Elige pares origen/destino deterministas a partir de las paradas del
 * dump (corto, medio, largo, Batán) e imprime los itinerarios resultantes.
 *
 * Uso: npx tsx scripts/smoke-plan.ts
 */

import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { mergeLineasWithManual } from "../features/route/manualRoutes";
import { loadManualStaticLineDump } from "../lib/server/loadManualStaticDump";
import { buildTransitModels, type LineRow } from "../lib/server/transitGraph";
import { planMany } from "../features/trip-planner/lib/planner";
import type { Itinerary } from "../features/trip-planner/types";
import type { Linea } from "../shared/types";
import type { StaticLineDump } from "../lib/server/staticDumpTypes";
import type { ParadaGeo, RoutingGraph } from "../features/trip-planner/types";

const STATIC_DIR = resolve(process.cwd(), "data", "static");

function loadLineRow(linea: Linea): StaticLineDump | null {
    try {
        return JSON.parse(
            readFileSync(join(STATIC_DIR, "linea", `${linea.CodigoLineaParada}.json`), "utf-8"),
        ) as StaticLineDump;
    } catch {
        return null;
    }
}

function percentileBy(
    paradas: ParadaGeo[],
    key: (p: ParadaGeo) => number,
    q: number,
): ParadaGeo {
    const sorted = [...paradas].sort((a, b) => key(a) - key(b));
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]!;
}

function esquina(p: ParadaGeo): string {
    if (p.calleLabel && p.interseccionLabel) return `${p.calleLabel} y ${p.interseccionLabel}`;
    return p.calleLabel ?? p.identificador;
}

function fmtItinerary(it: Itinerary, graph: RoutingGraph): string {
    const parts = it.legs.map((l) => {
        if (l.kind === "walk") return `caminar ${l.meters}m`;
        const from = graph.paradas.get(l.fromParadaId);
        const to = graph.paradas.get(l.toParadaId);
        return `${l.lineaLabel} (${l.ramalLabel}) ${from ? esquina(from) : l.fromParadaId} -> ${to ? esquina(to) : l.toParadaId} [${l.paradaIdsAlong.length} paradas]`;
    });
    return `${it.totalRides} bondi(s), camina ${it.totalWalkMeters}m, viaja ${it.totalRideMeters}m\n      ${parts.join("\n      ")}`;
}

async function main(): Promise<void> {
    const lineasRaw = JSON.parse(
        readFileSync(join(STATIC_DIR, "lineas.json"), "utf-8"),
    ) as Linea[];
    const lineas = mergeLineasWithManual(lineasRaw);
    const lineRows: LineRow[] = await Promise.all(
        lineas.map(async (linea) => ({
            linea,
            row: linea.isManual
                ? await loadManualStaticLineDump(linea.CodigoLineaParada)
                : loadLineRow(linea),
        })),
    );

    const t0 = Date.now();
    const { paradas, graph } = buildTransitModels(lineRows);
    console.log(
        `grafo: ${paradas.length} paradas, ${graph.sequences.length} secuencias (${Date.now() - t0}ms)\n`,
    );

    // Pares deterministas derivados de la geografía de las paradas.
    const centro = percentileBy(paradas, (p) => p.lat + p.lng, 0.5);
    const norte = percentileBy(paradas, (p) => p.lat, 0.97);
    const sur = percentileBy(paradas, (p) => p.lat, 0.03);
    const oeste = percentileBy(paradas, (p) => p.lng, 0.02);
    const cercana = paradas.find(
        (p) =>
            p.identificador !== centro.identificador &&
            Math.abs(p.lat - centro.lat) < 0.006 &&
            Math.abs(p.lng - centro.lng) < 0.006,
    );
    if (!cercana) {
        throw new Error(
            "no hay otra parada cerca del centro: ¿data/static/ incompleto?",
        );
    }

    const cases: { name: string; from: ParadaGeo; to: ParadaGeo }[] = [
        { name: "corto (centro)", from: centro, to: cercana },
        { name: "medio (centro -> norte)", from: centro, to: norte },
        { name: "largo (norte -> sur)", from: norte, to: sur },
        { name: "interurbano (centro -> oeste/Batan)", from: centro, to: oeste },
    ];

    for (const c of cases) {
        // Offset chico para que origen/destino no caigan exactamente sobre una parada.
        const oLat = c.from.lat + 0.0008;
        const oLng = c.from.lng + 0.0008;
        const dLat = c.to.lat - 0.0008;
        const dLng = c.to.lng - 0.0008;
        const t1 = Date.now();
        const itins = planMany(graph, oLat, oLng, dLat, dLng);
        const ms = Date.now() - t1;
        console.log(
            `== ${c.name}: ${esquina(c.from)} -> ${esquina(c.to)}  (${itins.length} resultados, ${ms}ms)`,
        );
        itins.forEach((it, i) => console.log(`  #${i + 1} ${fmtItinerary(it, graph)}`));
        console.log("");
    }
}

void main();
