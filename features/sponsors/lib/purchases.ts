import { createAdminClient } from "@/lib/server/supabaseAdmin";
import {
  AD_PODIUM_SIZE,
  compareAdBids,
  groupAdContributions,
  minToEnterArs,
  minToLeadArs,
  type AdContribution,
} from "@features/sponsors/lib/board";
import { adSlotFloorArs, adSlotStepArs } from "@features/sponsors/lib/pricing";
import { DEV_FIXTURE_ADS } from "@features/sponsors/lib/devFixture";
import { supabase as publicSupabase } from "@shared/infra/supabase";

export type AdPurchaseStatus = "pending" | "approved" | "rejected";

/** Columnas del aviso que son públicas (el resto queda sin GRANT para anon). */
const BOARD_COLUMNS = "id, title, href, tagline, amount_ars, created_at, boosted_from_id";

/** Tope de cuántos grupos (negocios) trae el historial: son pocos y no queremos paginar todavía. */
const HISTORY_LIMIT = 30;

export interface AdPurchaseInsert {
  title: string;
  href: string;
  tagline: string | null;
  amount_ars: number;
  status: "pending";
  payer_email: string;
  accepted_terms_at: string;
  /** Si es un boost, el id del aviso raíz al que se suma este pago. */
  boosted_from_id: string | null;
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
  boosted_from_id: string | null;
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
  boosted_from_id: string | null;
};

function toContribution(row: BoardRow): AdContribution | null {
  if (!row.title || !row.href) return null;
  return {
    id: row.id,
    boostedFromId: row.boosted_from_id,
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

/**
 * Trae todas las filas aprobadas y las agrupa (raíz + sus boosts). Sin
 * `.limit`: agrupar después de cortar podría perder boosts de un aviso que
 * quedó afuera de la página. La tabla es chica, no hace falta paginar acá.
 *
 * En dev se suman los avisos ficticios de `devFixture.ts` (aunque la query
 * real falle o esté vacía) para poder testear el ranking/boost visualmente
 * sin depender de datos reales ni de que la migración ya esté aplicada.
 */
async function fetchApprovedGroups() {
  const { data, error } = await publicSupabase
    .from("ad_purchases")
    .select(BOARD_COLUMNS)
    .eq("status", "approved");

  if (error) {
    console.error("ad purchases read failed:", error.message);
    if (DEV_FIXTURE_ADS.length === 0) return null;
  }

  const contributions = error
    ? []
    : ((data ?? []) as BoardRow[]).map(toContribution).filter((row): row is AdContribution => row !== null);

  const groups = [...groupAdContributions(contributions), ...DEV_FIXTURE_ADS];
  return groups.sort(compareAdBids);
}

export async function getAdBoard(): Promise<AdBoardView> {
  const groups = await fetchApprovedGroups();
  if (!groups) return emptyBoard();

  const floorArs = adSlotFloorArs();
  const stepArs = adSlotStepArs();
  const podium = groups.slice(0, AD_PODIUM_SIZE);
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
  const groups = await fetchApprovedGroups();
  if (!groups) return { entries: [], total: 0 };

  const entries = [...groups]
    .sort((a, b) => b.since.localeCompare(a.since))
    .slice(0, HISTORY_LIMIT);

  return { entries, total: groups.length };
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
      "id, title, href, tagline, amount_ars, status, went_live, created_at, mercadopago_preference_id, mercadopago_payment_id, payer_email, boosted_from_id",
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
 * Puesto del GRUPO al que pertenece este pago (0 es el puesto 1): su propio
 * total si es una raíz, o el total de la raíz que boostea. Se recalcula
 * contra la tabla en vez de guardarse, así no queda viejo si cambia algún
 * monto o aparece un boost nuevo.
 */
export async function getAdPurchaseRank(purchase: AdPurchase): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_purchases")
    .select("id, title, href, tagline, amount_ars, created_at, boosted_from_id")
    .eq("status", "approved");

  if (error) {
    console.error("Error ranking ad purchase:", error);
    throw new Error("Failed to rank purchase");
  }

  const contributions = ((data ?? []) as BoardRow[])
    .map(toContribution)
    .filter((row): row is AdContribution => row !== null);
  const groups = groupAdContributions(contributions).sort(compareAdBids);
  const rootId = purchase.boosted_from_id ?? purchase.id;
  const rank = groups.findIndex((group) => group.id === rootId);
  return rank === -1 ? groups.length : rank;
}

/** Marca el pago recién aprobado si entró al podio. Devuelve si salió al aire. */
export async function settleApprovedPurchase(purchase: AdPurchase): Promise<boolean> {
  const live = (await getAdPurchaseRank(purchase)) < AD_PODIUM_SIZE;
  if (live && !purchase.went_live) {
    await updateAdPurchase(purchase.id, { went_live: true, updated_at: new Date().toISOString() });
  }
  return live;
}
