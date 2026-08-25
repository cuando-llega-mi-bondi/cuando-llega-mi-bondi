import { lookup } from "node:dns/promises";

const FETCH_TIMEOUT_MS = 4_000;
const MAX_HEAD_BYTES = 300_000;
const MAX_REDIRECTS = 3;

function isPrivateIp(address: string, family: number): boolean {
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

// ponytail: DNS se resuelve acá y el fetch resuelve de nuevo por su cuenta —
// hay un gap de TOCTOU (DNS rebinding). Subir a un dispatcher custom con
// lookup fijado si este endpoint se vuelve un blanco valioso.
async function isSafeHost(hostname: string): Promise<boolean> {
  if (hostname === "localhost") return false;
  try {
    const results = await lookup(hostname, { all: true });
    return results.length > 0 && results.every((r) => !isPrivateIp(r.address, r.family));
  } catch {
    return false;
  }
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Referencias numéricas: &#064; (decimal) y &#x2022; (hex) — Instagram
    // codifica así el "@" y el "•" en sus og:title.
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function extractMetaContent(tags: string[], properties: string[]): string | null {
  for (const prop of properties) {
    const propRe = new RegExp(`(?:property|name)=["']${prop}["']`, "i");
    const tag = tags.find((t) => propRe.test(t));
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return decodeHtmlEntities(content).trim() || null;
  }
  return null;
}

function extractMetaTitle(html: string, tags: string[]): string | null {
  const fromMeta = extractMetaContent(tags, ["og:title", "twitter:title"]);
  if (fromMeta) return fromMeta;
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const decoded = titleTag ? decodeHtmlEntities(titleTag).trim() : "";
  return decoded || null;
}

async function fetchFollowingRedirects(startUrl: URL): Promise<Response | null> {
  let current = startUrl;
  for (let hop = 0; hop < MAX_REDIRECTS + 1; hop++) {
    if (!(await isSafeHost(current.hostname))) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          Accept: "text/html",
          "User-Agent": "Mozilla/5.0 (compatible; BondiMDP-OgImageBot/1.0)",
        },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      try {
        current = new URL(location, current);
      } catch {
        return null;
      }
      if (current.protocol !== "http:" && current.protocol !== "https:") return null;
      continue;
    }
    return res;
  }
  return null;
}

export interface OgMeta {
  image: string | null;
  title: string | null;
  description: string | null;
}

const EMPTY_META: OgMeta = { image: null, title: null, description: null };

/** Trae el `<head>` de la página (hasta MAX_HEAD_BYTES) siguiendo redirects, o null si no se puede. */
async function fetchHead(href: string): Promise<{ html: string; base: URL } | null> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const res = await fetchFollowingRedirects(url);
  if (!res || !res.ok || !res.body) return null;
  if (!(res.headers.get("content-type") ?? "").includes("text/html")) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let received = 0;
  try {
    while (received < MAX_HEAD_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  return { html, base: new URL(res.url || url) };
}

/** Imagen, título y descripción en un solo fetch — se usan para la preview y para sugerir título/texto. */
export async function resolveOgMeta(href: string): Promise<OgMeta> {
  const head = await fetchHead(href);
  if (!head) return EMPTY_META;
  const { html, base } = head;

  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  const rawImage = extractMetaContent(tags, ["og:image:secure_url", "og:image", "twitter:image"]);
  const description = extractMetaContent(tags, ["og:description", "twitter:description", "description"]);
  const title = extractMetaTitle(html, tags);

  let image: string | null = null;
  if (rawImage) {
    try {
      const absolute = new URL(rawImage, base);
      image = absolute.protocol === "http:" || absolute.protocol === "https:" ? absolute.toString() : null;
    } catch {
      image = null;
    }
  }

  return { image, title, description };
}

export async function resolveOgImage(href: string): Promise<string | null> {
  return (await resolveOgMeta(href)).image;
}
