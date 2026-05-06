"use client";

import dynamic from "next/dynamic";
import type { Stop } from "@/lib/static/stops";

const Inner = dynamic(() => import("./NearbyMapInner"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[340px] overflow-hidden rounded-3xl border border-[#E8E2D2] v2-card-shadow">
      <div className="absolute inset-0 v2-skeleton" />
    </div>
  ),
});

export function NearbyMap({ stops }: { stops: Stop[] }) {
  return <Inner stops={stops} />;
}
