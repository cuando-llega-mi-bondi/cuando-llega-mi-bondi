import type { Interseccion, Linea, Parada, ParadaMapa, RamalData } from "@/lib/types";

/** Igual que en `scripts/dump-static-reference.ts` para `paradasByCalleInterseccion`. */
export function paradaLookupKey(codCalle: string, codInterseccion: string): string {
    return `${codCalle}\t${codInterseccion}`;
}

export interface StaticLineDump {
    meta: Linea;
    calles: { value: string; label: string }[];
    interseccionesByCalle: Record<string, Interseccion[]>;
    paradasByCalleInterseccion: Record<string, Parada[]>;
    recorrido: {
        ramales: RamalData[];
        paradas: ParadaMapa[];
    };
    error?: string;
}

export interface MgpStaticDump {
    meta: {
        generatedAt: string;
        apiBase: string;
        lineCount: number;
        manualRoutes: unknown;
    };
    lineas: Linea[];
    byLinea: Record<string, StaticLineDump>;
}
