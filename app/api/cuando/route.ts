import { NextRequest, NextResponse } from "next/server";

const MGP_URL = "https://appsl.mardelplata.gob.ar/app_cuando_llega/webWS.php";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const response = await fetch(MGP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer:
          "https://appsl.mardelplata.gob.ar/app_cuando_llega/cuando.php",
      },
      body,
    });

    if (!response.ok) {
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
