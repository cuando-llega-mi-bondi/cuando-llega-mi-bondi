// app/recorrido/page.tsx
// Static route – no server data needed; the map is fully client-side.

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
            <RecorridoClient />
        </>
    );
}
