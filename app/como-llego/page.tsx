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
        "cómo llego en colectivo mar del plata",
        "planificador colectivos mar del plata",
        "qué línea tomar mdp",
        "viaje en colectivo mar del plata",
        "cómo ir en bondi mar del plata",
        "planificar viaje transporte publico mdp",
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

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: "https://www.bondimdp.com.ar",
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Cómo llego",
            item: "https://www.bondimdp.com.ar/como-llego",
        },
    ],
};

/**
 * Shell estático que replica el layout del overlay real (barra superior +
 * tarjeta de búsqueda). Se prerenderiza en el server: la página pinta algo
 * útil al instante mientras baja el JS del cliente, en vez de quedar en blanco.
 */
function ComoLlegoSkeleton() {
    return (
        <div className="fixed inset-0 z-80 min-h-pwa-shell overflow-hidden bg-[#0a1628]">
            <div className="absolute inset-x-0 top-0 flex flex-col gap-3 px-3 pt-[max(calc(env(safe-area-inset-top)+10px),14px)]">
                <div className="flex items-center justify-between gap-2">
                    <div className="h-11 w-11 shrink-0 rounded-full border border-border bg-card/90 shadow-lg" aria-hidden />
                    <p className="min-w-0 flex-1 truncate text-center text-base font-black tracking-tight text-white drop-shadow-sm">
                        ¿Cómo llego?
                    </p>
                    <div className="h-11 w-11 shrink-0 rounded-full border border-border bg-card/90 shadow-lg" aria-hidden />
                </div>
                <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-xl">
                    <div className="flex animate-pulse flex-col gap-3" aria-hidden>
                        <div className="h-10 rounded-xl bg-muted/60" />
                        <div className="h-10 rounded-xl bg-muted/60" />
                        <div className="mt-1 h-9 rounded-xl bg-muted/40" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ComoLlegoPage() {
    return (
        <>
            {/* Tiles del mapa: abrir la conexión antes de que cargue Leaflet */}
            <link rel="preconnect" href="https://mt1.google.com" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
            <section className="sr-only" aria-labelledby="como-llego-seo-title">
                <h1 id="como-llego-seo-title">Cómo llego en bondi por Mar del Plata</h1>
                <p>
                    Planificá tu viaje en colectivo: ingresá origen y destino para ver qué
                    línea tomar, paradas cercanas y tiempos de llegada en tiempo real.
                </p>
            </section>
            <Suspense fallback={<ComoLlegoSkeleton />}>
                <ComoLlegoClient />
            </Suspense>
        </>
    );
}
