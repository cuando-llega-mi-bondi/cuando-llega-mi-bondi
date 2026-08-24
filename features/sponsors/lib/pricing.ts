const DEFAULT_FLOOR_ARS = 1_000;
const DEFAULT_STEP_ARS = 1_000;

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

/** Lo mínimo que sale publicar cuando hay un puesto libre. */
export function adSlotFloorArs(): number {
  return readPositiveInt(process.env.AD_SLOT_FLOOR_ARS, DEFAULT_FLOOR_ARS);
}

/** Cuánto hay que sumarle a alguien para pasarlo en el ranking. */
export function adSlotStepArs(): number {
  return readPositiveInt(process.env.AD_SLOT_STEP_ARS, DEFAULT_STEP_ARS);
}

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
