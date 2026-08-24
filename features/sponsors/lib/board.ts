/**
 * Un solo ranking: los pagos aprobados se ordenan por monto y los primeros
 * AD_PODIUM_SIZE se publican en Consultar. No hay casilleros que elegir — el
 * puesto sale del monto y nada más.
 */
export const AD_PODIUM_SIZE = 2;

export function podiumLabel(rank: number): string {
  return `Puesto ${rank}`;
}

/**
 * A igual monto gana el que pagó primero: si no, alguien podría empatar al
 * ocupante y desplazarlo sin poner un peso más.
 */
export function compareAdBids(
  a: { amountArs: number; since: string },
  b: { amountArs: number; since: string },
): number {
  if (a.amountArs !== b.amountArs) return b.amountArs - a.amountArs;
  return a.since.localeCompare(b.since);
}

/** Lo que hay que poner para entrar al podio: superar al último que está al aire. */
export function minToEnterArs(podiumAmounts: number[], floorArs: number, stepArs: number): number {
  if (podiumAmounts.length < AD_PODIUM_SIZE) return floorArs;
  const last = podiumAmounts[podiumAmounts.length - 1];
  return Math.max(floorArs, last + stepArs);
}

/** Lo que hay que poner para quedar primero. */
export function minToLeadArs(podiumAmounts: number[], floorArs: number, stepArs: number): number {
  const top = podiumAmounts[0] ?? 0;
  if (top <= 0) return floorArs;
  return Math.max(floorArs, top + stepArs);
}
