/**
 * Negociación de contenido Accept: text/markdown (spec de acceptmarkdown.com,
 * basada en RFC 9110 §12.5.1). Puro y testeable a propósito: `proxy.ts` no
 * corre bajo vitest, así que la lógica vive acá y el proxy es un wrapper fino.
 */

interface MediaRange {
    type: string;
    subtype: string;
    q: number;
    order: number;
}

const MARKDOWN = { type: "text", subtype: "markdown" } as const;
const HTML = { type: "text", subtype: "html" } as const;

function parseAccept(header: string): MediaRange[] {
    return header
        .split(",")
        .map((part, order): MediaRange | null => {
            const [rawType, ...params] = part.trim().split(";").map((s) => s.trim());
            const [type, subtype] = (rawType ?? "").split("/");
            if (!type || !subtype) return null;
            let q = 1;
            for (const param of params) {
                const [key, value] = param.split("=");
                if (key === "q") {
                    const parsed = Number.parseFloat(value ?? "");
                    q = Number.isFinite(parsed) ? parsed : 1;
                }
            }
            return { type, subtype, q, order };
        })
        .filter((r): r is MediaRange => r !== null);
}

// RFC 9110 §12.5.1: match exacto > tipo con subtipo comodín > comodín total, sin match = -1.
function specificity(range: MediaRange, target: { type: string; subtype: string }): number {
    if (range.type === target.type && range.subtype === target.subtype) return 2;
    if (range.type === target.type && range.subtype === "*") return 1;
    if (range.type === "*" && range.subtype === "*") return 0;
    return -1;
}

function bestMatch(ranges: MediaRange[], target: { type: string; subtype: string }) {
    let best: { q: number; specificity: number } | null = null;
    for (const range of ranges) {
        const spec = specificity(range, target);
        if (spec < 0) continue;
        if (!best || spec > best.specificity || (spec === best.specificity && range.q > best.q)) {
            best = { q: range.q, specificity: spec };
        }
    }
    return best;
}

// true si el cliente prefiere `text/markdown` sobre `text/html` para este
// request. Empate exacto en q y especificidad (típico de un Accept genérico
// tipo "image/(cualquiera),(todo);q=0.8" donde ninguno de los dos se pidió
// explícitamente) -> gana html, el default seguro. Markdown solo gana con
// ventaja real: mayor especificidad, mayor q, o html explícitamente
// rechazado (q=0/ausente).
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
    if (!acceptHeader) return false;
    const ranges = parseAccept(acceptHeader);
    const markdown = bestMatch(ranges, MARKDOWN);
    if (!markdown || markdown.q <= 0) return false;
    const html = bestMatch(ranges, HTML);
    if (!html || html.q <= 0) return true;
    if (markdown.specificity !== html.specificity) return markdown.specificity > html.specificity;
    return markdown.q > html.q;
}

/**
 * true si el Accept header no deja ningún tipo usable para negociar esta
 * respuesta (ni markdown ni html ni comodín) -> ameríta un 406.
 */
export function acceptsNeitherMarkdownNorHtml(acceptHeader: string | null | undefined): boolean {
    if (!acceptHeader) return false;
    const ranges = parseAccept(acceptHeader);
    const markdown = bestMatch(ranges, MARKDOWN);
    const html = bestMatch(ranges, HTML);
    const markdownOk = !!markdown && markdown.q > 0;
    const htmlOk = !!html && html.q > 0;
    return !markdownOk && !htmlOk;
}
