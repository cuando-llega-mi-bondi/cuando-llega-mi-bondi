/**
 * Cloudflare Worker: same contract as app/api/cuando/route.ts
 * Deploy and attach a route (e.g. tu-dominio.com/api/cuando) or use wrangler.
 * Keep MGP_URL and headers aligned with the Next route when changing either.
 *
 * Improvements over the Next route:
 *   - Caches reference actions in Cloudflare Cache API (5 min TTL).
 *   - Lightweight per-IP rate limiting against scraping.
 */
const MGP_URL =
    "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";
const DEFAULT_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Same default as `app/api/cuando/route.ts` for cacheable actions. */
const DEFAULT_ACCEPT_LANGUAGE = "es-AR,es;q=0.9,en;q=0.8";

const REFERENCE_TTL_S = 300;

const CACHEABLE_ACCIONES = new Set([
    "RecuperarLineaPorCuandoLlega",
    "RecuperarCallesPrincipalPorLinea",
    "RecuperarInterseccionPorLineaYCalle",
    "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
    "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea",
    "RecuperarParadasConBanderaYDestinoPorLinea",
]);

const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_S = 60;
const rateLimitBuckets = new Map();

function corsHeaders() {
    const h = new Headers();
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    h.set("Access-Control-Allow-Headers", "Content-Type");
    return h;
}

function getAccionFromBody(body) {
    return new URLSearchParams(body).get("accion");
}

function clientIp(request) {
    return (
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For") ||
        "unknown"
    );
}

function rateLimited(ip) {
    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW_S * 1000;
    const bucket = rateLimitBuckets.get(ip);

    if (!bucket || now - bucket.start > windowMs) {
        rateLimitBuckets.set(ip, { count: 1, start: now });
        return false;
    }

    bucket.count += 1;
    return bucket.count > RATE_LIMIT_MAX;
}

async function buildCacheKey(request, body) {
    const url = new URL(request.url);
    url.search = "";
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(body),
    );
    const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    url.pathname = `${url.pathname.replace(/\/$/, "")}/__cache/${hash}`;
    return new Request(url.toString(), { method: "GET" });
}

function bodyPreview(text, maxLen = 240) {
    const s = text.replace(/\s+/g, " ").trim();
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

/** HTML from mardelplata.gob.ar's Cloudflare WAF / challenge blocking our subrequest. */
function isLikelyOriginCloudflareBlock(html) {
    const t = html.slice(0, 12000);
    return (
        t.includes("cf-error-details") ||
        t.includes("Sorry, you have been blocked") ||
        (t.includes("Attention Required!") && t.includes("Cloudflare")) ||
        t.includes("cdn-cgi/challenge-platform") ||
        t.includes("window._cf_chl_opt") ||
        t.includes("Verificación de seguridad") ||
        (t.includes("Cloudflare") && t.includes("bots maliciosos"))
    );
}

async function fetchMgpJson(body, userAgent, acceptLanguage) {
    const response = await fetch(MGP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            Referer:
                "https://appsl.mardelplata.gob.ar/app_cuando_llega/cuando.php",
            Origin: "https://appsl.mardelplata.gob.ar",
            "Accept-Language": acceptLanguage,
            "User-Agent": userAgent,
        },
        body,
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (!response.ok) {
        const originCfBlock = isLikelyOriginCloudflareBlock(text);
        console.error(
            JSON.stringify({
                event: originCfBlock
                    ? "mgp_origin_cf_block"
                    : "mgp_http_error",
                status: response.status,
                contentType,
                bodyPreview: bodyPreview(text),
                ...(originCfBlock
                    ? {
                          hint: "El sitio MGP usa Cloudflare y suele bloquear el egress de Workers; usá el proxy en Vercel (/api/cuando).",
                      }
                    : {}),
            }),
        );
        return {
            ok: false,
            status: response.status,
            errorText: text,
            originCfBlock,
        };
    }

    try {
        const data = JSON.parse(text);
        return { ok: true, data };
    } catch (parseErr) {
        const originCfBlock = isLikelyOriginCloudflareBlock(text);
        console.error(
            JSON.stringify({
                event: originCfBlock
                    ? "mgp_origin_cf_block"
                    : "mgp_invalid_json",
                status: response.status,
                contentType,
                bodyPreview: bodyPreview(text),
                parseError: String(parseErr),
                ...(originCfBlock
                    ? {
                          hint: "El sitio MGP usa Cloudflare y suele bloquear el egress de Workers; usá el proxy en Vercel (/api/cuando).",
                      }
                    : {}),
            }),
        );
        return {
            ok: false,
            status: 502,
            errorText: "non-json response from MGP",
            originCfBlock,
        };
    }
}

export default {
    /** @param {Request} request */
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(),
            });
        }

        if (request.method !== "POST") {
            const headers = corsHeaders();
            headers.set("Content-Type", "application/json; charset=utf-8");
            headers.set("Allow", "POST, OPTIONS");
            if (request.method === "HEAD") {
                return new Response(null, { status: 405, headers });
            }
            return new Response(
                JSON.stringify({
                    error: "Method Not Allowed",
                    hint: "Este proxy solo acepta POST (igual que la app).",
                }),
                { status: 405, headers },
            );
        }

        const ip = clientIp(request);
        if (rateLimited(ip)) {
            const headers = corsHeaders();
            headers.set("Content-Type", "application/json; charset=utf-8");
            headers.set("Retry-After", String(RATE_LIMIT_WINDOW_S));
            return new Response(
                JSON.stringify({ error: "Demasiadas solicitudes. Probá en un momento." }),
                { status: 429, headers },
            );
        }

        try {
            const body = await request.text();
            const accion = getAccionFromBody(body);
            const cacheable = accion && CACHEABLE_ACCIONES.has(accion);
            /** Match Next `unstable_cache` path: fixed UA for reference data. */
            const mgpUserAgent = cacheable
                ? DEFAULT_USER_AGENT
                : (request.headers.get("user-agent") ?? DEFAULT_USER_AGENT);
            const mgpAcceptLanguage = cacheable
                ? DEFAULT_ACCEPT_LANGUAGE
                : (request.headers.get("accept-language") ??
                  DEFAULT_ACCEPT_LANGUAGE);

            const cache = caches.default;
            const cacheKey = cacheable ? await buildCacheKey(request, body) : null;

            if (cacheKey) {
                const hit = await cache.match(cacheKey);
                if (hit) {
                    const headers = new Headers(hit.headers);
                    Object.entries(Object.fromEntries(corsHeaders())).forEach(
                        ([k, v]) => headers.set(k, v),
                    );
                    headers.set("X-Cache", "HIT");
                    return new Response(hit.body, {
                        status: hit.status,
                        headers,
                    });
                }
            }

            const result = await fetchMgpJson(
                body,
                mgpUserAgent,
                mgpAcceptLanguage,
            );

            const outHeaders = corsHeaders();
            outHeaders.set("Content-Type", "application/json; charset=utf-8");

            if (!result.ok) {
                const body =
                    result.originCfBlock === true
                        ? {
                              error: `MGP error: ${result.status}`,
                              hint: "El servidor municipal (Cloudflare del origen) rechaza solicitudes desde este Worker. Quitá NEXT_PUBLIC_CUANDO_API_URL en Vercel para usar /api/cuando.",
                          }
                        : { error: `MGP error: ${result.status}` };
                return new Response(JSON.stringify(body), {
                    status: result.status,
                    headers: outHeaders,
                });
            }

            const payload = JSON.stringify(result.data);

            if (cacheKey) {
                const cachedHeaders = new Headers(outHeaders);
                cachedHeaders.set(
                    "Cache-Control",
                    `public, max-age=${REFERENCE_TTL_S}, s-maxage=${REFERENCE_TTL_S}`,
                );
                const toStore = new Response(payload, {
                    status: 200,
                    headers: cachedHeaders,
                });
                ctx.waitUntil(cache.put(cacheKey, toStore.clone()));
                outHeaders.set("X-Cache", "MISS");
            }

            return new Response(payload, { status: 200, headers: outHeaders });
        } catch (err) {
            console.error(
                JSON.stringify({
                    event: "proxy_unhandled",
                    message: String(err?.message ?? err),
                    name: err?.name,
                }),
            );
            const outHeaders = corsHeaders();
            outHeaders.set("Content-Type", "application/json; charset=utf-8");
            return new Response(
                JSON.stringify({
                    error: "Error al conectar con el servidor de MGP",
                }),
                { status: 502, headers: outHeaders },
            );
        }
    },
};
