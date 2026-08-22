import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

const preference = new Preference(client);
const payment = new Payment(client);

function validateBaseUrl(raw: string): string {
  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid base URL protocol: ${parsed.protocol}`);
  }
  return parsed.origin;
}

interface CreateAdPreferenceParams {
  title: string;
  amountArs: number;
  purchaseId: string;
  slotLabel?: string;
  buyerEmail?: string;
}

export async function createAdPreference({
  title,
  amountArs,
  purchaseId,
  slotLabel,
  buyerEmail,
}: CreateAdPreferenceParams) {
  const baseUrl = validateBaseUrl(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const place = slotLabel ?? "Lugar";

  return preference.create({
    body: {
      items: [
        {
          id: "consultar-ad-slot",
          title: `${place} en Bondi MDP: ${title}`.slice(0, 250),
          quantity: 1,
          unit_price: amountArs,
          currency_id: "ARS",
        },
      ],
      ...(buyerEmail ? { payer: { email: buyerEmail } } : {}),
      back_urls: {
        success: `${baseUrl}/anunciate/exito?purchase=${purchaseId}`,
        failure: `${baseUrl}/anunciate/error?purchase=${purchaseId}`,
        pending: `${baseUrl}/anunciate/exito?purchase=${purchaseId}&status=pending`,
      },
      ...(baseUrl.startsWith("https") ? { auto_return: "approved" as const } : {}),
      external_reference: purchaseId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "BONDI MDP",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    requestOptions: {
      idempotencyKey: purchaseId,
    },
  });
}

export async function getPayment(paymentId: string) {
  return payment.get({ id: paymentId });
}
