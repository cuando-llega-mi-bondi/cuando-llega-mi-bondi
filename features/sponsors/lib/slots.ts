export const AD_SLOT_IDS = ["consultar", "consultar-2"] as const;

export type AdSlotId = (typeof AD_SLOT_IDS)[number];

export const AD_SLOTS: { id: AdSlotId; label: string; blurb: string }[] = [
  { id: "consultar", label: "Lugar 1", blurb: "El de arriba. Se ve primero." },
  { id: "consultar-2", label: "Lugar 2", blurb: "Justo abajo. Misma plata, un toque menos visto." },
];

export function isAdSlotId(value: string): value is AdSlotId {
  return (AD_SLOT_IDS as readonly string[]).includes(value);
}

export function adSlotMeta(id: AdSlotId) {
  return AD_SLOTS.find((slot) => slot.id === id) ?? AD_SLOTS[0];
}
