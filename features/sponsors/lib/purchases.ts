import { createAdminClient } from "@/lib/server/supabaseAdmin";
import { adSlotFloorArs, adSlotStepArs, minNextAmountArs } from "@features/sponsors/lib/pricing";
import { AD_SLOTS, adSlotMeta, isAdSlotId, type AdSlotId } from "@features/sponsors/lib/slots";
import { supabase as publicSupabase } from "@shared/infra/supabase";

export type AdPurchaseStatus = "pending" | "approved" | "rejected";

export interface AdPurchaseInsert {
  slot_id: AdSlotId;
  title: string;
  href: string;
  tagline: string | null;
  amount_ars: number;
  status: "pending";
  payer_email: string;
  accepted_terms_at: string;
}

export interface AdPurchase {
  id: string;
  slot_id: AdSlotId;
  title: string;
  href: string;
  tagline: string | null;
  amount_ars: number;
  status: AdPurchaseStatus;
  went_live: boolean;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  payer_email: string | null;
}

export interface AdSlotView {
  id: AdSlotId;
  label: string;
  blurb: string;
  occupied: boolean;
  title: string | null;
  href: string | null;
  tagline: string | null;
  amountArs: number;
  minNextArs: number;
  stepArs: number;
  floorArs: number;
}

type SlotRow = {
  id?: string | null;
  title: string | null;
  href: string | null;
  tagline: string | null;
  amount_ars: number | null;
};

function toSlotView(id: AdSlotId, row: SlotRow | null): AdSlotView {
  const meta = adSlotMeta(id);
  const amountArs = Math.max(0, Math.trunc(Number(row?.amount_ars ?? 0)));
  const occupied = Boolean(row?.href && row?.title);
  return {
    id,
    label: meta.label,
    blurb: meta.blurb,
    occupied,
    title: occupied ? row?.title ?? null : null,
    href: occupied ? row?.href ?? null : null,
    tagline: occupied ? row?.tagline ?? null : null,
    amountArs: occupied ? amountArs : 0,
    minNextArs: minNextAmountArs(occupied ? amountArs : 0),
    stepArs: adSlotStepArs(),
    floorArs: adSlotFloorArs(),
  };
}

export async function getAdSlotsView(): Promise<AdSlotView[]> {
  const { data, error } = await publicSupabase
    .from("ad_slot")
    .select("id, title, href, tagline, amount_ars")
    .in("id", AD_SLOTS.map((slot) => slot.id));

  if (error) {
    console.error("ad_slot read failed:", error.message);
    return AD_SLOTS.map((slot) => toSlotView(slot.id, null));
  }

  const byId = new Map((data ?? []).map((row) => [row.id, row]));
  return AD_SLOTS.map((slot) => toSlotView(slot.id, byId.get(slot.id) ?? null));
}

export async function getAdSlotView(slotId: AdSlotId): Promise<AdSlotView> {
  const { data, error } = await publicSupabase
    .from("ad_slot")
    .select("id, title, href, tagline, amount_ars")
    .eq("id", slotId)
    .maybeSingle();

  if (error) {
    console.error("ad_slot read failed:", error.message);
    return toSlotView(slotId, null);
  }
  return toSlotView(slotId, data);
}

export async function createAdPurchase(data: AdPurchaseInsert): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const { data: purchase, error } = await supabase
    .from("ad_purchases")
    .insert(data)
    .select("id")
    .single();

  if (error || !purchase) {
    console.error("Error creating ad purchase:", error);
    throw new Error("Failed to create purchase");
  }
  return purchase;
}

export async function updateAdPurchase(
  id: string,
  data: Partial<
    Pick<
      AdPurchase,
      | "status"
      | "mercadopago_preference_id"
      | "mercadopago_payment_id"
      | "payer_email"
      | "went_live"
    >
  > & { updated_at?: string },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("ad_purchases").update(data).eq("id", id);
  if (error) {
    console.error("Error updating ad purchase:", error);
    throw new Error("Failed to update purchase");
  }
}

export async function getAdPurchase(id: string): Promise<AdPurchase | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_purchases")
    .select(
      "id, slot_id, title, href, tagline, amount_ars, status, went_live, mercadopago_preference_id, mercadopago_payment_id, payer_email",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (!isAdSlotId(String(data.slot_id))) return null;
  return data as AdPurchase;
}

export async function updateAdPurchaseStatusAtomically(
  id: string,
  expectedStatus: AdPurchaseStatus,
  data: Partial<Pick<AdPurchase, "status" | "mercadopago_payment_id" | "payer_email">> & {
    updated_at?: string;
  },
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("ad_purchases")
    .update(data)
    .eq("id", id)
    .eq("status", expectedStatus)
    .select("id");

  if (error) {
    console.error("Error updating ad purchase atomically:", error);
    throw new Error("Failed to update purchase atomically");
  }
  return (updated?.length ?? 0) > 0;
}

/** Takes that slot only if this bid is strictly higher than the current amount. */
export async function tryClaimAdSlot(purchase: AdPurchase): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_slot")
    .update({
      purchase_id: purchase.id,
      title: purchase.title,
      href: purchase.href,
      tagline: purchase.tagline,
      amount_ars: purchase.amount_ars,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.slot_id)
    .lt("amount_ars", purchase.amount_ars)
    .select("id");

  if (error) {
    console.error("Error claiming ad slot:", error);
    throw new Error("Failed to claim ad slot");
  }

  const live = (data?.length ?? 0) > 0;
  if (live) {
    await updateAdPurchase(purchase.id, { went_live: true, updated_at: new Date().toISOString() });
  }
  return live;
}
