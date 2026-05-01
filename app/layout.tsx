import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { JsonLd } from "@/components/JsonLd";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://www.bondimdp.com.ar"),
    title: {
        default: "Bondi MDP — Colectivos en Tiempo Real",
        template: "%s | Bondi MDP",
    },
    description: "Consultá cuándo llega el colectivo en Mar del Plata. Horarios, recorridos y paradas en tiempo real de todas las líneas (511, 522, 541, etc.) de MGP.",
    keywords: ["bondimdp", "bondi mdp", "colectivos mar del plata", "cuando llega mdp", "horarios colectivos mar del plata", "transporte publico mdp", "mgp", "paradas de colectivo"],
    manifest: "/manifest.json",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar",
        title: "Bondi MDP — Colectivos en Tiempo Real",
        description: "La forma más rápida de saber cuándo llega tu colectivo en Mar del Plata. Datos oficiales de MGP en una interfaz moderna.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Bondi MDP",
        description: "Colectivos en tiempo real en Mar del Plata. No pierdas más tiempo esperando.",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Bondi MDP",
    },
    verification: {
        google: [
            "KjCilanSVlDWUMLsTnJa4vj2NjVIeSNXFUlkG10JbgU",
            "ABFvUfmKFrDnQyejLLezkYWvZe7Vd8EuKO4mETRL8_A"
        ],
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
            { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
        ],
        apple: "/apple-icon.png",
        shortcut: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f7f7f4' },
        { media: '(prefers-color-scheme: dark)', color: '#0f2d4a' },
    ],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <Script
                    id="sw-registration"
                    strategy="afterInteractive"
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
            <body className={`${inter.variable}`}>
                <ThemeProvider>
                    <ThemeColorMeta />
                    <JsonLd />
                    <Analytics />
                    {children}
                    <InstallPwaPrompt />
                </ThemeProvider>
            </body>
        </html>
    );
}
