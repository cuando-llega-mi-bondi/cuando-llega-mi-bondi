import { getMarkdownPage, NOT_FOUND_MARKDOWN } from "@shared/seo/markdownPages";

// Solo lo alcanza `proxy.ts` vía rewrite (o un fetch directo, que es
// inofensivo: siempre devuelve Markdown sin importar el Accept del
// caller). Content-Type y Vary quedan seteados acá para que la respuesta
// sea correcta incluso si algo pega directo a /md/<slug>.
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    const { slug } = await params;
    const body = getMarkdownPage(slug);

    if (!body) {
        return new Response(NOT_FOUND_MARKDOWN, {
            status: 404,
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                Vary: "Accept",
            },
        });
    }

    return new Response(body, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
