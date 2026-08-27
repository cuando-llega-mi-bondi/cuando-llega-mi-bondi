import type { Metadata } from "next";
import { AcercaClient } from "@/app/acerca/AcercaClient";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
    title: {
        absolute: "¿Qué es Bondi MDP? La app de colectivos de Mar del Plata",
    },
    description:
        "Bondi MDP es la app gratuita para seguir el bondi en tiempo real en Mar del Plata. Conocé cómo funciona, quién la hace y cómo reportar problemas.",
    alternates: {
        canonical: "/acerca",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/acerca",
        title: "¿Qué es Bondi MDP? La app de colectivos de Mar del Plata",
        description:
            "App gratuita para seguir el bondi en tiempo real en Mar del Plata. Conocé al equipo y cómo funciona.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary",
        title: "¿Qué es Bondi MDP?",
        description:
            "La app gratuita para seguir el bondi en tiempo real en Mar del Plata.",
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
            name: "Acerca",
            item: "https://bondimdp.com.ar/acerca",
        },
    ],
};

export default function AcercaPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
            <AcercaClient />
        </>
    );
}
