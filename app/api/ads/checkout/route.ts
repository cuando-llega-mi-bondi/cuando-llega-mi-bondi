import { NextResponse } from "next/server";
import { z } from "zod";
import { parseAdHref } from "@features/sponsors/lib/href";
import { formatArs } from "@features/sponsors/lib/pricing";
import { createAdPurchase, getAdBoard, updateAdPurchase } from "@features/sponsors/lib/purchases";
import { createAdPreference } from "@/lib/mercadopago/client";
import { isAdCheckoutConfigured } from "@/lib/server/supabaseAdmin";

const checkoutSchema = z.object({
  title: z.string().trim().min(2).max(80),
  href: z.string().trim().min(4).max(2048),
  tagline: z.string().trim().max(140).optional(),
  amountArs: z.number().int().positive().max(2_000_000),
  email: z.string().email().max(255).optional(),
  acceptedTerms: z.literal(true),
});

const MAX_CHECKOUT_AMOUNT = 2_000_000;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type inválido" }, { status: 415 });
    }

    if (!isAdCheckoutConfigured()) {
      return NextResponse.json(
        { error: "El pago todavía no está configurado" },
        { status: 503 },
      );
    }

    const body: unknown = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      const wantsTerms = validation.error.issues.some((issue) => issue.path[0] === "acceptedTerms");
      return NextResponse.json(
        { error: wantsTerms ? "Tenés que aceptar los términos del lugar" : "Datos inválidos" },
        { status: 400 },
      );
    }

    let href: string;
    try {
      href = parseAdHref(validation.data.href);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "El link es inválido" },
        { status: 400 },
      );
    }

    const board = await getAdBoard();
    const { title, tagline, amountArs, email } = validation.data;
    if (amountArs < board.minToEnterArs) {
      return NextResponse.json(
        { error: `Tenés que poner al menos ${formatArs(board.minToEnterArs)}` },
        { status: 409 },
      );
    }
    if (amountArs > MAX_CHECKOUT_AMOUNT) {
      return NextResponse.json({ error: "El monto supera el máximo" }, { status: 400 });
    }

    const purchase = await createAdPurchase({
      title,
      href,
      tagline: tagline?.trim() ? tagline.trim() : null,
      amount_ars: amountArs,
      status: "pending",
      payer_email: email || "pending@checkout",
      accepted_terms_at: new Date().toISOString(),
    });

    const mpPreference = await createAdPreference({
      title,
      amountArs,
      purchaseId: purchase.id,
      buyerEmail: email,
    });

    await updateAdPurchase(purchase.id, {
      mercadopago_preference_id: mpPreference.id ?? null,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error("Ad checkout error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}
