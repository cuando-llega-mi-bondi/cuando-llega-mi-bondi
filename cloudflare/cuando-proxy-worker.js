/**
 * Cloudflare Worker: same contract as app/api/cuando/route.ts
 * Deploy and attach a route (e.g. tu-dominio.com/api/cuando) or use wrangler.
 * Keep MGP_URL and headers aligned with the Next route when changing either.
 */
const MGP_URL =
    "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";
const DEFAULT_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function corsHeaders() {
    const h = new Headers();
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    h.set("Access-Control-Allow-Headers", "Content-Type");
    return h;
}

export default {
    /** @param {Request} request */
    async fetch(request) {
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
                    hint: "Este proxy solo acepta POST (igual que la app). Abrí la URL en el navegador siempre manda GET; probá con curl o desde la web.",
                }),
                { status: 405, headers },
            );
        }

        try {
            const body = await request.text();
            const userAgent =
                request.headers.get("user-agent") ?? DEFAULT_USER_AGENT;
            const acceptLanguage =
                request.headers.get("accept-language") ??
                "es-AR,es;q=0.9,en;q=0.8";

            const response = await fetch(MGP_URL, {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
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

            const outHeaders = corsHeaders();
            outHeaders.set(
                "Content-Type",
                "application/json; charset=utf-8",
            );

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("MGP response error:", response.status, errorBody);
                return new Response(
                    JSON.stringify({
                        error: `MGP error: ${response.status}`,
                    }),
                    { status: response.status, headers: outHeaders },
                );
            }

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: outHeaders,
            });
        } catch (err) {
            console.error("Proxy error:", err);
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
