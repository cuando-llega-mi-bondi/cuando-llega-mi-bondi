import { readFile } from "node:fs/promises";
import path from "node:path";
import { MANUAL_ROUTES } from "@/lib/manualRoutes";
import type { StaticLineDump } from "@/lib/staticDumpTypes";
import type { Linea, ParadaMapa, PuntoRecorrido, RamalData } from "@/lib/types";

type GeoFeature = {
    geometry: {
        type: string;
        coordinates: [number, number][] | [number, number];
    };
};
type GeoJsonCollection = { features: GeoFeature[] };

function publicDiskPath(webPath: string): string {
    const rel = webPath.startsWith("/") ? webPath.slice(1) : webPath;
    return path.join(process.cwd(), "public", rel);
}

/**
 * Construye un `StaticLineDump` compatible con `mergeIntoAgg` a partir de los
 * GeoJSON declarados en `MANUAL_ROUTES` (misma lógica que `RecorridoClient`).
 * Sirve para incluir líneas no presentes en `data/static/linea/*.json` (ej. 221).
 */
export async function loadManualStaticLineDump(codLinea: string): Promise<StaticLineDump | null> {
    const config = MANUAL_ROUTES.find((r) => r.line.CodigoLineaParada === codLinea);
    if (!config) return null;

    const ramalDefs =
        config.ramales && config.ramales.length > 0
            ? config.ramales
            : config.geoJsonPath
              ? [
                    {
                        key: "principal",
                        label: "Recorrido",
                        geoJsonPath: config.geoJsonPath,
                    },
                ]
              : null;
    if (!ramalDefs?.length) return null;

    const line: Linea = config.line;
    const builtRamales: RamalData[] = [];
    const allStops: ParadaMapa[] = [];

    for (const def of ramalDefs) {
        let raw: string;
        try {
            raw = await readFile(publicDiskPath(def.geoJsonPath), "utf-8");
        } catch {
            console.warn(`[loadManualStaticLineDump] GeoJSON no encontrado: ${def.geoJsonPath}`);
            continue;
        }

        let geojson: GeoJsonCollection;
        try {
            geojson = JSON.parse(raw) as GeoJsonCollection;
        } catch {
            console.warn(`[loadManualStaticLineDump] JSON inválido: ${def.geoJsonPath}`);
            continue;
        }

        const lineFeature = geojson.features.find((f) => f.geometry.type === "LineString");
        const stopFeatures = geojson.features.filter((f) => f.geometry.type === "Point");
        if (!lineFeature) continue;

        const lineCoordinates = lineFeature.geometry.coordinates as [number, number][];
        if (lineCoordinates.length < 2) continue;

        const points: PuntoRecorrido[] = lineCoordinates.map((coord) => ({
            Latitud: coord[1],
            Longitud: coord[0],
            Descripcion: line.Descripcion ?? line.CodigoLineaParada,
            IsPuntoPaso: true,
            AbreviaturaBanderaSMP: "",
            AbreviaturaLineaSMP: line.CodigoLineaParada,
        }));

        builtRamales.push({
            key: def.key,
            label: def.label,
            puntos: points,
        });

        for (let i = 0; i < stopFeatures.length; i++) {
            const f = stopFeatures[i]!;
            const coords = f.geometry.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) continue;
            const [lng, lat] = coords as [number, number];
            allStops.push({
                id: `m_${def.key}_${i}`,
                codigo: `m_${def.key}_${i}`,
                label: `Parada ${i + 1}`,
                lat,
                lng,
                ramales: [def.label],
            });
        }
    }

    if (builtRamales.length === 0 || allStops.length < 2) return null;

    return {
        meta: line,
        calles: [],
        interseccionesByCalle: {},
        paradasByCalleInterseccion: {},
        recorrido: {
            ramales: builtRamales,
            paradas: allStops,
        },
    };
}
