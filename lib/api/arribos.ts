import type { Arribo } from "@/lib/types";
import { post } from "./client";

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
