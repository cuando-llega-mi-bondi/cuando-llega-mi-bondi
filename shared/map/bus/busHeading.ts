/**
 * Rumbo del bondi.
 *
 * El arribo del GDS trae lat/lon pero no heading, así que el rumbo se deduce
 * del recorrido: se busca el segmento de la polyline más cercano a la posición
 * reportada y se toma su dirección. Es lo mismo que ya hace `BusMap` para
 * dibujar las flechitas de sentido sobre la traza, con la diferencia de que
 * acá el segmento se elige por proximidad en vez de cada 10 vértices.
 *
 * Importa contra qué traza se compara: las líneas traen ida y vuelta como
 * banderas separadas sobre la misma avenida, así que hay que usar la del
 * arribo y no la que esté pintada. Ver el detalle en `BusMap`.
 */

export type LatLngTuple = [number, number];

const RAD = Math.PI / 180;

/** Rumbo geográfico de `a` hacia `b`, en grados (0 = norte). */
export function bearingBetween(a: LatLngTuple, b: LatLngTuple): number {
    const dLon = (b[1] - a[1]) * RAD;
    const lat1 = a[0] * RAD;
    const lat2 = b[0] * RAD;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) / RAD + 360) % 360;
}

/**
 * Distancia al cuadrado de `p` al segmento `a`-`b`, en grados corregidos.
 *
 * La longitud se escala por cos(lat) porque a la latitud de Mar del Plata
 * (~38°S) un grado de longitud mide ~79% de lo que mide uno de latitud; sin
 * corregir, el segmento "más cercano" se elige mal en tramos este-oeste.
 */
function distSqAlSegmento(
    p: LatLngTuple,
    a: LatLngTuple,
    b: LatLngTuple,
    cosLat: number,
): number {
    const px = (p[1] - a[1]) * cosLat;
    const py = p[0] - a[0];
    const bx = (b[1] - a[1]) * cosLat;
    const by = b[0] - a[0];

    const largoSq = bx * bx + by * by;
    if (largoSq === 0) return px * px + py * py;

    // Proyección escalar de p sobre el segmento, recortada a [0, 1].
    let t = (px * bx + py * by) / largoSq;
    t = t < 0 ? 0 : t > 1 ? 1 : t;

    const dx = px - t * bx;
    const dy = py - t * by;
    return dx * dx + dy * dy;
}

/**
 * Rumbo de un bondi parado en `pos`, según el recorrido `points`.
 *
 * `points` tiene que venir en el sentido de circulación. El orden crudo del
 * GDS ya lo está: de las 142 banderas del dump, 133 tienen su inversa cargada
 * como bandera aparte, o sea que el orden de los vértices es direccional.
 *
 * Devuelve `null` si no hay recorrido utilizable y el que llama decide el
 * fallback.
 */
export function headingFromRoute(
    pos: LatLngTuple,
    points: LatLngTuple[],
): number | null {
    if (points.length < 2) return null;

    const cosLat = Math.cos(pos[0] * RAD);

    let mejor = 0;
    let mejorDist = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
        const d = distSqAlSegmento(pos, points[i], points[i + 1], cosLat);
        if (d < mejorDist) {
            mejorDist = d;
            mejor = i;
        }
    }

    return bearingBetween(points[mejor], points[mejor + 1]);
}

/**
 * Fallback cuando no hay recorrido: apuntar el bondi hacia la parada. No es el
 * rumbo real, pero un bondi mirando a la parada a la que está por llegar se
 * lee mejor que uno siempre mirando al este.
 */
export function headingHaciaParada(
    pos: LatLngTuple,
    parada: LatLngTuple | null,
): number {
    if (!parada) return 90;
    return bearingBetween(pos, parada);
}
