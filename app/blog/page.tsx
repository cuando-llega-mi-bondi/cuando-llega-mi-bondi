import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES } from "@features/blog/data/articles";
import { ArticleCard } from "@features/blog/components/ArticleCard";
import { BlogNav } from "@features/blog/components/BlogNav";
import { BlogFooter } from "@features/blog/components/BlogFooter";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const BASE_URL = "https://bondimdp.com.ar";

export const metadata: Metadata = {
    title: {
        absolute: "Blog — Bondi MDP",
    },
    description:
        "Comparativas y guías sobre transporte público en Mar del Plata: Bondi MDP vs. la app oficial, y cómo saber cuándo llega el colectivo en tiempo real.",
    alternates: {
        canonical: "/blog",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: `${BASE_URL}/blog`,
        title: "Blog — Bondi MDP",
        description:
            "Comparativas y guías sobre transporte público en Mar del Plata, hechas por el equipo de Bondi MDP.",
        siteName: "Bondi MDP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog — Bondi MDP",
        description: "Comparativas y guías sobre transporte público en Mar del Plata.",
    },
};

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
    ],
};

const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog — Bondi MDP",
    url: `${BASE_URL}/blog`,
    publisher: {
        "@type": "Organization",
        name: "Bondi MDP",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/icon-512x512.png` },
    },
    blogPost: ARTICLES.map((a) => ({
        "@type": "BlogPosting",
        headline: a.title,
        description: a.description,
        url: `${BASE_URL}/blog/${a.slug}`,
        datePublished: a.datePublished,
        dateModified: a.dateModified,
    })),
};

export default function BlogIndexPage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground antialiased">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
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
                        <span aria-current="page" className="text-primary">
                            Blog
                        </span>
                    </nav>
                    <h1 className="mb-5 max-w-2xl font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                        Blog <span className="text-primary">Bondi MDP</span>
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Comparativas y guías sobre transporte público en Mar del Plata.
                    </p>
                </div>
            </header>

            <main id="main-content">
                <section className="px-6 py-16">
                    <div className="mx-auto max-w-[880px] space-y-4">
                        {ARTICLES.map((article) => (
                            <ArticleCard key={article.slug} article={article} />
                        ))}
                    </div>
                </section>
            </main>

            <BlogFooter />
        </div>
    );
}
