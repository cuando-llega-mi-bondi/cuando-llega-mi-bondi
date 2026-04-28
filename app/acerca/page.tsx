import type { Metadata } from "next";
import { AcercaClient } from "@/components/AcercaClient";

export const metadata: Metadata = {
    title: "Acerca de",
    description:
        "Conocé al equipo detrás de ¿Cuándo Llega? MDP. Información de colectivos en tiempo real para Mar del Plata.",
    alternates: {
        canonical: "/acerca",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://cuandollega-tawny.vercel.app/acerca",
        title: "Acerca de | CuándoLlega MDP",
        description:
            "Conocé al equipo detrás de ¿Cuándo Llega? MDP. Información de colectivos en tiempo real para Mar del Plata.",
        siteName: "¿Cuándo Llega? MDP",
    },
    twitter: {
        card: "summary",
        title: "Acerca de | CuándoLlega MDP",
        description:
            "Conocé al equipo detrás de ¿Cuándo Llega? MDP.",
    },
};

export default function AcercaPage() {
    return <AcercaClient />;
}
