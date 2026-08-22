const DEFAULT_FLOOR_ARS = 1_000;
const DEFAULT_STEP_ARS = 1_000;

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

export function adSlotFloorArs(): number {
  return readPositiveInt(process.env.AD_SLOT_FLOOR_ARS, DEFAULT_FLOOR_ARS);
}

export function adSlotStepArs(): number {
  return readPositiveInt(process.env.AD_SLOT_STEP_ARS, DEFAULT_STEP_ARS);
}

/** Precio mínimo para sacar al ocupante actual. Si el lugar está libre, es el piso. */
export function minNextAmountArs(currentAmountArs: number): number {
  const current = Number.isFinite(currentAmountArs) ? Math.max(0, Math.trunc(currentAmountArs)) : 0;
  if (current <= 0) return adSlotFloorArs();
  return current + adSlotStepArs();
}

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
