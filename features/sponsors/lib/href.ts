const MAX_HREF_LENGTH = 2048;

export function parseAdHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length < 4 || trimmed.length > MAX_HREF_LENGTH) {
    throw new Error("El link es inválido");
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("El link es inválido");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("El link tiene que ser http o https");
  }
  if (parsed.username || parsed.password) {
    throw new Error("El link es inválido");
  }
  if (!parsed.hostname.includes(".")) {
    throw new Error("El link es inválido");
  }

  return parsed.toString();
}
