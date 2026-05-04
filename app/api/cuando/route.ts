import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const DEFAULT_PROXY_TOKEN = "bondimdp2024";

type MgpProxyEndpoint = { baseUrl: string; token: string };

/**
 * Lista fija: Termux (`MGP_PROXY_*`) y Oracle (`MGP_ORACLE_*`) si están definidos y son distintos.
 * El orden de intentos en cada request se baraja en `fetchMgpJson` para no cargar siempre el mismo.
 */
function mgpProxyEndpoints(): MgpProxyEndpoint[] {
    const seen = new Set<string>();
    const out: MgpProxyEndpoint[] = [];
    const push = (rawUrl: string | undefined, rawToken: string | undefined) => {
        const baseUrl = rawUrl?.trim().replace(/\/$/, "");
        if (!baseUrl || seen.has(baseUrl)) return;
        seen.add(baseUrl);
        const token = (rawToken?.trim() || DEFAULT_PROXY_TOKEN).trim();
        out.push({ baseUrl, token });
    };
    push(process.env.MGP_PROXY_URL, process.env.MGP_PROXY_TOKEN);
    push(process.env.MGP_ORACLE_URL, process.env.MGP_ORACLE_TOKEN);
    return out;
}

function shuffleMgpProxies(proxies: MgpProxyEndpoint[]): MgpProxyEndpoint[] {
    if (proxies.length <= 1) return proxies;
    const copy = [...proxies];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = t;
    }
    return copy;
}

const REFERENCE_DATA_REVALIDATE_S = 300;

const CACHEABLE_ACCIONES = new Set<string>([
  "RecuperarLineaPorCuandoLlega",
  "RecuperarCallesPrincipalPorLinea",
  "RecuperarInterseccionPorLineaYCalle",
  "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
  "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea",
  "RecuperarParadasConBanderaYDestinoPorLinea",
  "RecuperarBanderasAsociadasAParada",
]);

async function forceProxyInit(initUrl: string) {
    console.log("🔄 Solicitando nueva sesión al proxy...", initUrl);
    try {
        const res = await fetch(initUrl, { cache: "no-store" });
        return await res.json();
    } catch (e) {
        console.error("❌ Error llamando a /init:", e);
        return null;
    }
}

/**
 * Hasta 2 intentos por proxy (normal + post-`/init`).
 * Devuelve `{ok: false}` cuando la sesión se rompe en todos los reintentos —
 * antes este caso devolvía `{ok: true, data: <json-de-error>}`, lo que hacía
 * que el route handler respondiera 200 OK con `{error: ...}` en el body. El SW
 * cacheaba ese error y se quedaba pegado hasta que el usuario limpiara cache
 * (issue #3).
 */
async function fetchMgpJsonFromProxy(
    body: string,
    proxy: MgpProxyEndpoint,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
    const proxyUrl = `${proxy.baseUrl}/proxy`;
    const initUrl = `${proxy.baseUrl}/init`;

    for (let attempt = 0; attempt < 2; attempt++) {
        let response: Response;
        try {
            response = await fetch(proxyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "x-proxy-token": proxy.token,
                },
                body,
                cache: "no-store",
            });
        } catch {
            if (attempt === 0) {
                await forceProxyInit(initUrl);
                continue;
            }
            return { ok: false };
        }

        const text = await response.text();
        let data: unknown;

        try {
            data = JSON.parse(text);
        } catch {
            if (attempt === 0) {
                await forceProxyInit(initUrl);
                continue;
            }
            return { ok: false };
        }

        const dataObj = data as { error?: unknown } | null;
        const sessionBroke =
            response.status === 503 ||
            response.status === 403 ||
            Boolean(dataObj && typeof dataObj === "object" && dataObj.error);

        if (sessionBroke) {
            if (attempt === 0) {
                await forceProxyInit(initUrl);
                continue;
            }
            return { ok: false };
        }

        return { ok: true, data };
    }

    return { ok: false };
}

async function fetchMgpJson(body: string): Promise<any> {
    const proxies = shuffleMgpProxies(mgpProxyEndpoints());
    if (!proxies.length) {
        throw new Error(
            "Falta al menos una URL de proxy: MGP_PROXY_URL o MGP_ORACLE_URL.",
        );
    }

    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i]!;
        const result = await fetchMgpJsonFromProxy(body, proxy);
        if (result.ok) return result.data;

        const isLast = i === proxies.length - 1;
        if (!isLast) {
            console.warn(
                `[cuando] Proxy ${proxy.baseUrl} no respondió bien; probando siguiente…`,
            );
        }
    }

    throw new Error("Todos los proxies fallaron.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const accion = params.get("accion");
    
    const useReferenceCache = accion && CACHEABLE_ACCIONES.has(accion);

    if (useReferenceCache) {
      // Nota: unstable_cache requiere que la función devuelva la data directamente
      const getCached = unstable_cache(
        async (bodyPayload: string) => fetchMgpJson(bodyPayload),
        ["cuando-mgp"],
        { revalidate: REFERENCE_DATA_REVALIDATE_S, tags: [body] }
      );

      const data = await getCached(body);
      return NextResponse.json(data);
    }

    // Para arribos en tiempo real (221, 511, 581), no usamos cache
    const data = await fetchMgpJson(body);
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Proxy route error:", err);
    return NextResponse.json(
      { error: "Error de conexión", details: err.message },
      { status: 502 }
    );
  }
}