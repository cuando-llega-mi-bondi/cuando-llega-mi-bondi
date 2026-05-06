/**
 * Genera lib/static/stops.json cruzando 3 endpoints de fixtures:
 *   - RecuperarParadasConBanderaYDestinoPorLinea/   → coords + líneas + banderas
 *   - RecuperarCallesPrincipalPorLinea/             → catálogo de calles
 *   - RecuperarInterseccionPorLineaYCalle/          → catálogo de intersecciones
 *   - RecuperarParadasConBanderaPorLineaCalleEInterseccion/ → mapea parada → (calle, intersección)
 *
 * Output: array de paradas únicas { id, nombre, lat, lng, lineas[], banderas[] }
 * donde `nombre` es "Calle y Intersección" cuando se puede derivar; fallback a la bandera.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

const FIXTURES = path.join(process.cwd(), "fixtures");
const OUT_STOPS = path.join(process.cwd(), "lib/static/stops.json");
const OUT_LINES = path.join(process.cwd(), "lib/static/lines.json");

type LineasFixture = {
    data?: { lineas?: Array<{ CodigoLineaParada: string; Descripcion: string }> };
};

type CallesFixture = {
    _meta: { params: { codLinea: string } };
    data?: { calles?: Array<{ Codigo: string; Descripcion: string }> };
};

type InterseccionesFixture = {
    _meta: { params: { codLinea: string; codCalle: string } };
    data?: { calles?: Array<{ Codigo: string; Descripcion: string }> };
};

type ParadaItem = {
    Identificador: string;
    LatitudParada?: string;
    LongitudParada?: string;
    AbreviaturaBandera?: string;
    AbreviaturaAmpliadaBandera?: string;
};

type ParadasDestinoFixture = {
    _meta: { params: { codLinea: string } };
    data?: { paradas?: Record<string, ParadaItem[]> | ParadaItem[] };
};

type ParadasPorInterseccionFixture = {
    _meta: { params: { codLinea: string; codCalle: string; codInterseccion: string } };
    data?: { paradas?: ParadaItem[] };
};

type Stop = {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    lineas: string[];
    banderas: string[];
};

async function readJson<T>(file: string): Promise<T> {
    return JSON.parse(await fs.readFile(file, "utf-8")) as T;
}

async function listFixtures(dir: string): Promise<string[]> {
    const full = path.join(FIXTURES, dir);
    return (await fs.readdir(full))
        .filter((e) => e.endsWith(".json"))
        .map((e) => path.join(full, e));
}

function cleanStreetName(desc: string): string {
    return desc
        .replace(/\s*-\s*MAR DEL PLATA\s*$/i, "")
        .replace(/^AVENIDA\s+/i, "Av. ")
        .trim()
        .replace(/\b([A-ZÁÉÍÓÚÑ])([A-ZÁÉÍÓÚÑ]+)\b/g, (_, a, b) => a + b.toLowerCase());
}

async function main() {
    // 1. Mapping codLinea → descripción de línea
    const codToLineaDesc = new Map<string, string>();
    for (const f of await listFixtures("RecuperarLineaPorCuandoLlega")) {
        const j = await readJson<LineasFixture>(f);
        for (const l of j.data?.lineas ?? []) codToLineaDesc.set(l.CodigoLineaParada, l.Descripcion);
    }
    console.log(`líneas: ${codToLineaDesc.size}`);

    // 2. Index calles: (codLinea|codCalle) → descripción
    const calleDesc = new Map<string, string>();
    for (const f of await listFixtures("RecuperarCallesPrincipalPorLinea")) {
        const j = await readJson<CallesFixture>(f);
        const codLinea = j._meta.params.codLinea;
        for (const c of j.data?.calles ?? []) {
            calleDesc.set(`${codLinea}|${c.Codigo}`, cleanStreetName(c.Descripcion));
        }
    }
    console.log(`calles indexadas: ${calleDesc.size}`);

    // 3. Index intersecciones: (codLinea|codCalle|codInter) → descripción
    const interDesc = new Map<string, string>();
    for (const f of await listFixtures("RecuperarInterseccionPorLineaYCalle")) {
        const j = await readJson<InterseccionesFixture>(f);
        const codLinea = j._meta.params.codLinea;
        const codCalle = j._meta.params.codCalle;
        for (const c of j.data?.calles ?? []) {
            interDesc.set(
                `${codLinea}|${codCalle}|${c.Codigo}`,
                cleanStreetName(c.Descripcion),
            );
        }
    }
    console.log(`intersecciones indexadas: ${interDesc.size}`);

    // 4. Paradas con coords (de RecuperarParadasConBanderaYDestinoPorLinea)
    const stops = new Map<string, Stop>();
    let rawDestino = 0;
    let skipped = 0;
    for (const f of await listFixtures("RecuperarParadasConBanderaYDestinoPorLinea")) {
        const j = await readJson<ParadasDestinoFixture>(f);
        const codLinea = j._meta.params.codLinea;
        const lineaDesc = codToLineaDesc.get(codLinea) ?? codLinea;
        const paradasRaw = j.data?.paradas;
        if (!paradasRaw) continue;
        const flat: ParadaItem[] = Array.isArray(paradasRaw)
            ? paradasRaw
            : Object.values(paradasRaw).flat();
        for (const p of flat) {
            rawDestino++;
            const lat = Number(p.LatitudParada);
            const lng = Number(p.LongitudParada);
            if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
                skipped++;
                continue;
            }
            const id = p.Identificador;
            if (!id) {
                skipped++;
                continue;
            }
            const bandera = p.AbreviaturaAmpliadaBandera || p.AbreviaturaBandera || "";
            const existing = stops.get(id);
            if (existing) {
                if (!existing.lineas.includes(lineaDesc)) existing.lineas.push(lineaDesc);
                if (bandera && !existing.banderas.includes(bandera)) existing.banderas.push(bandera);
            } else {
                stops.set(id, {
                    id,
                    nombre: bandera || `Parada ${id}`,
                    lat,
                    lng,
                    lineas: [lineaDesc],
                    banderas: bandera ? [bandera] : [],
                });
            }
        }
    }
    console.log(`paradas con coords: ${stops.size} (raw=${rawDestino}, skipped=${skipped})`);

    // 5. Cruce: para cada fixture de paradas-por-intersección, asignar nombre "Calle y Intersección"
    const stopAddress = new Map<string, string>();
    let resolvedAddresses = 0;
    let missingMaps = 0;
    for (const f of await listFixtures("RecuperarParadasConBanderaPorLineaCalleEInterseccion")) {
        const j = await readJson<ParadasPorInterseccionFixture>(f);
        const { codLinea, codCalle, codInterseccion } = j._meta.params;
        const calle = calleDesc.get(`${codLinea}|${codCalle}`);
        const inter = interDesc.get(`${codLinea}|${codCalle}|${codInterseccion}`);
        if (!calle || !inter) {
            missingMaps++;
            continue;
        }
        const addr = `${calle} y ${inter}`;
        for (const p of j.data?.paradas ?? []) {
            if (p.Identificador && !stopAddress.has(p.Identificador)) {
                stopAddress.set(p.Identificador, addr);
                resolvedAddresses++;
            }
        }
    }
    console.log(`direcciones resueltas: ${resolvedAddresses}, fixtures sin mapping calle/inter: ${missingMaps}`);

    // 6. Aplicar dirección como nombre cuando la tenemos
    let withAddress = 0;
    for (const stop of stops.values()) {
        const addr = stopAddress.get(stop.id);
        if (addr) {
            stop.nombre = addr;
            withAddress++;
        }
    }
    console.log(`paradas con nombre real: ${withAddress}/${stops.size}`);

    const result = [...stops.values()].sort((a, b) => a.id.localeCompare(b.id));
    for (const s of result) {
        s.lineas.sort();
        s.banderas.sort();
    }

    await fs.mkdir(path.dirname(OUT_STOPS), { recursive: true });
    await fs.writeFile(OUT_STOPS, JSON.stringify(result), "utf-8");
    console.log(`stops: ${OUT_STOPS} (${(JSON.stringify(result).length / 1024).toFixed(1)} KB)`);

    // 7. Catálogo de líneas con banderas y paradas por bandera (orden del recorrido)
    // Iteramos en orden de las keys del objeto paradas — refleja el orden de aparición del MGP.
    type BanderaDraft = { paradas: string[]; seen: Set<string> };
    const lineBanderas = new Map<string, Map<string, BanderaDraft>>();
    for (const f of await listFixtures("RecuperarParadasConBanderaYDestinoPorLinea")) {
        const j = await readJson<ParadasDestinoFixture>(f);
        const codLinea = j._meta.params.codLinea;
        const paradasRaw = j.data?.paradas;
        if (!paradasRaw) continue;
        const banderaMap = lineBanderas.get(codLinea) ?? new Map<string, BanderaDraft>();

        const entries: Array<[string, ParadaItem[]]> = Array.isArray(paradasRaw)
            ? paradasRaw.map((p) => [p.Identificador, [p]] as [string, ParadaItem[]])
            : Object.entries(paradasRaw);

        for (const [id, items] of entries) {
            if (!stops.has(id)) continue;
            for (const p of items) {
                const bandera = p.AbreviaturaAmpliadaBandera || p.AbreviaturaBandera;
                if (!bandera) continue;
                const draft = banderaMap.get(bandera) ?? { paradas: [], seen: new Set<string>() };
                if (!draft.seen.has(id)) {
                    draft.paradas.push(id);
                    draft.seen.add(id);
                }
                banderaMap.set(bandera, draft);
            }
        }
        lineBanderas.set(codLinea, banderaMap);
    }

    const stopsPorLinea = new Map<string, number>();
    for (const s of stops.values()) {
        for (const l of s.lineas) stopsPorLinea.set(l, (stopsPorLinea.get(l) ?? 0) + 1);
    }
    const lines = [...codToLineaDesc.entries()]
        .map(([codigo, descripcion]) => {
            const banderaMap = lineBanderas.get(codigo) ?? new Map<string, BanderaDraft>();
            const banderas = [...banderaMap.entries()]
                .map(([nombre, draft]) => ({
                    nombre,
                    paradaIds: draft.paradas, // orden de recorrido preservado
                }))
                .sort((a, b) => b.paradaIds.length - a.paradaIds.length);
            return {
                codigo,
                descripcion,
                paradas: stopsPorLinea.get(descripcion) ?? 0,
                banderas,
            };
        })
        .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
    await fs.writeFile(OUT_LINES, JSON.stringify(lines), "utf-8");
    const totalBanderas = lines.reduce((acc, l) => acc + l.banderas.length, 0);
    console.log(`lines: ${OUT_LINES} (${lines.length} líneas, ${totalBanderas} banderas)`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
