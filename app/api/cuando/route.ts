import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchMgpDirect, isDirectEnabled } from "@/lib/api/mgpDirect";

const DEFAULT_PROXY_TOKEN = "bondimdp2024";

type MgpProxyEndpoint = { baseUrl: string; token: string };

/**
 * Lista fija: Termux (`MGP_PROXY_*`) y Oracle (`MGP_ORACLE_*`) si están definidos y son distintos.
 * El orden de intentos en cada request se baraja en `fetchFromProxies` para no cargar siempre el mismo.
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
const SESSION_COOKIE_REVALIDATE_S = 3600; // 1 hora

const CACHEABLE_ACCIONES = new Set<string>([
    "RecuperarLineaPorCuandoLlega",
    "RecuperarCallesPrincipalPorLinea",
    "RecuperarInterseccionPorLineaYCalle",
    "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
    "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea",
    "RecuperarParadasConBanderaYDestinoPorLinea",
    "RecuperarBanderasAsociadasAParada",
]);

/** Duerme por ms millisegundos */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Lee `cookies` del JSON de `/init` para enviarlas en `Cookie` en POST `/proxy` - con caché. */
async function mgpProxyInitCookies(initUrl: string): Promise<string | null> {
    // Cachea por 1 hora para evitar solicitudes excesivas
    const getCached = unstable_cache(
        async (url: string) => {
            console.log("🔄 Solicitando nueva sesión al proxy...", url);
            try {
                const res = await fetch(url, { cache: "force-cache" });
                const data = (await res.json()) as { cookies?: unknown };
                const c = data?.cookies;
                return typeof c === "string" && c.trim() ? c.trim() : null;
            } catch (e) {
                console.error("❌ Error llamando a /init:", e);
                return null;
            }
        },
        ["mgp-init-cookies"],
        { revalidate: SESSION_COOKIE_REVALIDATE_S, tags: ["mgp-cookies"] },
    );
    return getCached(initUrl);
}

async function fetchMgpJsonFromProxy(
    body: string,
    proxy: MgpProxyEndpoint,
    isLastInChain: boolean,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
    const proxyUrl = `${proxy.baseUrl}/proxy`;
    const initUrl = `${proxy.baseUrl}/init`;

    let sessionCookies = await mgpProxyInitCookies(initUrl);

    // Máximo 1 reintento para evitar "too many requests"
    for (let attempt = 0; attempt < 2; attempt++) {
        let response: Response;
        const headers: Record<string, string> = {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-proxy-token": proxy.token,
        };
        if (sessionCookies) {
            headers["Cookie"] = sessionCookies;
        }
        
        // Backoff exponencial entre intentos
        if (attempt > 0) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Esperando ${delayMs}ms antes de reintentar...`);
            await sleep(delayMs);
        }

        try {
            response = await fetch(proxyUrl, {
                method: "POST",
                headers,
                body,
                cache: "no-store",
            });

            // Si es rate limit, no reintentar inmediatamente
            if (response.status === 429) {
                console.warn(`⚠️ Rate limit del proxy (429), saltando...`);
                if (isLastInChain) return { ok: false };
                return { ok: false };
            }
        } catch (e) {
            if (attempt === 0) {
                console.log("🔄 Error de conexión, esperando e reintentando...");
                continue;
            }
            if (isLastInChain) throw e;
            return { ok: false };
        }

        const text = await response.text();
        let data: unknown;

        try {
            data = JSON.parse(text);
        } catch {
            if (attempt === 0) {
                console.log("🔄 JSON inválido, reintentando...");
                continue;
            }
            if (isLastInChain) {
                throw new Error("Respuesta no válida de MGP");
            }
            return { ok: false };
        }

        const dataObj = data as { error?: unknown } | null;
        const sessionBroke =
            response.status === 503 ||
            response.status === 403 ||
            Boolean(dataObj && typeof dataObj === "object" && dataObj.error);

        if (sessionBroke && attempt === 0) {
            console.log("🔄 Sesión rota, reintentando...");
            continue;
        }

        return { ok: true, data };
    }

    throw new Error("fetchMgpJsonFromProxy: unreachable");
}

async function fetchFromProxies(body: string): Promise<unknown> {
    const proxies = shuffleMgpProxies(mgpProxyEndpoints());
    if (!proxies.length) {
        throw new Error("No hay proxies configurados (MGP_PROXY_URL o MGP_ORACLE_URL).");
    }

    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i]!;
        const isLast = i === proxies.length - 1;
        const result = await fetchMgpJsonFromProxy(body, proxy, isLast);
        if (result.ok) return result.data;

        if (!isLast) {
            console.warn(`[cuando] proxy ${proxy.baseUrl} no respondió bien; siguiente…`);
        }
    }

    throw new Error("Todos los proxies fallaron.");
}

async function fetchMgpJson(body: string): Promise<unknown> {
    if (isDirectEnabled()) {
        try {
            return await fetchMgpDirect(body);
        } catch (e) {
            console.warn(
                "[cuando] direct auth falló, intentando con proxies:",
                e instanceof Error ? e.message : e,
            );
        }
    }
    return fetchFromProxies(body);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const params = new URLSearchParams(body);
        const accion = params.get("accion");

        const useReferenceCache = accion && CACHEABLE_ACCIONES.has(accion);

        if (useReferenceCache) {
            const getCached = unstable_cache(
                async (bodyPayload: string) => fetchMgpJson(bodyPayload),
                ["cuando-mgp"],
                { revalidate: REFERENCE_DATA_REVALIDATE_S, tags: [body] },
            );
            const data = await getCached(body);
            return NextResponse.json(data);
        }

        const data = await fetchMgpJson(body);
        return NextResponse.json(data);
    } catch (err) {
        const e = err as { message?: string };
        console.error("Proxy route error:", err);
        return NextResponse.json(
            { error: "Error de conexión", details: e.message ?? "unknown" },
            { status: 502 },
        );
    }
}
