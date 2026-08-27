import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { acceptsNeitherMarkdownNorHtml, prefersMarkdown } from "@shared/seo/acceptNegotiation";
import { MARKDOWN_ROUTES, NOT_FOUND_MARKDOWN } from "@shared/seo/markdownPages";

/**
 * Rutas reales de la app (fuente: carpetas bajo app/**\/page.tsx). Se usa
 * solo para decidir si un path desconocido amerita el 404 con cuerpo
 * Markdown navegable (agentes que ya prefieren Markdown vía Accept); el
 * resto de las rutas conocidas sigue de largo sin tocar nada.
 */
const KNOWN_PATH_PATTERNS: RegExp[] = [
    /^\/$/,
    /^\/consultar$/,
    /^\/favoritos$/,
    /^\/acerca$/,
    /^\/anunciantes$/,
    /^\/anunciate(\/boost|\/error|\/exito)?$/,
    /^\/como-llego$/,
    /^\/paradas-cerca$/,
    /^\/perfil$/,
    /^\/privacidad$/,
    /^\/recorrido(\/[^/]+)?$/,
    /^\/terminos$/,
    /^\/un-mes-en-numeros$/,
    /^\/blog(\/[^/]+)?$/,
    /^\/contacto$/,
    /^\/opengraph-image$/,
];

export function proxy(request: NextRequest) {
    if (request.method !== "GET" && request.method !== "HEAD") {
        return NextResponse.next();
    }

    const accept = request.headers.get("accept");
    const { pathname } = request.nextUrl;
    const markdownSlug = MARKDOWN_ROUTES[pathname];

    // Ruta con contraparte Markdown: negociar por Accept (acceptmarkdown.com).
    if (markdownSlug) {
        if (acceptsNeitherMarkdownNorHtml(accept)) {
            return new NextResponse(
                "406 Not Acceptable: this route serves text/html or text/markdown only.",
                { status: 406, headers: { Vary: "Accept" } },
            );
        }
        if (prefersMarkdown(accept)) {
            const url = request.nextUrl.clone();
            url.pathname = `/md/${markdownSlug}`;
            const response = NextResponse.rewrite(url);
            response.headers.set("Vary", "Accept");
            return response;
        }
        return NextResponse.next();
    }

    // Path sin página real + agente que prefiere Markdown -> 404 navegable,
    // en vez del app shell HTML de siempre.
    if (prefersMarkdown(accept) && !KNOWN_PATH_PATTERNS.some((p) => p.test(pathname))) {
        return new NextResponse(NOT_FOUND_MARKDOWN, {
            status: 404,
            headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|md|_next/static|_next/image|.*\\..*).*)"],
};
