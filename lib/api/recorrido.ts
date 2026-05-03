import type { ParadaMapa, PuntoRecorrido, RamalData } from "@/lib/types";
import { post } from "./client";

const COORD_EPS = 1e-6;

function ramalesFromPuntos(puntos: PuntoRecorrido[]): RamalData[] {
    const byDesc = new Map<string, PuntoRecorrido[]>();

    for (const p of puntos) {
        if (!byDesc.has(p.Descripcion)) byDesc.set(p.Descripcion, []);
        byDesc.get(p.Descripcion)?.push(p);
    }

    return Array.from(byDesc.entries()).map(([desc, pts]) => {
        const parts = desc.split(";");
        const key = parts[0] ?? desc;
        const label = parts[1] ?? desc;
        return { key, label, puntos: pts } satisfies RamalData;
    });
}

type LegacyParadaEntry = {
    Codigo: string;
    Identificador: string;
    Descripcion: string;
    AbreviaturaBandera?: string | null;
    AbreviaturaAmpliadaBandera?: string | null;
    LatitudParada: string | null;
    LongitudParada: string | null;
};

function parseLegacyParadasMap(
    raw: Record<string, LegacyParadaEntry[]> | undefined | null,
): ParadaMapa[] {
    if (!raw || typeof raw !== "object") return [];
    const result: ParadaMapa[] = [];

    for (const [id, entries] of Object.entries(raw)) {
        if (!Array.isArray(entries) || !entries.length) continue;
        const first = entries[0];
        const lat = parseFloat(first.LatitudParada ?? "");
        const lng = parseFloat(first.LongitudParada ?? "");
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

        const ramales = Array.from(
            new Set(
                entries
                    .map((entry) =>
                        (entry.AbreviaturaBandera ?? entry.AbreviaturaAmpliadaBandera ?? "").trim(),
                    )
                    .filter((ramal): ramal is string => Boolean(ramal)),
            ),
        );
        const label = /\s/.test(first.Descripcion) ? first.Descripcion : id;
        result.push({ id, codigo: first.Codigo, label, lat, lng, ramales });
    }

    return result;
}

/** Stops from `puntos` where `IsPuntoPaso`; merges consecutive same-coordinate vertices. */
function paradasFromPuntosParaMapa(codLinea: string, puntos: PuntoRecorrido[]): ParadaMapa[] {
    const stops = puntos.filter((p) => p.IsPuntoPaso === true);
    const result: ParadaMapa[] = [];
    let idCounter = 0;

    for (const p of stops) {
        const lat = p.Latitud;
        const lng = p.Longitud;
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

        const parts = (p.Descripcion ?? "").split(";");
        const keySeg = (parts[0] ?? "").trim();
        const labelSeg = (parts[1] ?? "").trim();
        const destSeg = (parts[2] ?? "").trim();
        const displayLabel = destSeg || labelSeg || keySeg || `Parada ${idCounter + 1}`;
        const abrev = (p.AbreviaturaBanderaSMP ?? "").trim();
        const ramales = Array.from(new Set([keySeg, labelSeg, abrev].filter(Boolean)));

        const last = result[result.length - 1];
        const sameCoord =
            last &&
            Math.abs(last.lat - lat) < COORD_EPS &&
            Math.abs(last.lng - lng) < COORD_EPS;

        if (sameCoord) {
            last.ramales = Array.from(new Set([...last.ramales, ...ramales]));
            continue;
        }

        idCounter += 1;
        const id = `pm_${codLinea}_${idCounter}`;
        result.push({
            id,
            codigo: id,
            label: displayLabel,
            lat,
            lng,
            ramales,
        });
    }

    return result;
}

function buildParadasMapaFromLineaResponse(
    data: {
        paradas?: Record<string, LegacyParadaEntry[]>;
        puntos?: PuntoRecorrido[];
    },
    codLinea: string,
): ParadaMapa[] {
    const legacy = parseLegacyParadasMap(data.paradas);
    if (legacy.length > 0) return legacy;
    return paradasFromPuntosParaMapa(codLinea, data.puntos ?? []);
}

async function fetchRecorridoLegacyPuntos(codLinea: string): Promise<PuntoRecorrido[]> {
    const data = await post("RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea", {
        codLinea,
        isSublinea: "0",
    });
    return data.puntos ?? [];
}

/**
 * Puntos del trazado para mapas: misma acción que la app MGP (`RecuperarParadasConBanderaYDestinoPorLinea`)
 * para coincidir en orden de vértices; si no hay `puntos`, fallback a `RecuperarRecorrido…`.
 */
export async function getRecorridoPuntosParaMapa(codLinea: string): Promise<PuntoRecorrido[]> {
    const data = await post("RecuperarParadasConBanderaYDestinoPorLinea", {
        codLinea,
        isSublinea: "0",
    });
    const puntos: PuntoRecorrido[] = data.puntos ?? [];
    if (puntos.length > 0) return puntos;
    return fetchRecorridoLegacyPuntos(codLinea);
}

export async function getRecorrido(codLinea: string): Promise<PuntoRecorrido[]> {
    return fetchRecorridoLegacyPuntos(codLinea);
}

export async function getRecorridoRamales(codLinea: string): Promise<RamalData[]> {
    const data = await post("RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea", {
        codLinea,
        isSublinea: "0",
    });

    return ramalesFromPuntos(data.puntos ?? []);
}

/**
 * One `RecuperarParadasConBanderaYDestinoPorLinea` when the payload includes `puntos`
 * (same as official app); otherwise loads ramales via `RecuperarRecorrido…`.
 */
export async function getRecorridoMapaCliente(codLinea: string): Promise<{
    ramales: RamalData[];
    paradas: ParadaMapa[];
}> {
    const data = await post("RecuperarParadasConBanderaYDestinoPorLinea", {
        codLinea,
        isSublinea: "0",
    });

    const paradas = buildParadasMapaFromLineaResponse(data, codLinea);
    const puntos: PuntoRecorrido[] = data.puntos ?? [];

    if (puntos.length > 0) {
        return { ramales: ramalesFromPuntos(puntos), paradas };
    }

    const ramales = await getRecorridoRamales(codLinea);
    return { ramales, paradas };
}

export async function getParadasParaMapa(codLinea: string): Promise<ParadaMapa[]> {
    const data = await post("RecuperarParadasConBanderaYDestinoPorLinea", {
        codLinea,
        isSublinea: "0",
    });

    return buildParadasMapaFromLineaResponse(data, codLinea);
}
