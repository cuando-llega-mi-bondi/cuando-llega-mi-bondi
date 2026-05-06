import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OSRM_BASE = (
    process.env.OSRM_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

function isFiniteNum(x: unknown): x is number {
    return typeof x === "number" && Number.isFinite(x);
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const fromLat = Number(searchParams.get("fromLat"));
    const fromLng = Number(searchParams.get("fromLng"));
    const toLat = Number(searchParams.get("toLat"));
    const toLng = Number(searchParams.get("toLng"));

    if (![fromLat, fromLng, toLat, toLng].every(isFiniteNum)) {
        return NextResponse.json({ error: "bad coords" }, { status: 400 });
    }

    const url = `${OSRM_BASE}/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) {
            return NextResponse.json({ error: "osrm down" }, { status: 502 });
        }
        const data = (await res.json()) as {
            code?: string;
            routes?: Array<{
                distance: number;
                duration: number;
                geometry: { coordinates: Array<[number, number]> };
            }>;
        };
        if (data.code !== "Ok" || !data.routes?.length) {
            return NextResponse.json({ error: "no route" }, { status: 404 });
        }
        const r = data.routes[0];
        return NextResponse.json({
            distanceMts: Math.round(r.distance),
            durationSec: Math.round(r.duration),
            polyline: r.geometry.coordinates.map(
                ([lng, lat]) => [lat, lng] as [number, number],
            ),
        });
    } catch (e) {
        return NextResponse.json(
            { error: (e as Error).message || "fetch failed" },
            { status: 502 },
        );
    }
}
