import { NextRequest, NextResponse } from "next/server";

// Endpoint sintético para probar UI states sin pegar a la muni ni grabar fixtures.
// Activación: setear NEXT_PUBLIC_CUANDO_API_URL=http://localhost:3000/api/cuando-mock
// (ver lib/api/client.ts:resolveCuandoApiBase).
//
// Escenario por query param ?scenario=happy|empty|error|cf-block|session-expired|slow.
// Default: "happy". El cliente puede pasarlo apuntando a `/api/cuando-mock?scenario=X`.

const HAPPY_DATA: Record<string, unknown> = {
    RecuperarLineaPorCuandoLlega: {
        lineas: [
            { CodigoLineaParada: "511", Descripcion: "511", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "521", Descripcion: "521", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "541", Descripcion: "541", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "573", Descripcion: "573 A/B", CodigoEntidad: "1", CodigoEmpresa: 1 },
            { CodigoLineaParada: "593", Descripcion: "593", CodigoEntidad: "1", CodigoEmpresa: 1 },
        ],
    },
    RecuperarCallesPrincipalPorLinea: {
        calles: [
            { Codigo: "1", Descripcion: "AVENIDA JUAN H. JARA" },
            { Codigo: "2", Descripcion: "AVENIDA INDEPENDENCIA" },
            { Codigo: "3", Descripcion: "AVENIDA COLON" },
            { Codigo: "4", Descripcion: "AVENIDA LURO" },
        ],
    },
    RecuperarInterseccionPorLineaYCalle: {
        calles: [
            { Codigo: "10", Descripcion: "RIO NEGRO" },
            { Codigo: "11", Descripcion: "FORMOSA" },
            { Codigo: "12", Descripcion: "LA PAMPA" },
        ],
    },
    RecuperarParadasConBanderaPorLineaCalleEInterseccion: {
        paradas: [
            {
                Codigo: "B0148",
                Identificador: "B0148",
                AbreviaturaBandera: "A CAMET",
                LatitudParada: "-37.985",
                LongitudParada: "-57.547",
            },
        ],
    },
    RecuperarProximosArribosW: {
        arribos: [
            {
                DescripcionLinea: "541",
                DescripcionBandera: "A CAMET",
                DescripcionCartelBandera: "CAMET",
                Arribo: "7 min. aprox.",
                CodigoLineaParada: "541",
                DesvioHorario: "0",
                EsAdaptado: "0",
                IdentificadorChofer: "0",
                IdentificadorCoche: "5412",
                Latitud: "-38.005",
                LatitudParada: "-37.985",
                Longitud: "-57.553",
                LongitudParada: "-57.547",
                UltimaFechaHoraGPS: "20260503T232600",
                MensajeError: "",
            },
            {
                DescripcionLinea: "541",
                DescripcionBandera: "A CAMET",
                DescripcionCartelBandera: "CAMET",
                Arribo: "32 min. aprox.",
                CodigoLineaParada: "541",
                DesvioHorario: "0",
                EsAdaptado: "0",
                IdentificadorChofer: "0",
                IdentificadorCoche: "5418",
                Latitud: "-38.020",
                LatitudParada: "-37.985",
                Longitud: "-57.560",
                LongitudParada: "-57.547",
                UltimaFechaHoraGPS: "20260503T232600",
                MensajeError: "",
            },
        ],
    },
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
        // Replica el bug del cache poisoning: 200 OK con body { error: ... }
        return NextResponse.json({ error: "Error simulado del backend" });
    }

    if (scenario === "empty") {
        return NextResponse.json({
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
