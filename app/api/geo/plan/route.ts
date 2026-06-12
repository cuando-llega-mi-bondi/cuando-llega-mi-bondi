    import { NextRequest, NextResponse } from "next/server";
import { getTransitStaticModels } from "@/lib/server/transitStaticModels";
import {
    buildItineraryMapView,
    type ItineraryMapView,
} from "@features/trip-planner/lib/itineraryMapPayload";
import { planMany } from "@features/trip-planner/lib/planner";
import type { Itinerary } from "@features/trip-planner/types";

function enRegionMgp(lat: number, lng: number): boolean {
    return lat >= -39.5 && lat <= -36.0 && lng >= -58.6 && lng <= -56.0;
}

/**
 * Cache LRU en memoria de planes ya calculados. Coordenadas redondeadas a
 * 4 decimales (~11 m): swap origen/destino, re-búsquedas y puntos casi
 * idénticos responden al instante.
 */
const PLAN_CACHE_MAX = 100;
const planCache = new Map<
    string,
    { itineraries: Itinerary[]; mapViews: ItineraryMapView[] }
>();

function planCacheKey(
    oLat: number,
    oLng: number,
    dLat: number,
    dLng: number,
    max: number,
): string {
    return `${oLat.toFixed(4)},${oLng.toFixed(4)}|${dLat.toFixed(4)},${dLng.toFixed(4)}|${max}`;
}

/**
 * Warm-up: el cliente lo dispara al montar la página para que el grafo de
 * routing (construcción costosa, una vez por proceso) ya esté listo cuando
 * llegue la primera búsqueda real.
 */
export async function GET() {
    try {
        const { graph } = await getTransitStaticModels();
        return NextResponse.json({ ready: graph.sequences.length > 0 });
    } catch {
        return NextResponse.json({ ready: false }, { status: 500 });
    }
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
        const cacheKey = planCacheKey(originLat, originLng, destLat, destLng, max);
        const cached = planCache.get(cacheKey);
        if (cached) {
            // Refrescar recencia (LRU): re-insertar al final del Map.
            planCache.delete(cacheKey);
            planCache.set(cacheKey, cached);
            return NextResponse.json(cached);
        }

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

        const payload = { itineraries, mapViews };
        planCache.set(cacheKey, payload);
        if (planCache.size > PLAN_CACHE_MAX) {
            const oldest = planCache.keys().next().value;
            if (oldest != null) planCache.delete(oldest);
        }
        return NextResponse.json(payload);
    } catch {
        return NextResponse.json({ error: "Error al planificar" }, { status: 500 });
    }
}
