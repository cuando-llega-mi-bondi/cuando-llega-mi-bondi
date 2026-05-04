import { NextRequest, NextResponse } from "next/server";

// Endpoint sintético para probar UI states sin pegar a la muni ni grabar fixtures.
// Activación: setear NEXT_PUBLIC_CUANDO_API_URL=http://localhost:3000/api/cuando-mock
// (ver lib/api/client.ts:resolveCuandoApiBase).
//
// Escenario por query param ?scenario=happy|empty|error|cf-block|session-expired|slow.
// Default: "happy". Los shapes están alineados con responses reales del HAR de
// appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php.

const HAPPY_DATA: Record<string, unknown> = {
    // Lista inicial de líneas. Shape derivado de lib/types.ts:Linea.
    RecuperarLineaPorCuandoLlega: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        lineas: [
            { CodigoLineaParada: "100", Descripcion: "501", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "101", Descripcion: "511", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "107", Descripcion: "541", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "120", Descripcion: "573 A/B", CodigoEntidad: "1", CodigoEmpresa: 1 },
        ],
    },
    RecuperarCallesPrincipalPorLinea: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        calles: [
            { Codigo: "5444", Descripcion: "ALVARADO - MAR DEL PLATA" },
            { Codigo: "5827", Descripcion: "AVENIDA FRAY LUIS BELTRÁN - MAR DEL PLATA" },
            { Codigo: "5420", Descripcion: "AVENIDA JUAN H. JARA - MAR DEL PLATA" },
            { Codigo: "5428", Descripcion: "AVENIDA PEDRO LURO - MAR DEL PLATA" },
            { Codigo: "5812", Descripcion: "AVENIDA TEJEDOR - MAR DEL PLATA" },
        ],
    },
    RecuperarInterseccionPorLineaYCalle: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        calles: [
            { Codigo: "5547", Descripcion: "ÁLVAREZ CONDARCO - MAR DEL PLATA" },
            { Codigo: "5548", Descripcion: "GODOY CRUZ - MAR DEL PLATA" },
            { Codigo: "5512", Descripcion: "RIO NEGRO - MAR DEL PLATA" },
        ],
    },
    RecuperarParadasConBanderaPorLineaCalleEInterseccion: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        paradas: [
            {
                Codigo: "16323",
                Identificador: "P1936",
                Descripcion: "P1936",
                AbreviaturaBandera: "A CAMET",
                AbreviaturaAmpliadaBandera: "A CAMET",
                LatitudParada: "-37.985",
                LongitudParada: "-57.547",
            },
        ],
    },
    RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        puntos: [
            {
                Descripcion: "37;A CAMET;A CAMET",
                AbreviaturaBanderaSMP: "41CA",
                AbreviaturaLineaSMP: "541",
                IsPuntoPaso: true,
                Latitud: -38.005,
                Longitud: -57.553,
            },
            {
                Descripcion: "37;A CAMET;A CAMET",
                AbreviaturaBanderaSMP: "41CA",
                AbreviaturaLineaSMP: "541",
                IsPuntoPaso: false,
                Latitud: -38.0,
                Longitud: -57.55,
            },
            {
                Descripcion: "37;A CAMET;A CAMET",
                AbreviaturaBanderaSMP: "41CA",
                AbreviaturaLineaSMP: "541",
                IsPuntoPaso: true,
                Latitud: -37.985,
                Longitud: -57.547,
            },
        ],
    },
    RecuperarProximosArribosW: {
        CodigoEstado: 0,
        MensajeEstado: "ok",
        arribos: [
            {
                DescripcionLinea: "541",
                DescripcionBandera: "A CAMET",
                DescripcionCartelBandera: "CAMET",
                Arribo: "7 min. aprox.",
                CodigoLineaParada: "107",
                DesvioHorario: "0",
                EsAdaptado: "0",
                IdentificadorChofer: "0",
                IdentificadorCoche: "5412",
                Latitud: "-38.005",
                LatitudParada: "-37.985",
                Longitud: "-57.553",
                LongitudParada: "-57.547",
                UltimaFechaHoraGPS: "20260504T010000",
                MensajeError: "",
            },
            {
                DescripcionLinea: "541",
                DescripcionBandera: "A CAMET",
                DescripcionCartelBandera: "CAMET",
                Arribo: "32 min. aprox.",
                CodigoLineaParada: "107",
                DesvioHorario: "0",
                EsAdaptado: "0",
                IdentificadorChofer: "0",
                IdentificadorCoche: "5418",
                Latitud: "-38.02",
                LatitudParada: "-37.985",
                Longitud: "-57.56",
                LongitudParada: "-57.547",
                UltimaFechaHoraGPS: "20260504T010000",
                MensajeError: "",
            },
        ],
    },
    // Endpoint de logging que descubrimos en el HAR. La web lo llama cuando
    // `RecuperarProximosArribosW` devuelve sin datos, para reportar a la muni.
    logunidadnodespachada: {
        CodigoEstado: 0,
        descripcion:
            "En este momento no se puede acceder a la frecuencia de la línea. Reintente en un momento.",
    },
};

// Shape exacto que devuelve la muni cuando una parada no tiene arribos próximos
// (200 OK con CodigoEstado: -1). Es el caso que cachea mal el SW si no se filtra.
const NO_DATA_RESPONSE = {
    CodigoEstado: -1,
    MensajeEstado: "Sin datos disponibles para esta parada",
};

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const scenario = url.searchParams.get("scenario") ?? "happy";
    const body = await req.text();
    const params = new URLSearchParams(body);
    const accion = params.get("accion") ?? "";

    if (scenario === "slow") {
        await delay(2500);
    }

    if (scenario === "cf-block") {
        return new NextResponse("<html><body>403 Forbidden — Cloudflare</body></html>", {
            status: 403,
            headers: { "content-type": "text/html" },
        });
    }

    if (scenario === "session-expired") {
        return NextResponse.json({ error: "Sesión expirada" }, { status: 503 });
    }

    if (scenario === "error") {
        // Replica el bug del cache poisoning: 200 OK con body { error: ... }.
        // El handler real lo devuelve como ok=true cuando el último proxy falla,
        // y el SW lo cachea. Útil para validar el fix.
        return NextResponse.json({ error: "Error simulado del backend" });
    }

    if (scenario === "no-data") {
        // Otro vector de cache poisoning: respuesta válida pero "sin datos".
        return NextResponse.json(NO_DATA_RESPONSE);
    }

    if (scenario === "empty") {
        return NextResponse.json({
            CodigoEstado: 0,
            MensajeEstado: "ok",
            lineas: [],
            calles: [],
            paradas: [],
            arribos: [],
        });
    }

    // happy + slow caen acá
    const data = HAPPY_DATA[accion];
    if (data) return NextResponse.json(data);

    return NextResponse.json(
        {
            error: `Mock no tiene datos para "${accion}".`,
            hint: "Agregar el shape en HAPPY_DATA o usar /api/cuando con MGP_USE_FIXTURES=replay.",
        },
        { status: 501 },
    );
}
