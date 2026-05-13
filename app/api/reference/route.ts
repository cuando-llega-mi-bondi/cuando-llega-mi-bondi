import { NextRequest, NextResponse } from "next/server";
import { getLineaData, getLineas } from "@/lib/server/loadStaticDump";
import { STATIC_REFERENCE_ACCIONES } from "@/lib/staticReferenceAcciones";
import { paradaLookupKey } from "@/lib/staticDumpTypes";

export async function GET(req: NextRequest) {
    const accion = req.nextUrl.searchParams.get("accion");
    if (!accion || !STATIC_REFERENCE_ACCIONES.has(accion)) {
        return NextResponse.json(
            { error: "Unsupported or missing accion" },
            { status: 404 },
        );
    }

    const codLinea = req.nextUrl.searchParams.get("codLinea") ?? "";

    try {
        switch (accion) {
            case "RecuperarLineaPorCuandoLlega": {
                const lineas = await getLineas();
                if (!lineas) {
                    return NextResponse.json(
                        { error: "Static dump not available" },
                        { status: 404 },
                    );
                }
                return NextResponse.json({ lineas });
            }
            case "RecuperarCallesPrincipalPorLinea": {
                if (!codLinea) {
                    return NextResponse.json(
                        { error: "codLinea required" },
                        { status: 404 },
                    );
                }
                const row = await getLineaData(codLinea);
                if (!row) {
                    return NextResponse.json(
                        { error: "Unknown line" },
                        { status: 404 },
                    );
                }
                const calles = (row.calles ?? []).map((c) => ({
                    Codigo: c.value,
                    Descripcion: c.label,
                }));
                return NextResponse.json({ calles });
            }
            case "RecuperarInterseccionPorLineaYCalle": {
                const codCalle = req.nextUrl.searchParams.get("codCalle") ?? "";
                if (!codLinea || !codCalle) {
                    return NextResponse.json(
                        { error: "codLinea and codCalle required" },
                        { status: 404 },
                    );
                }
                const row = await getLineaData(codLinea);
                if (!row) {
                    return NextResponse.json(
                        { error: "Unknown line" },
                        { status: 404 },
                    );
                }
                const calles = row.interseccionesByCalle[codCalle] ?? [];
                return NextResponse.json({ calles });
            }
            case "RecuperarParadasConBanderaPorLineaCalleEInterseccion": {
                const codCalle = req.nextUrl.searchParams.get("codCalle") ?? "";
                const codInterseccion =
                    req.nextUrl.searchParams.get("codInterseccion") ?? "";
                if (!codLinea || !codCalle || !codInterseccion) {
                    return NextResponse.json(
                        {
                            error: "codLinea, codCalle and codInterseccion required",
                        },
                        { status: 404 },
                    );
                }
                const row = await getLineaData(codLinea);
                if (!row) {
                    return NextResponse.json(
                        { error: "Unknown line" },
                        { status: 404 },
                    );
                }
                const key = paradaLookupKey(codCalle, codInterseccion);
                const paradas = row.paradasByCalleInterseccion[key] ?? [];
                return NextResponse.json({ paradas });
            }
            case "ResolverUbicacionFormularioPorParada": {
                const parada = req.nextUrl.searchParams.get("parada") ?? "";
                if (!codLinea || !parada) {
                    return NextResponse.json(
                        { error: "codLinea and parada required" },
                        { status: 400 },
                    );
                }
                const row = await getLineaData(codLinea);
                if (!row) {
                    return NextResponse.json({
                        codCalle: null,
                        codInterseccion: null,
                    });
                }
                for (const [key, lista] of Object.entries(
                    row.paradasByCalleInterseccion ?? {},
                )) {
                    if (!Array.isArray(lista)) continue;
                    if (!lista.some((p) => p.Identificador === parada)) continue;
                    const tab = key.indexOf("\t");
                    if (tab <= 0) continue;
                    const codCalle = key.slice(0, tab);
                    const codInterseccion = key.slice(tab + 1);
                    if (codCalle && codInterseccion) {
                        return NextResponse.json({ codCalle, codInterseccion });
                    }
                }
                return NextResponse.json({
                    codCalle: null,
                    codInterseccion: null,
                });
            }
            case "RecuperarParadasConBanderaYDestinoPorLinea":
            case "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea": {
                if (!codLinea) {
                    return NextResponse.json(
                        { error: "codLinea required" },
                        { status: 404 },
                    );
                }
                const row = await getLineaData(codLinea);
                if (!row) {
                    return NextResponse.json(
                        { error: "Unknown line" },
                        { status: 404 },
                    );
                }
                const puntos = (row.recorrido?.ramales ?? []).flatMap(
                    (r) => r.puntos ?? [],
                );
                // Rebuild legacy `paradas` shape (Record<id, LegacyParadaEntry[]>)
                // from the precomputed ParadaMapa[] so getRecorridoMapaCliente's
                // parseLegacyParadasMap can recover the full stop list. Without
                // this the client falls back to IsPuntoPaso=true points and
                // shows a fraction of the real stops.
                const paradas: Record<
                    string,
                    {
                        Codigo: string;
                        Identificador: string;
                        Descripcion: string;
                        AbreviaturaBandera: string;
                        AbreviaturaAmpliadaBandera: string;
                        LatitudParada: string;
                        LongitudParada: string;
                    }[]
                > = {};
                for (const p of row.recorrido?.paradas ?? []) {
                    const ramales = p.ramales.length ? p.ramales : [""];
                    paradas[p.id] = ramales.map((ramal) => ({
                        Codigo: p.codigo,
                        Identificador: p.id,
                        Descripcion: p.label,
                        AbreviaturaBandera: ramal,
                        AbreviaturaAmpliadaBandera: ramal,
                        LatitudParada: String(p.lat),
                        LongitudParada: String(p.lng),
                    }));
                }
                return NextResponse.json({ puntos, paradas });
            }
            default:
                return NextResponse.json(
                    { error: "Unsupported accion" },
                    { status: 404 },
                );
        }
    } catch {
        return NextResponse.json(
            { error: "Failed to build reference response" },
            { status: 500 },
        );
    }
}
