/**
 * Decoder del &start payload de Telegram que el frontend genera en
 * lib/liveSharePayload.ts. Format v2: "{linea}__R__{ramalKey}". Legacy: solo
 * "{linea}".
 */

const SEP = "__R__" as const;

export function parseLiveSharePayload(
    raw: string,
): { linea: string; ramal: string | null } {
    const t = (raw ?? "").trim();
    if (!t) return { linea: "", ramal: null };
    const i = t.indexOf(SEP);
    if (i === -1) return { linea: t, ramal: null };
    return {
        linea: t.slice(0, i),
        ramal: t.slice(i + SEP.length) || null,
    };
}
