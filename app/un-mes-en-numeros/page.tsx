
export const metadata: Metadata = {
    title: "Bondi MDP: estadísticas del primer mes — 19.267 usuarios en Mar del Plata",
    description: "Bondi MDP, la app gratuita de colectivos en tiempo real para Mar del Plata, alcanzó 19.267 usuarios activos, 300.000 vistas y ratio de fidelidad 2:1 en su primer mes. Datos completos de adopción, cobertura y desempeño técnico.",
    keywords: [
        "Bondi MDP",
        "app colectivos Mar del Plata",
        "transporte público Mar del Plata",
        "cuándo llega el colectivo MDP",
        "app bondi tiempo real",
        "estadísticas bondimdp",
        "informe mensual app transporte"
    ],
    authors: [{ name: "Bondi MDP" }],
    alternates: {
        canonical: "https://bondimdp.com.ar/un-mes-en-numeros",
    },
    other: {
        "geo.region": "AR-B",
        "geo.placename": "Mar del Plata, Partido de General Pueyrredón, Buenos Aires, Argentina",
        "geo.position": "-38.0055;-57.5426",
        "ICBM": "-38.0055, -57.5426",
    },
    openGraph: {
        type: "article",
        title: "Bondi MDP: estadísticas del primer mes — 19.267 usuarios en Mar del Plata",
        description: "19.267 usuarios activos, 300.000 vistas y ratio de fidelidad 2:1 en 30 días. Sin campañas pagas. Solo la app y el boca a boca marplatense.",
        url: "https://bondimdp.com.ar/un-mes-en-numeros",
        images: [
            {
                url: "https://bondimdp.com.ar/og/estadisticas-1-mes.jpg",
                width: 1200,
                height: 630,
                alt: "Bondi MDP: estadísticas del primer mes. 19.267 usuarios activos. 300.000 vistas. Ratio 2:1.",
            },
        ],
        siteName: "Bondi MDP",
        locale: "es_AR",
        publishedTime: "2026-05-28T09:00:00-03:00",
        modifiedTime: "2026-05-28T09:00:00-03:00",
        section: "Estadísticas",
        tags: ["Mar del Plata", "Transporte público", "App colectivos", "Partido de General Pueyrredón"],
    },
    twitter: {
        card: "summary_large_image",
        site: "@bondimdp",
        title: "Bondi MDP: estadísticas del primer mes — 19.267 usuarios en Mar del Plata",
        description: "19.267 usuarios activos, 300.000 vistas, ratio 2:1. Un mes de datos de la app de colectivos en tiempo real de Mar del Plata.",
        images: ["https://bondimdp.com.ar/og/estadisticas-1-mes.jpg"],
    },
};

import { Metadata } from "next";
import PrimerMesClient from "./PrimerMesClient";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
    return <PrimerMesClient />;
}
