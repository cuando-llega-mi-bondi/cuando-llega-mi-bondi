"use client";

import dynamic from "next/dynamic";
import type { WalkRoute } from "@/lib/osrm";

const Inner = dynamic(() => import("./StopMapInner"), {
    ssr: false,
    loading: () => (
        <div className="relative h-[260px] overflow-hidden rounded-3xl border border-[#E8E2D2] v2-card-shadow">
            <div className="absolute inset-0 v2-skeleton" />
        </div>
    ),
});

export function StopMap({
    stopLat,
    stopLng,
    route,
}: {
    stopLat: number;
    stopLng: number;
    route: WalkRoute | null;
}) {
    return <Inner stopLat={stopLat} stopLng={stopLng} route={route} />;
}
