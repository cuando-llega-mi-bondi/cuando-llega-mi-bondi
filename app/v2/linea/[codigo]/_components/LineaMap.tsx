"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Stop } from "@/lib/static/stops";

const Inner = dynamic(() => import("./LineaMapInner"), {
    ssr: false,
    loading: () => (
        <div className="relative h-[280px] overflow-hidden rounded-3xl border border-[#E8E2D2] v2-card-shadow">
            <div className="absolute inset-0 v2-skeleton" />
        </div>
    ),
});

type GeoJSONFeature = {
    geometry?: {
        type?: string;
        coordinates?: number[][] | number[][][];
    };
};
type GeoJSON = {
    type?: string;
    features?: GeoJSONFeature[];
    geometry?: GeoJSONFeature["geometry"];
};

function extractLineString(gj: GeoJSON): Array<[number, number]> {
    const features = gj.features ?? (gj.geometry ? [{ geometry: gj.geometry }] : []);
    for (const feat of features) {
        const geom = feat.geometry;
        if (!geom) continue;
        if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
            return (geom.coordinates as number[][]).map(
                (c) => [c[1]!, c[0]!] as [number, number],
            );
        }
        if (geom.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
            const all: Array<[number, number]> = [];
            for (const line of geom.coordinates as number[][][]) {
                for (const c of line) all.push([c[1]!, c[0]!]);
            }
            return all;
        }
    }
    return [];
}

export function LineaMap({
    paradas,
    polylineUrl,
    lineaDescripcion,
}: {
    paradas: Stop[];
    polylineUrl?: string;
    lineaDescripcion: string;
}) {
    const [polyline, setPolyline] = useState<Array<[number, number]> | undefined>(
        undefined,
    );

    useEffect(() => {
        if (!polylineUrl) return;
        let cancelled = false;
        fetch(polylineUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((gj: GeoJSON | null) => {
                if (cancelled || !gj) return;
                const pts = extractLineString(gj);
                if (pts.length > 0) setPolyline(pts);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [polylineUrl]);

    return (
        <Inner
            paradas={paradas}
            polyline={polylineUrl ? polyline : undefined}
            lineaDescripcion={lineaDescripcion}
        />
    );
}
