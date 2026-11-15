// app/paradas-cerca/page.tsx
// Ruta estática — el mapa de paradas cercanas es 100% client-side (geolocalización + Leaflet).

import type { Metadata } from "next";
import { Suspense } from "react";
import { ParadasCercaClient } from "@features/search/components/ParadasCercaClient";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
    title: {
        absolute: "Paradas de colectivo cerca tuyo — Bondi MDP",
    },
    description:
        "Encontrá las paradas de colectivo más cercanas a tu ubicación en Mar del Plata, vistas en el mapa, y consultá qué líneas pasan por cada una.",
    keywords: [
        "paradas de colectivo cerca",
        "paradas cercanas mar del plata",
        "mapa paradas bondi mdp",
        "qué colectivo pasa cerca mío",
        "parada de bondi más cercana",
        "paradas colectivo cerca de mi ubicación",
        "paradas de colectivo mar del plata mapa",
    ],
    alternates: {
        canonical: "/paradas-cerca",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/paradas-cerca",
        title: "Paradas de colectivo cerca tuyo — Bondi MDP",
        description:
            "Mirá en el mapa las paradas de colectivo más cercanas a vos en Mar del Plata y qué líneas pasan por cada una.",
        siteName: "Bondi MDP",
        images: ["/opengraph-image"],
    },
    twitter: {
        card: "summary",
        title: "Paradas de colectivo cerca tuyo — Bondi MDP",
        description:
            "Las paradas de colectivo más cercanas a tu ubicación en Mar del Plata, en el mapa.",
    },
};

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: "https://bondimdp.com.ar",
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Paradas cerca mío",
            item: "https://bondimdp.com.ar/paradas-cerca",
        },
    ],
};

export default function ParadasCercaPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
            <section className="sr-only" aria-labelledby="paradas-cerca-seo-title">
                <h1 id="paradas-cerca-seo-title">Paradas de colectivo cerca tuyo en Mar del Plata</h1>
                <p>
                    Activá tu ubicación para ver en el mapa las paradas de colectivo más cercanas y
                    descubrir qué líneas de bondi pasan por cada una.
                </p>
            </section>
            <Suspense
                fallback={
                    <div className="flex min-h-pwa-shell flex-col items-center justify-center gap-2 bg-bg px-4 font-sans text-sm text-text-dim">
                        <span className="spin-slow inline-block h-5 w-5 rounded-full border-2 border-white/15 border-t-accent" />
                        Cargando mapa…
                    </div>
                }
            >
                <ParadasCercaClient />
            </Suspense>
        </>
    );
}
