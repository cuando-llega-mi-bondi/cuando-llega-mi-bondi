import { NextRequest, NextResponse } from "next/server";
import { getTransitStaticModels } from "@/lib/server/transitStaticModels";
import { buildItineraryMapView } from "@/lib/routing/itineraryMapPayload";
import { planMany } from "@/lib/routing/planner";

function enRegionMgp(lat: number, lng: number): boolean {
    return lat >= -39.5 && lat <= -36.0 && lng >= -58.6 && lng <= -56.0;
}

type Body = {
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    max?: number;
};

export async function POST(req: NextRequest) {
    let body: Body;
    try {
        body = (await req.json()) as Body;
    } catch {
        return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const { originLat, originLng, destLat, destLng } = body;
    const max = Math.min(8, Math.max(1, Math.floor(body.max ?? 5)));

    if (
        typeof originLat !== "number" ||
        typeof originLng !== "number" ||
        typeof destLat !== "number" ||
        typeof destLng !== "number" ||
        !Number.isFinite(originLat) ||
        !Number.isFinite(originLng) ||
        !Number.isFinite(destLat) ||
        !Number.isFinite(destLng)
    ) {
        return NextResponse.json(
            { error: "originLat, originLng, destLat y destLng numéricos son obligatorios" },
            { status: 400 },
        );
    }

    if (
        !enRegionMgp(originLat, originLng) ||
        !enRegionMgp(destLat, destLng)
    ) {
        return NextResponse.json({ error: "Coordenadas fuera de la zona cubierta" }, { status: 400 });
    }

    try {
        const { graph } = await getTransitStaticModels();
        if (graph.sequences.length === 0) {
            return NextResponse.json(
                { error: "Grafo de líneas no disponible" },
                { status: 503 },
            );
        }
        const itineraries = planMany(
            graph,
            originLat,
            originLng,
            destLat,
            destLng,
            3,
            max,
        );
        const mapViews = itineraries.map((it) =>
            buildItineraryMapView(graph, it, originLat, originLng, destLat, destLng),
        );
        return NextResponse.json({ itineraries, mapViews });
    } catch {
        return NextResponse.json({ error: "Error al planificar" }, { status: 500 });
    }
}
