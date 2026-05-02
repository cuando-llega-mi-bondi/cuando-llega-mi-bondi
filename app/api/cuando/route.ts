import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const MGP_URL = "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_ACCEPT_LANGUAGE = "es-AR,es;q=0.9,en;q=0.8";

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

export const preferredRegion = ["gru1", "sfo1"];

function getAccionFromBody(body: string): string | null {
  return new URLSearchParams(body).get("accion");
}

type MgpResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; errorText: string };

async function fetchMgpJson(
  body: string,
  userAgent: string,
  acceptLanguage: string,
): Promise<MgpResult> {
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

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("MGP response error:", response.status, errorBody);
    return { ok: false, status: response.status, errorText: errorBody };
  }

  const data = await response.json();
  return { ok: true, data };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const accion = getAccionFromBody(body);
    const userAgent = req.headers.get("user-agent") ?? DEFAULT_USER_AGENT;
    const acceptLanguage =
      req.headers.get("accept-language") ?? DEFAULT_ACCEPT_LANGUAGE;

    const useReferenceCache = accion && CACHEABLE_ACCIONES.has(accion);

    if (useReferenceCache) {
      const getCached = unstable_cache(
        async () => {
          const result = await fetchMgpJson(
            body,
            DEFAULT_USER_AGENT,
            DEFAULT_ACCEPT_LANGUAGE,
          );
          if (!result.ok) {
            throw new Error(`MGP error: ${result.status}`);
          }
          return result.data;
        },
        ["cuando-mgp", body],
        { revalidate: REFERENCE_DATA_REVALIDATE_S },
      );

      const data = await getCached();
      return NextResponse.json(data);
    }

    const result = await fetchMgpJson(body, userAgent, acceptLanguage);
    if (!result.ok) {
      return NextResponse.json(
        { error: `MGP error: ${result.status}` },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Error al conectar con el servidor de MGP" },
      { status: 502 },
    );
  }
}
