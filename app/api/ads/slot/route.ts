import { NextResponse } from "next/server";
import { getAdSlotsView } from "@features/sponsors/lib/purchases";

export async function GET() {
  try {
    const slots = await getAdSlotsView();
    return NextResponse.json(
      { slots },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("ad slot GET:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo leer el lugar" }, { status: 500 });
  }
}
