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

export interface AdContribution {
  id: string;
  boostedFromId: string | null;
  title: string;
  href: string;
  tagline: string | null;
  amountArs: number;
  since: string;
}

export interface AdGroup {
  id: string;
  title: string;
  href: string;
  tagline: string | null;
  amountArs: number;
  since: string;
}

/**
 * Suma cada boost a su aviso raíz (boostedFromId). Un aviso sin boosts es su
 * propio grupo de una fila. Un boost cuya raíz no está en `rows` (por ejemplo
 * dejó de estar aprobada) queda como su propio grupo en vez de perderse.
 * Resuelto en memoria porque la tabla es chica (decenas de filas).
 * ponytail: si esto crece a miles de avisos activos, mover la suma a una
 * vista SQL en vez de traer todas las filas a la app.
 */
export function groupAdContributions(rows: AdContribution[]): AdGroup[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const totals = new Map<string, number>();

  for (const row of rows) {
    const rootId = row.boostedFromId && byId.has(row.boostedFromId) ? row.boostedFromId : row.id;
    totals.set(rootId, (totals.get(rootId) ?? 0) + row.amountArs);
  }

  return Array.from(totals.entries()).map(([rootId, amountArs]) => {
    const root = byId.get(rootId)!;
    return { id: root.id, title: root.title, href: root.href, tagline: root.tagline, amountArs, since: root.since };
  });
}
