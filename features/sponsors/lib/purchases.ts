import { createAdminClient } from "@/lib/server/supabaseAdmin";
import {
  AD_PODIUM_SIZE,
  compareAdBids,
  minToEnterArs,
  minToLeadArs,
} from "@features/sponsors/lib/board";
import { adSlotFloorArs, adSlotStepArs } from "@features/sponsors/lib/pricing";
import { supabase as publicSupabase } from "@shared/infra/supabase";

export type AdPurchaseStatus = "pending" | "approved" | "rejected";

/** Columnas del aviso que son públicas (el resto queda sin GRANT para anon). */
const BOARD_COLUMNS = "id, title, href, tagline, amount_ars, created_at";

/** Tope de lo que trae el historial de una: son pocos y no queremos paginar todavía. */
const HISTORY_LIMIT = 30;

export interface AdPurchaseInsert {
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
  title: string;
  href: string;
  tagline: string | null;
  amount_ars: number;
  status: AdPurchaseStatus;
  went_live: boolean;
  created_at: string;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  payer_email: string | null;
}

export interface AdBoardEntry {
  id: string;
  title: string;
  href: string;
  tagline: string | null;
  amountArs: number;
  since: string;
}

export interface AdBoardView {
  /** Ya ordenado: el primero es el que más puso. Puede venir corto o vacío. */
  podium: AdBoardEntry[];
  podiumSize: number;
  minToEnterArs: number;
  minToLeadArs: number;
  stepArs: number;
  floorArs: number;
}

export interface AdHistoryView {
  /** Del más reciente al más viejo, incluidos los que están al aire ahora. */
  entries: AdBoardEntry[];
  total: number;
}

type BoardRow = {
  id: string;
  title: string | null;
  href: string | null;
  tagline: string | null;
  amount_ars: number | null;
  created_at: string;
};

function toBoardEntry(row: BoardRow): AdBoardEntry | null {
  if (!row.title || !row.href) return null;
  return {
    id: row.id,
    title: row.title,
    href: row.href,
    tagline: row.tagline,
    amountArs: Math.max(0, Math.trunc(Number(row.amount_ars ?? 0))),
    since: row.created_at,
  };
}

function emptyBoard(): AdBoardView {
  const floorArs = adSlotFloorArs();
  const stepArs = adSlotStepArs();
  return {
    podium: [],
    podiumSize: AD_PODIUM_SIZE,
    minToEnterArs: minToEnterArs([], floorArs, stepArs),
    minToLeadArs: minToLeadArs([], floorArs, stepArs),
    stepArs,
    floorArs,
  };
}

export async function getAdBoard(): Promise<AdBoardView> {
  const { data, error } = await publicSupabase
    .from("ad_purchases")
    .select(BOARD_COLUMNS)
    .eq("status", "approved")
    .order("amount_ars", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(AD_PODIUM_SIZE);

  if (error) {
    console.error("ad board read failed:", error.message);
    return emptyBoard();
  }

  const floorArs = adSlotFloorArs();
  const stepArs = adSlotStepArs();
  const podium = ((data ?? []) as BoardRow[])
    .map(toBoardEntry)
    .filter((entry): entry is AdBoardEntry => entry !== null)
    .sort(compareAdBids);
  const amounts = podium.map((entry) => entry.amountArs);

  return {
    podium,
    podiumSize: AD_PODIUM_SIZE,
    minToEnterArs: minToEnterArs(amounts, floorArs, stepArs),
    minToLeadArs: minToLeadArs(amounts, floorArs, stepArs),
    stepArs,
    floorArs,
  };
}

export async function getAdHistory(): Promise<AdHistoryView> {
  const { data, error, count } = await publicSupabase
    .from("ad_purchases")
    .select(BOARD_COLUMNS, { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("ad history read failed:", error.message);
    return { entries: [], total: 0 };
  }

  const entries = ((data ?? []) as BoardRow[])
    .map(toBoardEntry)
    .filter((entry): entry is AdBoardEntry => entry !== null);

  return { entries, total: count ?? entries.length };
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
      "id, title, href, tagline, amount_ars, status, went_live, created_at, mercadopago_preference_id, mercadopago_payment_id, payer_email",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
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

/**
 * Cuántos pagos aprobados le ganan a este: 0 es el puesto 1. Se calcula contra
 * la tabla en vez de guardarse, así el puesto no queda viejo si aparece un pago
 * más alto (o si le damos de baja a alguien a mano).
 */
export async function getAdPurchaseRank(purchase: AdPurchase): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("ad_purchases")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .neq("id", purchase.id)
    .or(
      `amount_ars.gt.${purchase.amount_ars},and(amount_ars.eq.${purchase.amount_ars},created_at.lt."${purchase.created_at}")`,
    );

  if (error) {
    console.error("Error ranking ad purchase:", error);
    throw new Error("Failed to rank purchase");
  }
  return count ?? 0;
}

/** Marca el pago recién aprobado si entró al podio. Devuelve si salió al aire. */
export async function settleApprovedPurchase(purchase: AdPurchase): Promise<boolean> {
  const live = (await getAdPurchaseRank(purchase)) < AD_PODIUM_SIZE;
  if (live && !purchase.went_live) {
    await updateAdPurchase(purchase.id, { went_live: true, updated_at: new Date().toISOString() });
  }
  return live;
}
