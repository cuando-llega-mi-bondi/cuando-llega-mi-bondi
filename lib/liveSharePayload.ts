/**
 * Encodes / decodes Telegram deep-link &start= payload (plain text in /start message after "/start ").
 * Telegram limit: 64 bytes for the start parameter. Only use unreserved + digits (no | or spaces) so
 * t.me deep links are valid. Format v2: "{linea}__R__{ramalKey}". Legacy: "{linea}" = line only, ramal null.
 */

const SEP = "__R__" as const;
const MAX_LEN = 64;

export function encodeLiveSharePayload(linea: string, ramalKey: string): string {
  const a = (linea || "").trim();
  const b = (ramalKey || "").trim();
  if (!a) throw new Error("encodeLiveSharePayload: linea requerida");
  if (!b) return a;
  if (a.includes(SEP) || b.includes(SEP)) {
    throw new Error("encodeLiveSharePayload: linea o ramal contiene el delimitador reservado");
  }
  const out = `${a}${SEP}${b}`;
  if (out.length > MAX_LEN) {
    throw new Error(
      `encodeLiveSharePayload: payload de ${out.length} caracteres supera el límite de ${MAX_LEN} (Telegram)`
    );
  }
  return out;
}

export function parseLiveSharePayload(startPayload: string): { linea: string; ramal: string | null } {
  const t = (startPayload || "").trim();
  if (!t) return { linea: "", ramal: null };
  const i = t.indexOf(SEP);
  if (i === -1) {
    return { linea: t, ramal: null };
  }
  const linea = t.slice(0, i);
  const ramal = t.slice(i + SEP.length);
  if (linea && ramal) return { linea, ramal };
  return { linea: t, ramal: null };
}
