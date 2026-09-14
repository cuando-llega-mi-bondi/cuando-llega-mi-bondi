import type { Linea } from "@shared/types";
import { paradaLookupKey, type StaticLineDump } from "@/lib/server/staticDumpTypes";

/**
 * Ficha de texto de una línea armada con el dump estático de MGP: carteles,
 * calles con sus esquinas de parada y líneas que comparten calles. Es el
 * contenido visible de `/recorrido/[linea]` debajo del mapa.
 */

export interface CartelDeLinea {
    nombre: string;
    paradas: number;
}

export interface CalleDeLinea {
    codigo: string;
    nombre: string;
    esquinas: string[];
}

export interface CombinacionDeLinea {
    linea: Linea;
    callesEnComun: string[];
}

export interface LineaInfo {
    totalParadas: number;
    carteles: CartelDeLinea[];
    calles: CalleDeLinea[];
    combinaciones: CombinacionDeLinea[];
}

const MAX_COMBINACIONES = 8;

const PALABRAS_EN_MINUSCULA = new Set(["al", "de", "del", "el", "en", "la", "las", "los", "por", "x", "y"]);

/** "AVENIDA JUAN B. JUSTO - MAR DEL PLATA" → "Avenida Juan B. Justo" */
export function formatearNombreMgp(label: string): string {
    const corte = label.lastIndexOf(" - ");
    const base = corte > 0 ? label.slice(0, corte) : label;
    return base
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((palabra, i) =>
            i > 0 && PALABRAS_EN_MINUSCULA.has(palabra)
                ? palabra
                : palabra.replace(/(^|[.\-/(])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toUpperCase()),
        )
        .join(" ");
}

/** "521" → "521", "593C" → "593C", "BATAN" → "Batan", "221 COSTA AZUL" → "221 Costa Azul" */
export function nombreLineaVisible(linea: Linea): string {
    return formatearNombreMgp(linea.Descripcion).replace(
        /^(\d+)([a-z])\b/,
        (_, numero: string, letra: string) => numero + letra.toUpperCase(),
    );
}

function normalizar(valor: string): string {
    return valor.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildLineaInfo(
    linea: Linea,
    dump: StaticLineDump,
    catalogo: { linea: Linea; dump: StaticLineDump | null }[],
): LineaInfo | null {
    if (dump.error || dump.calles.length === 0) return null;

    const paradas = dump.recorrido?.paradas ?? [];

    const carteles = new Map<string, CartelDeLinea>();
    for (const ramal of dump.recorrido?.ramales ?? []) {
        const clave = normalizar(ramal.label);
        if (!carteles.has(clave)) {
            carteles.set(clave, { nombre: formatearNombreMgp(ramal.label), paradas: 0 });
        }
    }
    for (const parada of paradas) {
        for (const ramal of new Set((parada.ramales ?? []).map(normalizar))) {
            const cartel = carteles.get(ramal);
            if (cartel) cartel.paradas++;
        }
    }

    const calles = dump.calles
        .map((calle): CalleDeLinea => {
            const esquinas = new Set<string>();
            for (const interseccion of dump.interseccionesByCalle[calle.value] ?? []) {
                const enEsquina =
                    dump.paradasByCalleInterseccion[paradaLookupKey(calle.value, interseccion.Codigo)];
                if (enEsquina?.length) esquinas.add(formatearNombreMgp(interseccion.Descripcion));
            }
            return { codigo: calle.value, nombre: formatearNombreMgp(calle.label), esquinas: [...esquinas] };
        })
        .sort((a, b) => b.esquinas.length - a.esquinas.length || a.nombre.localeCompare(b.nombre, "es"));

    const combinaciones = catalogo
        .flatMap(({ linea: otra, dump: otroDump }): CombinacionDeLinea[] => {
            if (otra.CodigoLineaParada === linea.CodigoLineaParada || !otroDump || otroDump.error) return [];
            const codigos = new Set(otroDump.calles.map((c) => c.value));
            const callesEnComun = calles.filter((c) => codigos.has(c.codigo)).map((c) => c.nombre);
            return callesEnComun.length > 0 ? [{ linea: otra, callesEnComun }] : [];
        })
        .sort(
            (a, b) =>
                b.callesEnComun.length - a.callesEnComun.length ||
                a.linea.Descripcion.localeCompare(b.linea.Descripcion, "es", { numeric: true }),
        )
        .slice(0, MAX_COMBINACIONES);

    return {
        totalParadas: paradas.length,
        carteles: [...carteles.values()],
        calles,
        combinaciones,
    };
}
