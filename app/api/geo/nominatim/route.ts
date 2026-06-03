import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "BondiMDP-PWA/1.0 (+https://www.bondimdp.com.ar/)";

export async function GET(req: NextRequest) {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 3) {
        return NextResponse.json({ results: [] });
    }
    if (q.length > 200) {
        return NextResponse.json({ error: "Consulta demasiado larga" }, { status: 400 });
    }

    const params = new URLSearchParams({
        q: `${q}, Mar del Plata, Argentina`,
        format: "json",
        limit: "8",
        addressdetails: "0",
    });

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: {
                    "User-Agent": USER_AGENT,
                    Accept: "application/json",
                    "Accept-Language": "es",
                },
                next: { revalidate: 3600 },
            },
        );
        if (!res.ok) {
            return NextResponse.json(
                { error: "Geocodificación no disponible" },
                { status: 502 },
            );
        }
        const raw = (await res.json()) as {
            lat: string;
            lon: string;
            display_name: string;
            name?: string;
        }[];
        const results = raw.map((row) => {
            const lat = Number(row.lat);
            const lng = Number(row.lon);
            const label = (row.name && row.name.trim()) || row.display_name.split(",")[0]?.trim() || row.display_name;
            return {
                label,
                fullLabel: row.display_name,
                lat,
                lng,
            };
        }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
        return NextResponse.json({ results });
    } catch {
        return NextResponse.json({ error: "Error de red" }, { status: 502 });
    }
}
