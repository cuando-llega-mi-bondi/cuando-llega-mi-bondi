"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface LiveSharePoint {
    lat: number;
    lng: number;
    ramal: string | null;
}

export function useLiveBuses(codLinea: string) {
    const [liveSharings, setLiveSharings] = useState<LiveSharePoint[]>([]);

    useEffect(() => {
        if (!codLinea) {
            return;
        }

        function fetchLive() {
            supabase
                .from("bus_locations")
                .select("lat, lng, ramal")
                .eq("linea", codLinea)
                .gte("updated_at", new Date(Date.now() - 180000).toISOString())
                .then(({ data }) => {
                    const rows = (data || []) as LiveSharePoint[];
                    setLiveSharings(
                        rows.map((row) => ({
                            lat: row.lat,
                            lng: row.lng,
                            ramal: row.ramal ?? null,
                        })),
                    );
                });
        }

        fetchLive();

        const channel = supabase
            .channel(`bus-home-${codLinea}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bus_locations",
                    filter: `linea=eq.${codLinea}`,
                },
                () => {
                    fetchLive();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [codLinea]);

    return {
        liveSharings: codLinea ? liveSharings : [],
    };
}
