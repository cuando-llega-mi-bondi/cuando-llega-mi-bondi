import { NextResponse } from "next/server";
import { getAdHistory } from "@features/sponsors/lib/purchases";

export async function GET() {
  try {
    const history = await getAdHistory();
    return NextResponse.json(history, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ad history GET:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo leer el historial" }, { status: 500 });
  }
}
