import type { Interseccion, Linea, Parada } from "@/lib/types";
import { post } from "./client";

export async function getLineas(): Promise<Linea[]> {
    const data = await post("RecuperarLineaPorCuandoLlega");
    return data.lineas ?? [];
}

export async function getCalles(
    codLinea: string,
): Promise<{ value: string; label: string }[]> {
    const data = await post("RecuperarCallesPrincipalPorLinea", { codLinea });
    const raw: { Codigo: string; Descripcion: string }[] = data.calles ?? [];

    return raw.map((c) => ({
        value: c.Codigo,
        label: c.Descripcion,
    }));
}

export async function getIntersecciones(
    codLinea: string,
    codCalle: string,
): Promise<Interseccion[]> {
    const data = await post("RecuperarInterseccionPorLineaYCalle", {
        codLinea,
        codCalle,
    });
    return data.calles ?? [];
}

export async function getParadas(
    codLinea: string,
    codCalle: string,
    codInterseccion: string,
): Promise<Parada[]> {
    const data = await post(
        "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
        { codLinea, codCalle, codInterseccion },
    );
    return data.paradas ?? [];
}
