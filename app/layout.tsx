import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { JsonLd } from "@/components/JsonLd";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    variable: "--font-inter",
});

const outfit = Outfit({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-outfit",
});

const azeretMono = Azeret_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
    variable: "--font-azeret-mono",
});

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
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
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
            <body className={`${inter.variable} ${outfit.variable} ${azeretMono.variable}`}>
                <JsonLd />
                <Analytics />
                {children}
                <InstallPwaPrompt />
            </body>
        </html>
    );
}
