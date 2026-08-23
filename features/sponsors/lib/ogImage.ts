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
    .replace(/&gt;/g, ">");
}

function extractMetaImage(html: string): string | null {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  for (const prop of ["og:image:secure_url", "og:image", "twitter:image"]) {
    const propRe = new RegExp(`(?:property|name)=["']${prop}["']`, "i");
    const tag = tags.find((t) => propRe.test(t));
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return decodeHtmlEntities(content);
  }
  return null;
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

export async function resolveOgImage(href: string): Promise<string | null> {
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

  const image = extractMetaImage(html);
  if (!image) return null;

  try {
    const absolute = new URL(image, res.url || url);
    return absolute.protocol === "http:" || absolute.protocol === "https:"
      ? absolute.toString()
      : null;
  } catch {
    return null;
  }
}
