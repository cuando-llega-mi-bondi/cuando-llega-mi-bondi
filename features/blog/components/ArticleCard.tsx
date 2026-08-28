import Link from "next/link";
import { formatFechaEs } from "@shared/utils";
import type { BlogArticle } from "@features/blog/types";

export function ArticleCard({
    article,
    href,
}: {
    article: Pick<BlogArticle, "slug" | "title" | "description" | "datePublished" | "section">;
    href?: string;
}) {
    return (
        <Link
            href={href ?? `/blog/${article.slug}`}
            className="block rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
            <div className="mb-3 flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="rounded-full border border-primary/25 bg-primary/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {article.section}
                </span>
                <span className="opacity-20" aria-hidden="true">
                    ·
                </span>
                <time dateTime={article.datePublished}>{formatFechaEs(article.datePublished)}</time>
            </div>
            <h2 className="mb-2 font-display text-xl font-bold leading-tight text-foreground">
                {article.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{article.description}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-primary">Leer más →</span>
        </Link>
    );
}
