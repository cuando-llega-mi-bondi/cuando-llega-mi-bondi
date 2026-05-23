/**
 * Recorta una polilínea [lat,lng] por distancia de arco (metros), proyectando
 * dos puntos sobre la línea — mismo modelo que `orderStopsAlongPolyline` en
 * `transitStaticModels` (segmentos en plano local).
 */

export type LatLng = [number, number];

export function buildSegLensAndCum(pts: LatLng[]): { segLens: number[]; cum: number[] } {
    const segLens: number[] = [];
    const cum: number[] = [0];
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const refLat = (a[0] + b[0]) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const dx = (b[1] - a[1]) * cosLat * 111_320;
        const dy = (b[0] - a[0]) * 111_320;
        segLens[i] = Math.sqrt(dx * dx + dy * dy);
        cum[i + 1] = cum[i]! + segLens[i]!;
    }
    return { segLens, cum };
}

/** Arc-length (m) desde el inicio de la polilínea hasta la proyección ortogonal más cercana de (lat,lng). */
export function projectLatLngOntoPolylineArc(
    lat: number,
    lng: number,
    pts: LatLng[],
    segLens: number[],
    cum: number[],
): number | null {
    if (pts.length < 2) return null;
    let bestArc = 0;
    let bestDistSq = Number.POSITIVE_INFINITY;
    let found = false;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const refLat = (a[0] + b[0]) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const bx = (b[1] - a[1]) * cosLat * 111_320;
        const by = (b[0] - a[0]) * 111_320;
        const px = (lng - a[1]) * cosLat * 111_320;
        const py = (lat - a[0]) * 111_320;
        const segSq = bx * bx + by * by;
        const t = segSq < 1e-9 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / segSq));
        const projDx = px - bx * t;
        const projDy = py - by * t;
        const distSq = projDx * projDx + projDy * projDy;
        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestArc = cum[i]! + segLens[i]! * t;
            found = true;
        }
    }
    return found ? bestArc : null;
}

function interpolateAtArc(arc: number, pts: LatLng[], segLens: number[], cum: number[]): LatLng {
    if (pts.length === 0) return [0, 0];
    if (pts.length === 1) return [...pts[0]!] as LatLng;
    if (arc <= cum[0]!) return [...pts[0]!] as LatLng;
    const last = cum.length - 1;
    if (arc >= cum[last]!) return [...pts[last]!] as LatLng;

    for (let i = 0; i < pts.length - 1; i++) {
        const c0 = cum[i]!;
        const c1 = cum[i + 1]!;
        if (arc > c1) continue;
        const sl = segLens[i]!;
        const t = sl < 1e-9 ? 0 : (arc - c0) / sl;
        const a = pts[i]!;
        const b = pts[i + 1]!;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    return [...pts[last]!] as LatLng;
}

function dedupeConsecutiveClose(out: LatLng[], minMetersSq: number): LatLng[] {
    const r: LatLng[] = [];
    for (const p of out) {
        const prev = r[r.length - 1];
        if (!prev) {
            r.push(p);
            continue;
        }
        const refLat = (p[0] + prev[0]) / 2;
        const cosLat = Math.cos((refLat * Math.PI) / 180);
        const dx = (p[1] - prev[1]) * cosLat * 111_320;
        const dy = (p[0] - prev[0]) * 111_320;
        if (dx * dx + dy * dy >= minMetersSq) r.push(p);
    }
    return r;
}

/**
 * Porción de `pts` entre `arcFrom` y `arcTo` (metros de arco desde el inicio de la
 * polilínea), en orden de recorrido del bondi (de subida a bajada).
 */
export function slicePolylineBetweenArcs(pts: LatLng[], arcFrom: number, arcTo: number): LatLng[] {
    if (pts.length < 2) return [...pts];
    const { segLens, cum } = buildSegLensAndCum(pts);
    const lo = Math.min(arcFrom, arcTo);
    const hi = Math.max(arcFrom, arcTo);

    const innerAsc: LatLng[] = [];
    for (let i = 0; i < pts.length; i++) {
        const c = cum[i]!;
        if (c > lo && c < hi) innerAsc.push([...pts[i]!] as LatLng);
    }

    const atLo = interpolateAtArc(lo, pts, segLens, cum);
    const atHi = interpolateAtArc(hi, pts, segLens, cum);

    let chain: LatLng[];
    if (arcFrom <= arcTo) {
        chain = [atLo, ...innerAsc, atHi];
    } else {
        chain = [atHi, ...innerAsc.slice().reverse(), atLo];
    }
    return dedupeConsecutiveClose(chain, 0.5 * 0.5);
}
