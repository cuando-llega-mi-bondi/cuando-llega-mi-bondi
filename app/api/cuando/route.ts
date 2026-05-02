import { NextRequest, NextResponse } from "next/server";

const MGP_URL = "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const preferredRegion = ["gru1", "sfo1"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const userAgent = req.headers.get("user-agent") ?? DEFAULT_USER_AGENT;
    const acceptLanguage =
      req.headers.get("accept-language") ?? "es-AR,es;q=0.9,en;q=0.8";

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
      return NextResponse.json(
        { error: `MGP error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Error al conectar con el servidor de MGP" },
      { status: 502 }
    );
  }
}
