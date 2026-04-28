import { getCache, setCache } from "@/lib/storage/localCache";
import type { Linea } from "@/lib/types";
import { post } from "./client";

function looselyMatches(a: string, b: string) {
    return a.includes(b) || b.includes(a);
}

export async function findLineasEnInterseccion(
    calleLabel: string,
    interseccionLabel: string,
    currentLineaCode: string,
    todasLasLineas: Linea[],
): Promise<Linea[]> {
    const lineasCandidatas = todasLasLineas.filter(
        (l) => l.CodigoLineaParada !== currentLineaCode && !l.isManual,
    );
    const result: Linea[] = [];

    const limit = 5;
    let active = 0;
    let currentIndex = 0;

    return new Promise((resolve) => {
        const next = async () => {
            if (currentIndex >= lineasCandidatas.length) {
                if (active === 0) resolve(result);
                return;
            }

            const linea = lineasCandidatas[currentIndex++];
            active += 1;

            try {
                const codLinea = linea.CodigoLineaParada;

                const callesAction = "RecuperarCallesPrincipalPorLinea";
                const callesParams = { codLinea };
                let calles = getCache<unknown[]>(callesAction, callesParams);

                if (!calles) {
                    const res = await post(callesAction, callesParams).catch(() => null);
                    calles = res?.calles ?? [];
                    if (Array.isArray(calles) && calles.length > 0) {
                        setCache(callesAction, calles, callesParams);
                    }
                }

                const matchCalle = (calles as unknown[])?.find((c: unknown) => {
                    const desc = (c as Record<string, string>)?.Descripcion;
                    return desc ? looselyMatches(desc, calleLabel) : false;
                }) as Record<string, string> | undefined;

                const codCalle = matchCalle?.Codigo;
                if (!codCalle) return;

                const interAction = "RecuperarInterseccionPorLineaYCalle";
                const interParams = { codLinea, codCalle };
                let intersecciones = getCache<unknown[]>(interAction, interParams);

                if (!intersecciones) {
                    const res = await post(interAction, interParams).catch(() => null);
                    intersecciones = res?.calles ?? [];
                    if (Array.isArray(intersecciones) && intersecciones.length > 0) {
                        setCache(interAction, intersecciones, interParams);
                    }
                }

                const matchInter = (intersecciones as unknown[])?.some((i: unknown) => {
                    const desc = (i as Record<string, string>)?.Descripcion;
                    return desc ? looselyMatches(desc, interseccionLabel) : false;
                });

                if (matchInter) {
                    result.push(linea);
                }
            } catch {
                // Keep scanning other lines even if one request fails.
            } finally {
                active -= 1;
                next();
            }
        };

        for (let i = 0; i < limit; i += 1) {
            next();
        }
    });
}
