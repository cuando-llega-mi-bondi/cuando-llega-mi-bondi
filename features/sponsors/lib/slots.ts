export const AD_SLOT_IDS = ["consultar", "consultar-2"] as const;

export type AdSlotId = (typeof AD_SLOT_IDS)[number];

export const AD_SLOTS: { id: AdSlotId; label: string; blurb: string }[] = [
  { id: "consultar", label: "Casillero A", blurb: "Se ordena por lo que se paga: el que más puso entre los dos se ve arriba." },
  { id: "consultar-2", label: "Casillero B", blurb: "Mismo trato que el otro casillero: no importa cuál elegís, gana el que más paga." },
];

export function isAdSlotId(value: string): value is AdSlotId {
  return (AD_SLOT_IDS as readonly string[]).includes(value);
}

export function adSlotMeta(id: AdSlotId) {
  return AD_SLOTS.find((slot) => slot.id === id) ?? AD_SLOTS[0];
}
