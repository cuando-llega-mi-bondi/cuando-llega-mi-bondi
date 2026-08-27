import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES, getArticle } from "@features/blog/data/articles";
import { BlogNav } from "@features/blog/components/BlogNav";
import { BlogFooter } from "@features/blog/components/BlogFooter";
import { Prose } from "@shared/ui/Prose";
import { formatFechaEs } from "@shared/utils";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const BASE_URL = "https://bondimdp.com.ar";

export async function generateStaticParams() {
    return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) return {};

    return {
        title: { absolute: `${article.title} — Bondi MDP` },
        description: article.description,
        keywords: article.tags,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            type: "article",
            locale: "es_AR",
            url: `${BASE_URL}/blog/${slug}`,
            title: article.title,
            description: article.description,
            siteName: "Bondi MDP",
            publishedTime: article.datePublished,
            modifiedTime: article.dateModified,
            section: article.section,
            tags: article.tags,
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.description,
        },
    };
}

export default async function BlogArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) notFound();

    const { Body, title, description, datePublished, dateModified, section } = article;

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: title, item: `${BASE_URL}/blog/${slug}` },
        ],
    };

    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        datePublished,
        dateModified,
        author: [
            { "@type": "Person", name: "Nicolás Jiménez", url: "https://dotfn.dev" },
            { "@type": "Person", name: "Matias Celiz Ramos", url: "https://celizin.dev" },
        ],
        publisher: {
            "@type": "Organization",
            name: "Bondi MDP",
            logo: { "@type": "ImageObject", url: `${BASE_URL}/icon-512x512.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${slug}` },
        image: `${BASE_URL}/blog/${slug}/opengraph-image`,
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground antialiased">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />

            <a
                href="#main-content"
                className="absolute left-4 top-[-100px] z-[10000] rounded bg-primary px-4 py-2 font-bold text-[#08131E] transition-all focus:top-4"
            >
                Saltar al contenido
            </a>

            <BlogNav />

            <header className="hero border-b border-border bg-[linear-gradient(180deg,rgba(0,63,125,0.12)_0%,transparent_100%)] px-6 py-16">
                <div className="mx-auto max-w-[880px]">
                    <nav
                        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
                        aria-label="Migas de pan"
                    >
                        <Link href="/" className="transition-colors hover:text-primary">
                            Inicio
                        </Link>
                        <span aria-hidden="true" className="opacity-40">
                            ›
                        </span>
                        <Link href="/blog" className="transition-colors hover:text-primary">
                            Blog
                        </Link>
                        <span aria-hidden="true" className="opacity-40">
                            ›
                        </span>
                        <span aria-current="page" className="text-primary">
                            {title}
                        </span>
                    </nav>
                    <div className="mb-4 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="rounded-full border border-primary/25 bg-primary/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {section}
                        </span>
                        <span className="opacity-20" aria-hidden="true">
                            ·
                        </span>
                        <time dateTime={datePublished}>{formatFechaEs(datePublished)}</time>
                    </div>
                    <h1 className="mb-5 max-w-2xl font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                        {title}
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {description}
                    </p>
                </div>
            </header>

            <main id="main-content">
                <section className="px-6 py-16">
                    <div className="mx-auto max-w-[880px]">
                        <Prose>
                            <Body />
                        </Prose>
                    </div>
                </section>
            </main>

            <BlogFooter />
        </div>
    );
}
