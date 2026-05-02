import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const MGP_URL =
  process.env.MGP_PROXY_URL ?? "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";

/** TTL for route geometry and lookup lists (not live arrivals). */
const REFERENCE_DATA_REVALIDATE_S = 300;

const CACHEABLE_ACCIONES = new Set<string>([
  "RecuperarLineaPorCuandoLlega",
  "RecuperarCallesPrincipalPorLinea",
  "RecuperarInterseccionPorLineaYCalle",
  "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
  "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea",
  "RecuperarParadasConBanderaYDestinoPorLinea",
]);

export const preferredRegion = ["gru1"];

interface BrowserProfile {
  ua: string;
  secChUa: string;
  secChUaPlatform: string;
}

const BROWSER_PROFILES: BrowserProfile[] = [
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaPlatform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    secChUaPlatform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaPlatform: '"macOS"',
  },
  {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaPlatform: '"Linux"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    secChUa: '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaPlatform: '"Windows"',
  },
];

function pickProfile(): BrowserProfile {
  return BROWSER_PROFILES[Math.floor(Math.random() * BROWSER_PROFILES.length)];
}

function buildBrowserHeaders(profile: BrowserProfile): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": profile.ua,
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Origin: "https://appsl.mardelplata.gob.ar",
    Referer: "https://appsl.mardelplata.gob.ar/app_cuando_llega/cuando.php",
    Connection: "keep-alive",
    "sec-ch-ua": profile.secChUa,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": profile.secChUaPlatform,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };

  if (process.env.MGP_PROXY_TOKEN) {
    headers["x-proxy-token"] = process.env.MGP_PROXY_TOKEN;
  }

  return headers;
}

function getAccionFromBody(body: string): string | null {
  return new URLSearchParams(body).get("accion");
}

function isCloudflareBlock(html: string): boolean {
  const t = html.slice(0, 8000);
  return (
    t.includes("cf-error-details") ||
    t.includes("Sorry, you have been blocked") ||
    (t.includes("Attention Required!") && t.includes("Cloudflare"))
  );
}

class MgpHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly originCfBlock?: boolean,
  ) {
    super(`MGP error: ${status}`);
    this.name = "MgpHttpError";
  }
}

type MgpResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; errorText: string; originCfBlock?: boolean };

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 600;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMgpOnce(body: string, profile: BrowserProfile): Promise<MgpResult> {
  const headers = buildBrowserHeaders(profile);

  const response = await fetch(MGP_URL, {
    method: "POST",
    headers,
    body,
  });

  const text = await response.text();

  if (!response.ok) {
    const blocked = isCloudflareBlock(text);
    console.error(JSON.stringify({
      event: blocked ? "mgp_cf_block" : "mgp_http_error",
      status: response.status,
      ua: profile.ua.slice(0, 60),
      bodyPreview: text.replace(/\s+/g, " ").trim().slice(0, 240),
    }));
    return { ok: false, status: response.status, errorText: text, originCfBlock: blocked };
  }

  try {
    const data = JSON.parse(text) as unknown;
    return { ok: true, data };
  } catch {
    const blocked = isCloudflareBlock(text);
    console.error(JSON.stringify({
      event: blocked ? "mgp_cf_block" : "mgp_invalid_json",
      status: response.status,
      bodyPreview: text.replace(/\s+/g, " ").trim().slice(0, 240),
    }));
    return { ok: false, status: 502, errorText: "non-json response from MGP", originCfBlock: blocked };
  }
}

async function fetchMgpJson(body: string): Promise<MgpResult> {
  let lastResult: MgpResult | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const profile = pickProfile();
    const result = await fetchMgpOnce(body, profile);

    if (result.ok) return result;

    lastResult = result;

    if (result.originCfBlock && attempt < MAX_RETRIES) {
      console.warn(JSON.stringify({
        event: "mgp_retry",
        attempt: attempt + 1,
        delayMs: RETRY_DELAY_MS * (attempt + 1),
      }));
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    break;
  }

  return lastResult!;
}

function mgpErrorPayload(status: number, originCfBlock?: boolean) {
  const base = { error: `MGP error: ${status}` };
  if (originCfBlock) {
    return {
      ...base,
      hint: "El servidor municipal devolvió una página de bloqueo (Cloudflare). Probá más tarde o desde otra red.",
    };
  }
  return base;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const accion = getAccionFromBody(body);
    const useReferenceCache = accion && CACHEABLE_ACCIONES.has(accion);

    if (useReferenceCache) {
      const getCached = unstable_cache(
        async () => {
          const result = await fetchMgpJson(body);
          if (!result.ok) throw new MgpHttpError(result.status, result.originCfBlock);
          return result.data;
        },
        ["cuando-mgp", body],
        { revalidate: REFERENCE_DATA_REVALIDATE_S },
      );

      try {
        const data = await getCached();
        return NextResponse.json(data);
      } catch (e) {
        if (e instanceof MgpHttpError) {
          return NextResponse.json(mgpErrorPayload(e.status, e.originCfBlock), { status: e.status });
        }
        throw e;
      }
    }

    const result = await fetchMgpJson(body);
    if (!result.ok) {
      return NextResponse.json(mgpErrorPayload(result.status, result.originCfBlock), { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Error al conectar con el servidor de MGP" }, { status: 502 });
  }
}