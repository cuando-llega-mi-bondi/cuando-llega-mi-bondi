import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLineas, getLineaData } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";
import RecorridoClient from "@features/route/components/RecorridoClient";
import { LineaInfoSection } from "@features/route/components/LineaInfoSection";
import { buildLineaInfo } from "@features/route/lineaInfo";
import { AdSenseScript } from "@shared/ads/AdSenseScript";
import type { Linea } from "@shared/types";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const BASE_URL = "https://bondimdp.com.ar";

// ─── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
    const lineas = await getLineas();
    if (!lineas) return [{ linea: "__placeholder__" }];
    return lineas.map((l) => ({
        linea: lineaToSlug(l.Descripcion),
    }));
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function findLineaBySlug(slug: string): Promise<Linea | null> {
    const lineas = await getLineas();
    if (!lineas) return null;
    return lineas.find((l) => lineaToSlug(l.Descripcion) === slug) ?? null;
}

function extractCalleNames(calles: { label: string }[]): string[] {
    return calles.map((c) => {
        const idx = c.label.lastIndexOf(" - ");
        return idx > 0 ? c.label.slice(0, idx).trim() : c.label;
    });
}

// ─── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ linea: string }>;
}): Promise<Metadata> {
    const { linea: slug } = await params;
    const lineaInfo = await findLineaBySlug(slug);
    if (!lineaInfo) return {};

    const lineaData = await getLineaData(lineaInfo.CodigoLineaParada);
    const nombre = lineaInfo.Descripcion;
    const calles = lineaData?.calles
        ? extractCalleNames(lineaData.calles).slice(0, 6)
        : [];
    const callesStr =
        calles.length > 0 ? ` Calles: ${calles.join(", ")}.` : "";
    const paradasCount = lineaData?.recorrido?.paradas?.length ?? 0;
    const ramalesCount = lineaData?.recorrido?.ramales?.length ?? 0;

    const title = `Recorrido línea ${nombre} en Mar del Plata — Bondi MDP`;
    const description = `Consultá el recorrido completo de la línea ${nombre} en Mar del Plata. ${paradasCount > 0 ? `${paradasCount} paradas` : "Paradas"}${ramalesCount > 1 ? `, ${ramalesCount} ramales` : ""} y mapa interactivo.${callesStr}`;

    return {
        title: { absolute: title },
        description,
        keywords: [
            `recorrido ${nombre.toLowerCase()} mar del plata`,
            `linea ${nombre.toLowerCase()} mdp`,
            `${nombre.toLowerCase()} paradas`,
            `${nombre.toLowerCase()} recorrido`,
            `colectivo ${nombre.toLowerCase()} mar del plata`,
            `bondi ${nombre.toLowerCase()} mdp`,
            "recorridos colectivos mar del plata",
            "bondi mdp",
        ],
        alternates: {
            canonical: `/recorrido/${slug}`,
        },
        openGraph: {
            type: "website",
            locale: "es_AR",
            url: `${BASE_URL}/recorrido/${slug}`,
            title,
            description,
            siteName: "Bondi MDP",
        },
        twitter: {
            card: "summary_large_image",
            title: `Línea ${nombre} — Recorrido en Mar del Plata`,
            description,
        },
    };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function LineaRecorridoPage({
    params,
}: {
    params: Promise<{ linea: string }>;
}) {
    const { linea: slug } = await params;
    const lineaInfo = await findLineaBySlug(slug);
    if (!lineaInfo) notFound();

    const lineaData = await getLineaData(lineaInfo.CodigoLineaParada);
    const nombre = lineaInfo.Descripcion;

    // Catálogo completo: links a otras líneas y combinaciones por calles en común
    const allLineas = (await getLineas()) ?? [];
    const otherLines = allLineas.filter(
        (l) => l.CodigoLineaParada !== lineaInfo.CodigoLineaParada
    );
    const catalogo = await Promise.all(
        allLineas.map(async (l) => ({
            linea: l,
            dump: await getLineaData(l.CodigoLineaParada),
        }))
    );
    const info = lineaData ? buildLineaInfo(lineaInfo, lineaData, catalogo) : null;

    const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: BASE_URL,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Recorridos",
                item: `${BASE_URL}/recorrido`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `Línea ${nombre}`,
                item: `${BASE_URL}/recorrido/${slug}`,
            },
        ],
    };

    const webPage = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Recorrido línea ${nombre} en Mar del Plata`,
        description: `Mapa interactivo con el recorrido completo, paradas y ramales de la línea ${nombre} en Mar del Plata.`,
        url: `${BASE_URL}/recorrido/${slug}`,
        isPartOf: {
            "@type": "WebSite",
            name: "Bondi MDP",
            url: BASE_URL,
        },
        about: {
            "@type": "Service",
            serviceType: `Línea de colectivo ${nombre}`,
            areaServed: {
                "@type": "City",
                name: "Mar del Plata",
            },
            provider: {
                "@type": "Organization",
                name: "Bondi MDP",
                url: BASE_URL,
            },
        },
    };

    return (
        <>
            {/* JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbList),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
            />

            {/* Interactive map (client-side) — auto-selects this line */}
            <Suspense
                fallback={
                    <div className="flex min-h-pwa-shell flex-col items-center justify-center gap-2 bg-bg px-4 font-sans text-sm text-text-dim">
                        <span className="spin-slow inline-block h-5 w-5 rounded-full border-2 border-white/15 border-t-accent" />
                        Cargando mapa…
                    </div>
                }
            >
                <RecorridoClient
                    initialLineCode={lineaInfo.CodigoLineaParada}
                />
            </Suspense>

            {/* Ficha visible (reemplaza el bloque sr-only): calles, esquinas, combinaciones */}
            <LineaInfoSection linea={lineaInfo} info={info} otrasLineas={otherLines} />

            {/* AdSense solo en fichas con contenido real (no en líneas sin datos) */}
            {info && <AdSenseScript />}
        </>
    );
}
