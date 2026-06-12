import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalyticsDeferred } from "@shared/analytics/GoogleAnalyticsDeferred";
import { MicrosoftClarityDeferred } from "@shared/analytics/MicrosoftClarityDeferred";
import { VercelAnalyticsDeferred } from "@shared/analytics/VercelAnalyticsDeferred";
import { JsonLd } from "@shared/seo/JsonLd";
import { InstallPwaPrompt } from "@shared/layout/InstallPwaPrompt";
import { ThemeColorMeta } from "@shared/layout/ThemeColorMeta";
import { ThemeProvider } from "@shared/layout/ThemeProvider";
import { PwaViewportSync } from "@shared/layout/PwaViewportSync";
import { ToasterDeferred } from "@shared/ui/ToasterDeferred";
import Script from "next/script";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
    weight: "variable",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://www.bondimdp.com.ar"),
    title: {
        default: "Bondi MDP — App de colectivos en Mar del Plata",
        template: "%s | Bondi MDP",
    },
    description:
        "App gratuita para saber cuándo llega tu bondi en Mar del Plata. Horarios, recorridos y paradas en tiempo real de todas las líneas (511, 522, 541 y más) con datos MGP.",
    keywords: [
        "bondimdp",
        "bondi mdp",
        "app bondi mar del plata",
        "app colectivos mar del plata",
        "colectivos mar del plata",
        "cuando llega mdp",
        "horarios colectivos mar del plata",
        "transporte publico mdp",
        "mgp",
        "paradas de colectivo",
    ],
    manifest: "/manifest.json",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://www.bondimdp.com.ar",
        title: "Bondi MDP — App de colectivos en Mar del Plata",
        description:
            "App gratuita para saber cuándo llega tu bondi en Mar del Plata. Datos oficiales de MGP en una interfaz rápida, instalable en el celular.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Bondi MDP — App de colectivos MDP",
        description:
            "App gratuita de colectivos en tiempo real para Mar del Plata. No pierdas más tiempo esperando el bondi.",
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
                    <PwaViewportSync />
                    <ThemeColorMeta />
                    <JsonLd />
                    <MicrosoftClarityDeferred />
                    <VercelAnalyticsDeferred />
                    <GoogleAnalyticsDeferred />
                    {children}
                    <ToasterDeferred />
                    <InstallPwaPrompt />
                </ThemeProvider>
            </body>
        </html>
    );
}
