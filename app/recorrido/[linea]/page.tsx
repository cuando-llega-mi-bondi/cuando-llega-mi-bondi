import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLineas, getLineaData } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";
import RecorridoClient from "@features/route/components/RecorridoClient";
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
    const calles = lineaData?.calles ? extractCalleNames(lineaData.calles) : [];
    const paradasCount = lineaData?.recorrido?.paradas?.length ?? 0;
    const ramalesCount = lineaData?.recorrido?.ramales?.length ?? 0;

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
            "@type": "BusTrip",
            name: `Línea ${nombre}`,
            provider: {
                "@type": "Organization",
                name: "Transporte público de Mar del Plata",
            },
        },
    };

    // Get all lines for internal linking
    const allLineas = (await getLineas()) ?? [];
    const otherLines = allLineas.filter(
        (l) => l.CodigoLineaParada !== lineaInfo.CodigoLineaParada
    );

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

            {/* SEO-visible content (hidden visually, crawlable by bots) */}
            <section className="sr-only" aria-labelledby="linea-seo-title">
                <h1 id="linea-seo-title">
                    Recorrido de la línea {nombre} en Mar del Plata
                </h1>
                <p>
                    Mapa interactivo con el recorrido completo de la línea{" "}
                    {nombre} de colectivo en Mar del Plata.
                    {paradasCount > 0 && ` ${paradasCount} paradas`}
                    {ramalesCount > 1 && ` y ${ramalesCount} ramales`}.
                    Consultá las paradas, calles por las que pasa y horarios
                    actualizados con datos de MGP.
                </p>
                {calles.length > 0 && (
                    <>
                        <h2>
                            Calles principales de la línea {nombre}
                        </h2>
                        <ul>
                            {calles.map((c) => (
                                <li key={c}>{c}</li>
                            ))}
                        </ul>
                    </>
                )}
                {/* Internal links to other lines — helps Google crawl and link juice */}
                <nav aria-label="Otras líneas de colectivo">
                    <h2>Otras líneas de colectivo en Mar del Plata</h2>
                    <ul>
                        {otherLines.map((l) => (
                            <li key={l.CodigoLineaParada}>
                                <a href={`/recorrido/${lineaToSlug(l.Descripcion)}`}>
                                    Línea {l.Descripcion}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </section>

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
        </>
    );
}
