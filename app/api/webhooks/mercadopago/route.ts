import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  getAdPurchase,
  tryClaimAdSlot,
  updateAdPurchaseStatusAtomically,
} from "@features/sponsors/lib/purchases";
import { getPayment } from "@/lib/mercadopago/client";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const MAX_WEBHOOK_AGE_SECONDS = 300;

function verifyWebhookSignature(request: Request, body: string): boolean {
  if (!WEBHOOK_SECRET) {
    throw new Error("MERCADOPAGO_WEBHOOK_SECRET is not configured");
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const webhookAgeSeconds = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (Number.isNaN(webhookAgeSeconds) || webhookAgeSeconds < 0 || webhookAgeSeconds > MAX_WEBHOOK_AGE_SECONDS) {
    return false;
  }

  const parsed = JSON.parse(body) as { data?: { id?: string } };
  const dataId = parsed?.data?.id;
  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(template).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (expectedBuf.length !== hashBuf.length) return false;
  return timingSafeEqual(expectedBuf, hashBuf);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!verifyWebhookSignature(request, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };

    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return NextResponse.json({ received: true });

    const paymentIdStr = String(paymentId);
    if (!/^\d{1,20}$/.test(paymentIdStr)) return NextResponse.json({ received: true });

    const payment = await getPayment(paymentIdStr);
    if (!payment?.external_reference) return NextResponse.json({ received: true });

    const existing = await getAdPurchase(payment.external_reference);
    if (!existing) return NextResponse.json({ received: true });

    if (Number(payment.transaction_amount) !== Number(existing.amount_ars)) {
      console.error(
        `Amount mismatch for purchase ${payment.external_reference}: expected ${existing.amount_ars}, got ${payment.transaction_amount}`,
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    let status: "pending" | "approved" | "rejected" = "pending";
    if (payment.status === "approved") status = "approved";
    else if (["rejected", "cancelled", "refunded"].includes(payment.status || "")) status = "rejected";

    const payerEmail = payment.payer?.email;

    const updated = await updateAdPurchaseStatusAtomically(payment.external_reference, "pending", {
      status,
      mercadopago_payment_id: paymentIdStr,
      ...(payerEmail ? { payer_email: payerEmail } : {}),
      updated_at: new Date().toISOString(),
    });

    if (updated && status === "approved") {
      const purchase = await getAdPurchase(payment.external_reference);
      if (purchase) await tryClaimAdSlot(purchase);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
