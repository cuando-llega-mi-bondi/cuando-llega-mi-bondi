import { NextResponse } from "next/server";
import { AD_PODIUM_SIZE } from "@features/sponsors/lib/board";
import { getAdPurchase, getAdPurchaseRank } from "@features/sponsors/lib/purchases";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await getAdPurchase(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // El puesto se calcula ahora y no se lee de went_live: si alguien puso más
  // mientras tanto, el comprobante tiene que decir eso y no lo que pasó al pagar.
  const rank = data.status === "approved" ? (await getAdPurchaseRank(data)) + 1 : null;

  return NextResponse.json({
    id: data.id,
    status: data.status,
    rank,
    wentLive: rank !== null && rank <= AD_PODIUM_SIZE,
  });
}
