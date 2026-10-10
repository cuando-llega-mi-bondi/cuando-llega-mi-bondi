import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { Footer } from "@shared/layout/Footer";
import { BrandLogo } from "@shared/ui/BrandLogo";
import { PLAY_STORE_URL } from "@shared/play/playStore";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
    title: {
        absolute: "App Android en Google Play | Bondi MDP",
    },
    description:
        "Descargá Bondi MDP gratis en Google Play: la app nativa de colectivos de Mar del Plata con arribos en tiempo real. También disponible como web y PWA.",
    alternates: {
        canonical: "/android",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/android",
        title: "App Android en Google Play | Bondi MDP",
        description:
            "Bondi MDP ya está en Google Play. Descargá la app nativa de colectivos de Mar del Plata.",
        siteName: "Bondi MDP",
        images: ["/opengraph-image"],
    },
    robots: {
        index: true,
        follow: true,
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
            name: "App Android",
            item: "https://bondimdp.com.ar/android",
        },
    ],
};

const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Bondi MDP",
    operatingSystem: "Android",
    applicationCategory: "TravelApplication",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ARS",
    },
    downloadUrl: PLAY_STORE_URL,
    installUrl: PLAY_STORE_URL,
    url: "https://bondimdp.com.ar/android",
    description:
        "App nativa de colectivos en Mar del Plata: arribos en tiempo real con datos oficiales de MGP.",
};

export default function AndroidPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(softwareJsonLd),
                }}
            />
            <div className="flex min-h-pwa-shell flex-col lg:pl-60">
                <PageShell className="space-y-8 pt-4">
                    <section className="space-y-3 text-center">
                        <BrandLogo className="text-3xl lg:text-4xl" />
                        <h1 className="text-[18px] font-semibold text-foreground">
                            Bondi MDP en Google Play
                        </h1>
                        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                            Ya podés descargar la app nativa gratis en Android. La web y la PWA
                            siguen disponibles igual que siempre.
                        </p>
                    </section>

                    <section className="space-y-3 rounded-2xl border border-amarillo/40 bg-amarillo/10 p-5 text-center">
                        <p className="text-[12px] font-medium uppercase tracking-wider text-amarillo">
                            Disponible ahora
                        </p>
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-pill btn-primary inline-flex min-h-12 w-full items-center justify-center px-6 text-base font-semibold"
                        >
                            Descargar en Google Play
                        </a>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">
                            Gratis · sin registro · datos oficiales de MGP
                        </p>
                    </section>

                    <section className="space-y-3 rounded-xl border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">
                        <p className="font-semibold text-foreground">También sin tienda</p>
                        <p>
                            Si preferís no pasar por Play Store, seguí usando{" "}
                            <Link
                                href="/"
                                className="underline decoration-border underline-offset-2 hover:text-foreground"
                            >
                                bondimdp.com.ar
                            </Link>{" "}
                            en el navegador o instalala como PWA desde el menú del browser (iPhone
                            y Android).
                        </p>
                    </section>

                    <Footer />
                </PageShell>
                <BottomNav />
            </div>
        </>
    );
}
