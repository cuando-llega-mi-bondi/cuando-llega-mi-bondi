import type { Metadata } from "next";
import { AcercaClient } from "@/app/acerca/AcercaClient";

export const metadata: Metadata = {
    title: {
        absolute: "¿Qué es BondiMDP? La app de colectivos de Mar del Plata",
    },
    description:
        "BondiMDP es la app gratuita para seguir el bondi en tiempo real en Mar del Plata. Conocé cómo funciona, quién la hace y cómo reportar problemas.",
    alternates: {
        canonical: "/acerca",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar/acerca",
        title: "¿Qué es BondiMDP? La app de colectivos de Mar del Plata",
        description:
            "App gratuita para seguir el bondi en tiempo real en Mar del Plata. Conocé al equipo y cómo funciona.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary",
        title: "¿Qué es BondiMDP?",
        description:
            "La app gratuita para seguir el bondi en tiempo real en Mar del Plata.",
    },
};

export default function AcercaPage() {
    return <AcercaClient />;
}
