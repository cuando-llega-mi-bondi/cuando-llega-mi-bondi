// app/recorrido/page.tsx
// Static route – no server data needed; the map is fully client-side.

import { Suspense } from "react";
import type { Metadata } from "next";
import { RecorridoJsonLd } from "@/components/RecorridoJsonLd";
import RecorridoClient from "./RecorridoClient";

export const metadata: Metadata = {
    title: {
        absolute: "Recorridos de colectivos en Mar del Plata — BondiMDP",
    },
    description:
        "Consultá el recorrido completo de cada línea de bondi en Mar del Plata. Paradas, mapas y horarios actualizados en tiempo real.",
    keywords: [
        "recorridos colectivos mar del plata",
        "mapa bondi mdp",
        "paradas colectivo mar del plata",
        "líneas colectivo mdp",
    ],
    alternates: {
        canonical: "/recorrido",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar/recorrido",
        title: "Recorridos de colectivos en Mar del Plata — BondiMDP",
        description:
            "Consultá el recorrido completo de cada línea de bondi. Paradas, mapas y horarios en tiempo real.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Recorridos de colectivos en Mar del Plata",
        description:
            "Mapa interactivo con recorridos y paradas de todas las líneas de bondi en Mar del Plata.",
    },
};

export default function RecorridoPage() {
    return (
        <>
            <section className="sr-only" aria-labelledby="recorrido-seo-title">
                <h1 id="recorrido-seo-title">
                    Recorridos de colectivos en Mar del Plata
                </h1>
                <p>
                    Consultá el recorrido completo de cada línea de bondi: paradas en el
                    mapa, ramales y datos actualizados de MGP en tiempo real.
                </p>
            </section>
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
