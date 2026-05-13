import { NextRequest, NextResponse } from "next/server";
import { getTransitStaticModels, paradasCercanasDe } from "@/lib/server/transitStaticModels";

function parseCoord(v: string | null): number | null {
    if (v == null || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

/** Caja amplia alrededor de MdP + alrededores (evita abuso del endpoint). */
function enRegionMgp(lat: number, lng: number): boolean {
    return lat >= -39.5 && lat <= -36.0 && lng >= -58.6 && lng <= -56.0;
}

export async function GET(req: NextRequest) {
    const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
    const lng = parseCoord(req.nextUrl.searchParams.get("lng"));
    const radio = parseCoord(req.nextUrl.searchParams.get("radio")) ?? 600;
    const limit = Math.min(40, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20));

    if (lat == null || lng == null) {
        return NextResponse.json({ error: "lat y lng son obligatorios" }, { status: 400 });
    }
    if (!enRegionMgp(lat, lng)) {
        return NextResponse.json({ error: "Coordenadas fuera de la zona cubierta" }, { status: 400 });
    }
    if (radio < 50 || radio > 2000) {
        return NextResponse.json({ error: "radio debe estar entre 50 y 2000" }, { status: 400 });
    }

    try {
        const { paradas } = await getTransitStaticModels();
        if (paradas.length === 0) {
            return NextResponse.json(
                { error: "Catálogo estático no disponible" },
                { status: 503 },
            );
        }
        const items = paradasCercanasDe(paradas, lat, lng, radio, limit);
        return NextResponse.json({
            radioMetros: Math.round(radio),
            items: items.map(({ parada, distanciaMetros }) => ({
                identificador: parada.identificador,
                lat: parada.lat,
                lng: parada.lng,
                abreviaturaBandera: parada.abreviaturaBandera,
                calleLabel: parada.calleLabel,
                interseccionLabel: parada.interseccionLabel,
                distanciaMetros,
                lineas: parada.lineas,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Error al buscar paradas" }, { status: 500 });
    }
}
