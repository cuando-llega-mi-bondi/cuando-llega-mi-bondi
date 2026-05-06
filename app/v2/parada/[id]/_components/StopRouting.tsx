"use client";

import { useState } from "react";
import type { WalkRoute } from "@/lib/osrm";
import { DistanceInfo } from "./DistanceInfo";
import { StopMap } from "./StopMap";

export function StopRouting({ stopLat, stopLng }: { stopLat: number; stopLng: number }) {
    const [route, setRoute] = useState<WalkRoute | null>(null);

    return (
        <>
            <div className="px-5">
                <StopMap stopLat={stopLat} stopLng={stopLng} route={route} />
            </div>
            <div className="px-5">
                <DistanceInfo
                    stopLat={stopLat}
                    stopLng={stopLng}
                    onRouteChange={setRoute}
                />
            </div>
        </>
    );
}
