import type { ParadaMapa, PuntoRecorrido, RamalData } from "@/lib/types";
import { post } from "./client";

export async function getRecorrido(codLinea: string): Promise<PuntoRecorrido[]> {
    const data = await post("RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea", {
        codLinea,
        isSublinea: "0",
    });

    return data.puntos ?? [];
}

export async function getRecorridoRamales(codLinea: string): Promise<RamalData[]> {
    const data = await post("RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea", {
        codLinea,
        isSublinea: "0",
    });

    const puntos: PuntoRecorrido[] = data.puntos ?? [];
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

export async function getParadasParaMapa(codLinea: string): Promise<ParadaMapa[]> {
    const data = await post("RecuperarParadasConBanderaYDestinoPorLinea", {
        codLinea,
        isSublinea: "0",
    });

    type RawEntry = {
        Codigo: string;
        Identificador: string;
        Descripcion: string;
        AbreviaturaBandera?: string | null;
        AbreviaturaAmpliadaBandera?: string | null;
        LatitudParada: string | null;
        LongitudParada: string | null;
    };

    const raw: Record<string, RawEntry[]> = data.paradas ?? {};
    const result: ParadaMapa[] = [];

    for (const [id, entries] of Object.entries(raw)) {
        if (!entries.length) continue;
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
