import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// Ahora apuntamos a tu túnel de Termux
const PROXY_BASE_URL = process.env.MGP_PROXY_URL;
const PROXY_URL = `${PROXY_BASE_URL}/proxy`;
const INIT_URL = `${PROXY_BASE_URL}/init`;
const PROXY_TOKEN = process.env.MGP_PROXY_TOKEN ?? "bondimdp2024";

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

// Helper para forzar el init en Termux
async function forceTermuxInit() {
  console.log("🔄 Solicitando nueva sesión a Termux...");
  try {
    const res = await fetch(INIT_URL, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    console.error("❌ Error llamando a /init en Termux:", e);
    return null;
  }
}

async function fetchMgpJson(body: string): Promise<any> {
  // Intentos: 1 (normal), 2 (post-init)
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-proxy-token": PROXY_TOKEN,
      },
      body,
      cache: 'no-store'
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      // Si no es JSON, probablemente sea un error de Cloudflare o PHP
      if (attempt === 0) {
        await forceTermuxInit();
        continue;
      }
      throw new Error("Respuesta no válida de MGP");
    }

    // Si el proxy nos avisa de un bloqueo o error de sesión (CF block es 503 en nuestro Termux)
    if (response.status === 503 || response.status === 403 || (data && data.error)) {
      if (attempt === 0) {
        await forceTermuxInit();
        continue; // Reintentar con la nueva sesión
      }
    }

    return data;
  }
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