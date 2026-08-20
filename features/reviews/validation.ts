export const COMMENT_MAX_LENGTH = 500;
export const DISPLAY_NAME_MAX_LENGTH = 40;

/**
 * Lista negra, no blanca: se permiten emojis y cualquier símbolo, solo se
 * bloquean caracteres de control (C0/C1) y los que se usan para spoofear
 * texto (marcas LRM/RLM, overrides/isolates bidi, BOM). Mismo criterio que
 * el CHECK de la base. Se arma con codepoints numéricos en vez de escribir
 * los caracteres invisibles a mano, para que no haya ambigüedad de cuál es
 * cada uno.
 */
const FORBIDDEN_RANGES: [number, number][] = [
    [0x00, 0x08],
    [0x0b, 0x0c],
    [0x0e, 0x1f],
    [0x7f, 0x9f],
    [0x200b, 0x200b], // zero width space
    [0x200e, 0x200f], // LRM / RLM
    [0x202a, 0x202e], // bidi embedding/override
    [0x2066, 0x2069], // bidi isolates
    [0xfeff, 0xfeff], // BOM / zero width no-break space
];

const FORBIDDEN_CHARS = new RegExp(
    `[${FORBIDDEN_RANGES.map(([from, to]) =>
        from === to
            ? String.fromCodePoint(from)
            : `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`,
    ).join("")}]`,
);

/** null = válido; si no, el mensaje de error para mostrar. */
export function validateComment(value: string): string | null {
    if (value.length > COMMENT_MAX_LENGTH) return `Máximo ${COMMENT_MAX_LENGTH} caracteres.`;
    if (FORBIDDEN_CHARS.test(value)) return "Ese texto tiene caracteres no permitidos.";
    return null;
}

export function validateDisplayName(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Ingresá un nombre.";
    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) return `Máximo ${DISPLAY_NAME_MAX_LENGTH} caracteres.`;
    if (FORBIDDEN_CHARS.test(trimmed)) return "Ese texto tiene caracteres no permitidos.";
    return null;
}
