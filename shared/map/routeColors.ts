/**
 * Paleta categórica para diferenciar ramales/sentidos superpuestos en el mismo
 * mapa (BusMap). Sin esto, todo lo que no es el ramal "activo" se pintaba
 * igual (gris tenue), sin forma de distinguir un sentido de otro.
 */
export const ROUTE_COLORS = [
    "#0ea5e9",
    "#a855f7",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#eab308",
];

export function colorForRouteIndex(index: number): string {
    return ROUTE_COLORS[index % ROUTE_COLORS.length];
}
