/**
 * Utilidades para mapear entre la Descripcion de una línea (e.g. "591", "BATAN")
 * y su slug URL-friendly (e.g. "591", "batan").
 *
 * Usado en `/recorrido/[linea]` para generar URLs SEO-friendly con el número
 * de línea que la gente googlea, no el código interno.
 */

/**
 * Convierte la Descripcion de una línea al slug para la URL.
 * "591" → "591", "BATAN" → "batan", "221 COSTA AZUL" → "221-costa-azul", "593C" → "593c"
 */
export function lineaToSlug(descripcion: string): string {
    return descripcion.toLowerCase().trim().replace(/\s+/g, "-");
}

/**
 * Convierte un slug URL de vuelta a la Descripcion original (mayúsculas).
 * "591" → "591", "batan" → "BATAN", "221-costa-azul" → "221 COSTA AZUL"
 */
export function slugToDescripcion(slug: string): string {
    return slug.toUpperCase().replace(/-/g, " ");
}
