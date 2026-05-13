import { post } from "@/lib/api/client";
import { getCache } from "@/lib/storage/localCache";
import type { Interseccion, Parada } from "@/lib/types";

type CalleRow = { Codigo: string; Descripcion?: string };

type ResolverResponse = {
    codCalle?: string | null;
    codInterseccion?: string | null;
};

/**
 * Obtiene calle + intersección MGP para una parada ya conocida, de modo que el
 * formulario de búsqueda muestre la misma ubicación que favoritos / historial /
 * enlace desde el mapa (`?linea=&parada=`).
 */
export async function resolveUbicacionFormularioPorParada(
    codLinea: string,
    paradaId: string,
): Promise<{ codCalle: string; codInterseccion: string } | null> {
    if (!codLinea.trim() || !paradaId.trim()) return null;

    try {
        const data = (await post("ResolverUbicacionFormularioPorParada", {
            codLinea,
            parada: paradaId,
        })) as ResolverResponse;
        if (data.codCalle && data.codInterseccion) {
            return {
                codCalle: data.codCalle,
                codInterseccion: data.codInterseccion,
            };
        }
    } catch {
        // Sin dump estático o línea desconocida: seguir con barrido vía acciones MGP.
    }

    return scanUbicacionFormularioPorParada(codLinea, paradaId);
}

async function scanUbicacionFormularioPorParada(
    codLinea: string,
    paradaId: string,
): Promise<{ codCalle: string; codInterseccion: string } | null> {
    let calles =
        getCache<CalleRow[]>("RecuperarCallesPrincipalPorLinea", {
            codLinea,
        }) ?? null;
    if (!calles) {
        const res = await post("RecuperarCallesPrincipalPorLinea", {
            codLinea,
        });
        calles = (res?.calles as CalleRow[] | undefined) ?? [];
    }

    for (const calle of calles) {
        const codCalle = calle.Codigo;
        if (!codCalle) continue;

        let intersecciones =
            getCache<Interseccion[]>("RecuperarInterseccionPorLineaYCalle", {
                codLinea,
                codCalle,
            }) ?? null;
        if (!intersecciones) {
            const res = await post("RecuperarInterseccionPorLineaYCalle", {
                codLinea,
                codCalle,
            });
            intersecciones = (res?.calles as Interseccion[] | undefined) ?? [];
        }

        for (const inter of intersecciones) {
            const codInterseccion = inter.Codigo;
            if (!codInterseccion) continue;

            let paradas =
                getCache<Parada[]>(
                    "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
                    { codLinea, codCalle, codInterseccion },
                ) ?? null;
            if (!paradas) {
                const res = await post(
                    "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
                    {
                        codLinea,
                        codCalle,
                        codInterseccion,
                    },
                );
                paradas = (res?.paradas as Parada[] | undefined) ?? [];
            }

            if (paradas.some((p) => p.Identificador === paradaId)) {
                return { codCalle, codInterseccion };
            }
        }
    }

    return null;
}
