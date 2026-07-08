import type { Arribo } from "@features/arrivals/types";
import { post } from "@shared/api/client";

export async function getArribos(
    identificadorParada: string,
    codigoLineaParada: string,
): Promise<Arribo[]> {
    const data = await post("RecuperarProximosArribosW", {
        identificadorParada,
        codigoLineaParada,
    });
    return data.arribos ?? [];
}
