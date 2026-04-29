import type { Metadata } from "next";
import { AcercaClient } from "@/components/AcercaClient";

export const metadata: Metadata = {
    title: "Acerca de",
    description:
        "Conocé al equipo detrás de Bondi MDP. Información de colectivos en tiempo real para Mar del Plata.",
    alternates: {
        canonical: "/acerca",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar/acerca",
        title: "Acerca de | Bondi MDP",
        description:
            "Conocé al equipo detrás de Bondi MDP. Información de colectivos en tiempo real para Mar del Plata.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary",
        title: "Acerca de | Bondi MDP",
        description:
            "Conocé al equipo detrás de Bondi MDP.",
    },
};

export default function AcercaPage() {
    return <AcercaClient />;
}
