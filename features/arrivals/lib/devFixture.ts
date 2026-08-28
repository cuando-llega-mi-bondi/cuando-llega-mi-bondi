import type { Arribo } from "@features/arrivals/types";

function makeArribo(overrides: Partial<Arribo> & Pick<Arribo, "Arribo">): Arribo {
    return {
        DescripcionLinea: "512",
        DescripcionBandera: "AL SHOPPING ALDREY",
        DescripcionCartelBandera: "AL SHOPPING ALDREY",
        DescripcionCortaBandera: "SHOPPING",
        CodigoLineaParada: "512019",
        DesvioHorario: "00:00",
        EsAdaptado: "False",
        IdentificadorChofer: "0",
        IdentificadorCoche: "0",
        Latitud: "-38.0055",
        LatitudParada: "-38.0055",
        Longitud: "-57.5426",
        LongitudParada: "-57.5426",
        UltimaFechaHoraGPS: new Date().toISOString(),
        MensajeError: "",
        ...overrides,
    };
}

/**
 * Arribos ficticios para probar visualmente ArriboCard (colores por
 * urgencia, badge adaptado, mensaje de error) sin depender de que la
 * Municipalidad esté sirviendo datos en ese momento (ej. fuera de horario).
 * Sólo existen con `next dev`; en producción NODE_ENV es "production" y
 * queda en un array vacío. Ver `useArribos.ts`, que los usa como fallback
 * cuando la consulta real no trae arribos.
 */
export const DEV_FIXTURE_ARRIBOS: Arribo[] =
    process.env.NODE_ENV === "development"
        ? [
              makeArribo({ Arribo: "Arribando..", CodigoLineaParada: "512-a", EsAdaptado: "True" }),
              makeArribo({
                  Arribo: "1 min. aprox.",
                  CodigoLineaParada: "512-b",
                  DescripcionBandera: "A CENTRO",
                  DescripcionCartelBandera: "A CENTRO",
              }),
              makeArribo({
                  Arribo: "2 min. aprox.",
                  CodigoLineaParada: "512-c",
                  DescripcionBandera: "A PLAYA GRANDE",
                  DescripcionCartelBandera: "A PLAYA GRANDE",
                  EsAdaptado: "True",
              }),
              makeArribo({
                  Arribo: "12 min. aprox.",
                  CodigoLineaParada: "512-d",
                  MensajeError: "Coche circulando fuera del recorrido habitual",
              }),
              makeArribo({ Arribo: "43 min. aprox.", CodigoLineaParada: "512-e" }),
          ]
        : [];
