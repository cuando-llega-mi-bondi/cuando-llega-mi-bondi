import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
    metadataBase: new URL("https://cuandollega-tawny.vercel.app"),
    title: {
        default: "¿Cuándo Llega? MDP — Colectivos en Tiempo Real",
        template: "%s | CuándoLlega MDP",
    },
    description: "Consultá cuándo llega el colectivo en Mar del Plata. Horarios, recorridos y paradas en tiempo real de todas las líneas (511, 522, 541, etc.) de MGP.",
    keywords: ["colectivos mar del plata", "cuando llega mdp", "horarios colectivos mar del plata", "transporte publico mdp", "mgp", "paradas de colectivo"],
    manifest: "/manifest.json",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://cuandollega-tawny.vercel.app",
        title: "¿Cuándo Llega? MDP — Colectivos en Tiempo Real",
        description: "La forma más rápida de saber cuándo llega tu colectivo en Mar del Plata. Datos oficiales de MGP en una interfaz moderna.",
        siteName: "¿Cuándo Llega? MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "¿Cuándo Llega? MDP",
        description: "Colectivos en tiempo real en Mar del Plata. No pierdas más tiempo esperando.",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CuándoLlega",
    },
    icons: {
        apple: "/icon-192.png",
    },
    verification: {
        google: [
            "KjCilanSVlDWUMLsTnJa4vj2NjVIeSNXFUlkG10JbgU",
            "ABFvUfmKFrDnQyejLLezkYWvZe7Vd8EuKO4mETRL8_A"
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#0a0a0b",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500&display=swap" rel="stylesheet" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js')
                                        .catch(function(err) { console.warn('SW registration failed:', err); });
                                });
                            }
                        `,
                    }}
                />
            </head>
            <body>
                <JsonLd />
                <Analytics />
                {children}
            </body>
        </html>
    );
}
