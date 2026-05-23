import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MicrosoftClarity } from "@shared/analytics/MicrosoftClarity";
import { VercelAnalyticsDeferred } from "@shared/analytics/VercelAnalyticsDeferred";
import { JsonLd } from "@shared/seo/JsonLd";
import { InstallPwaPrompt } from "@shared/layout/InstallPwaPrompt";
import { ThemeColorMeta } from "@shared/layout/ThemeColorMeta";
import { ThemeProvider } from "@shared/layout/ThemeProvider";
import { PwaViewportSync } from "@shared/layout/PwaViewportSync";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

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
                {/*
                  iOS PWA: 100dvh puede quedar ~un safe-area más corto que la pantalla real,
                  dejando una franja bajo la barra fija. Sincronizamos altura con inner/visualViewport.
                */}
                <Script
                    id="standalone-app-height"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
(function(){
  try {
    var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true;
    if (!standalone) return;
    var lastH = 0;
    function setAppHeight() {
      var ih = window.innerHeight || 0;
      var vvh = (window.visualViewport && window.visualViewport.height) || 0;
      var ch = document.documentElement.clientHeight || 0;
      /*
       * screen.height is stable from the very first frame on iOS, even when
       * innerHeight hasn't settled yet. Use it as a ceiling: the real usable
       * height can never exceed screen.height.
       */
      var sh = window.screen && window.screen.height ? window.screen.height : 0;
      var h = Math.max(ih, vvh, ch);
      /* If innerHeight is suspiciously small (< 70% of screen), iOS hasn't
         settled yet — skip this measurement so the CSS 100% fallback stays. */
      if (sh && h < sh * 0.7) return;
      if (h === lastH) return;
      lastH = h;
      document.documentElement.style.setProperty("--app-height", h + "px");
    }
    function setSafeBottomProbe() {
      var el = document.createElement("div");
      el.setAttribute("style", "position:fixed;bottom:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;z-index:-1;padding-bottom:env(safe-area-inset-bottom,0px);");
      document.body.appendChild(el);
      var pb = parseFloat(window.getComputedStyle(el).paddingBottom) || 0;
      document.body.removeChild(el);
      document.documentElement.style.setProperty("--safe-bottom-live", pb + "px");
    }
    function bump() {
      setAppHeight();
      if (document.body) setSafeBottomProbe();
    }
    bump();
    requestAnimationFrame(function(){bump();requestAnimationFrame(bump);});
    [0,16,50,120,280,500].forEach(function(ms){setTimeout(bump,ms);});
    window.addEventListener("load", bump);
    window.addEventListener("resize", bump);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", bump);
      window.visualViewport.addEventListener("scroll", bump);
    }
  } catch (e) {}
})();
                        `.trim(),
                    }}
                />
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
                    <MicrosoftClarity />
                    <VercelAnalyticsDeferred />
                    {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
                        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
                    ) : null}
                    {children}
                    <InstallPwaPrompt />
                </ThemeProvider>
            </body>
        </html>
    );
}
