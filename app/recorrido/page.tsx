// app/recorrido/page.tsx
// Static route – no server data needed; the map is fully client-side.

import { Suspense } from "react";
import type { Metadata } from "next";
import { RecorridoJsonLd } from "@/components/RecorridoJsonLd";
import RecorridoClient from "./RecorridoClient";

export const metadata: Metadata = {
    title: "Recorridos de Colectivos MDP",
    description: "Mirá el mapa completo con todos los recorridos y paradas de las líneas de colectivos en Mar del Plata. Mapa interactivo actualizado de MGP.",
    alternates: {
        canonical: "/recorrido",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar/recorrido",
        title: "Recorridos de Colectivos MDP | Bondi MDP",
        description:
            "Mapa interactivo con recorridos y paradas de colectivos en Mar del Plata. Datos MGP.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Recorridos de Colectivos MDP",
        description: "Mapa de recorridos y paradas en Mar del Plata.",
    },
};

export default function RecorridoPage() {
    return (
        <>
            <RecorridoJsonLd />
            <Suspense
                fallback={
                    <div className="flex min-h-pwa-shell flex-col items-center justify-center gap-2 bg-bg px-4 font-sans text-sm text-text-dim">
                        <span className="spin-slow inline-block h-5 w-5 rounded-full border-2 border-white/15 border-t-accent" />
                        Cargando mapa…
                    </div>
                }
            >
                <RecorridoClient />
            </Suspense>
        </>
    );
}
