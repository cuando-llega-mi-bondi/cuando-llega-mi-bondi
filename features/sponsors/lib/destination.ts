import { parseAdHref } from "./href";

export type AdPlatform = "instagram" | "x" | "youtube" | "web";

const HOSTS: Record<Exclude<AdPlatform, "web">, string[]> = {
  instagram: ["instagram.com"],
  x: ["x.com", "twitter.com"],
  youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
};

function hostnameOf(href: string): string | null {
  try {
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function detectAdPlatform(href: string): AdPlatform {
  const host = hostnameOf(href);
  if (!host) return "web";
  if (HOSTS.instagram.some((h) => host === h || host.endsWith(`.${h}`))) return "instagram";
  if (HOSTS.x.some((h) => host === h || host.endsWith(`.${h}`))) return "x";
  if (HOSTS.youtube.some((h) => host === h || host.endsWith(`.${h}`))) return "youtube";
  return "web";
}

/** Favicon via Google Cache — CDN, sin scrapear nosotros. */
export function googleFaviconUrl(href: string): string | null {
  const host = hostnameOf(href);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

function stripHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/^\/+/, "");
}

export function composeAdHref(platform: AdPlatform, input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("El link es inválido");

  if (platform === "web") {
    return parseAdHref(trimmed);
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes(".")) {
    try {
      const full = parseAdHref(trimmed);
      if (detectAdPlatform(full) === platform || detectAdPlatform(full) === "web") {
        return full;
      }
    } catch {
      /* fall through to handle */
    }
  }

  const handle = stripHandle(trimmed).split("/")[0] ?? "";
  if (!handle) throw new Error("El link es inválido");

  if (platform === "instagram") return parseAdHref(`https://instagram.com/${handle}`);
  if (platform === "x") return parseAdHref(`https://x.com/${handle}`);
  return parseAdHref(`https://youtube.com/@${handle}`);
}

export function tryComposeAdHref(platform: AdPlatform, input: string): string | null {
  try {
    return composeAdHref(platform, input);
  } catch {
    return null;
  }
}
