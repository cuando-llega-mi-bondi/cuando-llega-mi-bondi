import { NextResponse } from "next/server";
import { getAdBoard } from "@features/sponsors/lib/purchases";

export async function GET() {
  try {
    const board = await getAdBoard();
    return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ad board GET:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo leer el ranking" }, { status: 500 });
  }
}
