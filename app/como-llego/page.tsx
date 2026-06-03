import type { Metadata } from "next";
import { Suspense } from "react";
import { ComoLlegoClient } from "@features/trip-planner/components/ComoLlegoClient";

export const metadata: Metadata = {
    title: {
        absolute: "Cómo llego en bondi — BondiMDP",
    },
    description:
        "Planificá tu viaje en colectivo por Mar del Plata. Ingresá tu destino y encontrá qué línea tomar, paradas y tiempos de llegada en tiempo real.",
    keywords: [
        "cómo llego en bondi",
        "planificador colectivos mar del plata",
        "qué línea tomar mdp",
        "viaje en colectivo mar del plata",
    ],
    alternates: {
        canonical: "/como-llego",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar/como-llego",
        title: "Cómo llego en bondi — BondiMDP",
        description:
            "Planificá tu viaje en colectivo por Mar del Plata. Encontrá qué línea tomar, paradas y tiempos en tiempo real.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary",
        title: "Cómo llego en bondi — BondiMDP",
        description:
            "Planificá tu viaje en colectivo por Mar del Plata. Paradas, líneas y tiempos en tiempo real.",
    },
};

export default function ComoLlegoPage() {
    return (
        <>
            <section className="sr-only" aria-labelledby="como-llego-seo-title">
                <h1 id="como-llego-seo-title">Cómo llego en bondi por Mar del Plata</h1>
                <p>
                    Planificá tu viaje en colectivo: ingresá origen y destino para ver qué
                    línea tomar, paradas cercanas y tiempos de llegada en tiempo real.
                </p>
            </section>
            <Suspense fallback={null}>
                <ComoLlegoClient />
            </Suspense>
        </>
    );
}
