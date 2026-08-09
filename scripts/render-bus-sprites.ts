/**
 * Rasteriza la malla del bondi a un sprite sheet SVG, offline.
 *
 * La idea es quedarse con el look tridimensional sin pagar `three` en runtime:
 * el modelo se proyecta acá, una vez, a 16 orientaciones, y la app termina
 * mostrando un `background-image` con el cuadro que corresponde al rumbo.
 *
 * No usa GPU. La proyección es ortográfica pura (mismo encuadre que tenía el
 * overlay WebGL) y el sombreado es plano por cara, calculado a mano — así el
 * script corre en Node sin headless-gl ni un navegador.
 *
 * Salida SVG y no PNG porque el resultado es geometría plana de pocos
 * polígonos: pesa parecido, se ve nítido en cualquier densidad de pantalla y
 * evita tener que mantener una versión @2x.
 *
 * Uso: bun run render-sprites
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Mesh, Vector3 } from "three";

import { crearSlot, aplicarOrientacion } from "../shared/map/bus/modelo/busSlot";
import { BUS_LARGO_MODELO } from "../shared/map/bus/modelo/busMesh";

/** Cuántas orientaciones se rinden. 16 = un cuadro cada 22,5°. */
const ANGULOS = 16;
/** Cuadros por fila en la hoja. */
const COLUMNAS = 4;
/** Escala de autoría. El bondi mide 12m, así que su largo queda en 96px. */
const PX_POR_METRO = 8;
/** Aire alrededor del cuadro, en píxeles de autoría. */
const MARGEN = 6;

// ── Sombreado ────────────────────────────────────────────────────────────────
// Valores propios en vez de replicar las luces de three: acá el objetivo es un
// low-poly legible a 60px, no una simulación. El ambiente alto evita que las
// caras a contraluz se pierdan contra el fondo oscuro del mapa.
// El sombreado no multiplica hacia el negro, que es lo que haría un Lambert
// clásico: bajarle el brillo al amarillo de marca (#f9cd4a) lo desatura a
// marrón, porque su canal azul ya está muy bajo y es el primero que se apaga.
// En cambio se comprime el rango — nada baja de SOMBRA — y las caras que miran
// a la luz se levantan mezclando hacia el blanco. Da volumen sin perder el
// color de marca.
const SOMBRA = 0.82;
const BRILLO = 0.08;
const LUZ = new Vector3(-0.35, 0.75, 0.56).normalize();

/** Redondeo para agrupar normales y detectar vértices repetidos. */
const EPS = 4;

type Poligono = {
    puntos: [number, number][];
    color: string;
    profundidad: number;
};

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Aplica el sombreado plano a un color base y lo devuelve como hex. */
function sombrear(base: { r: number; g: number; b: number }, normal: Vector3): string {
    const inc = Math.max(0, normal.dot(LUZ));
    const factor = SOMBRA + (1 - SOMBRA) * inc;
    const alza = BRILLO * inc;
    const canal = (c: number) =>
        Math.round(clamp01(c * factor + alza) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${canal(base.r)}${canal(base.g)}${canal(base.b)}`;
}

function claveVertice(v: Vector3): string {
    return `${v.x.toFixed(EPS)},${v.y.toFixed(EPS)},${v.z.toFixed(EPS)}`;
}

/**
 * Une triángulos coplanares en un solo polígono.
 *
 * Sin esto cada cara de un cubo sale como dos triángulos y cada tapa de rueda
 * como un abanico de doce: además de triplicar el peso del archivo, el
 * antialiasing deja costuras claras en las diagonales internas. El método es el
 * clásico: las aristas interiores aparecen dos veces y se cancelan, y las que
 * quedan una sola vez forman el contorno.
 *
 * Devuelve `null` si el contorno no cierra en un único anillo — geometría con
 * agujeros o tocándose en un punto —, y ahí el que llama emite los triángulos
 * tal cual, que siempre es correcto aunque pese más.
 */
function unirCoplanares(triangulos: Vector3[][]): Vector3[] | null {
    const aristas = new Map<string, { a: Vector3; b: Vector3; veces: number }>();

    for (const tri of triangulos) {
        for (let i = 0; i < 3; i++) {
            const a = tri[i];
            const b = tri[(i + 1) % 3];
            const ka = claveVertice(a);
            const kb = claveVertice(b);
            const clave = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
            const previa = aristas.get(clave);
            if (previa) previa.veces++;
            else aristas.set(clave, { a, b, veces: 1 });
        }
    }

    const borde = [...aristas.values()].filter((e) => e.veces === 1);
    if (borde.length < 3) return null;

    // Adyacencia sobre las aristas de contorno.
    const vecinos = new Map<string, { destino: Vector3; usada: boolean }[]>();
    const registrar = (desde: Vector3, hacia: Vector3) => {
        const k = claveVertice(desde);
        if (!vecinos.has(k)) vecinos.set(k, []);
        vecinos.get(k)?.push({ destino: hacia, usada: false });
    };
    for (const e of borde) {
        registrar(e.a, e.b);
        registrar(e.b, e.a);
    }

    // Cada vértice del contorno tiene que tener exactamente dos vecinos; si
    // alguno tiene más, el "anillo" se cruza a sí mismo y no se puede ordenar.
    for (const lista of vecinos.values()) {
        if (lista.length !== 2) return null;
    }

    const inicio = borde[0].a;
    const anillo: Vector3[] = [inicio];
    let actual = inicio;
    let anterior = "";

    for (let paso = 0; paso < borde.length; paso++) {
        const k = claveVertice(actual);
        const salidas = vecinos.get(k);
        if (!salidas) return null;
        const siguiente = salidas.find(
            (s) => claveVertice(s.destino) !== anterior,
        );
        if (!siguiente) return null;

        anterior = k;
        actual = siguiente.destino;
        if (claveVertice(actual) === claveVertice(inicio)) {
            return anillo.length === borde.length ? anillo : null;
        }
        anillo.push(actual);
    }

    return null;
}

/** Extrae los polígonos visibles del bondi orientado a `bearing`. */
function poligonosPara(bearing: number): Poligono[] {
    const slot = crearSlot();
    aplicarOrientacion(slot, bearing);
    slot.holder.updateMatrixWorld(true);

    // Se agrupa por malla y por normal: dos caras del mismo color pero con
    // distinta orientación reciben distinta luz y no se pueden fusionar.
    const grupos = new Map<
        string,
        { tris: Vector3[][]; normal: Vector3; color: string }
    >();

    slot.holder.traverse((obj) => {
        if (!(obj instanceof Mesh)) return;

        const geo = obj.geometry;
        const pos = geo.attributes.position;
        const nor = geo.attributes.normal;
        const indice = geo.index;
        const material = obj.material;
        const base = Array.isArray(material) ? material[0] : material;
        const color = "color" in base ? base.color : null;
        if (!color) return;

        const cuenta = indice ? indice.count : pos.count;
        const normalMundo = new Vector3();

        for (let i = 0; i < cuenta; i += 3) {
            const ia = indice ? indice.getX(i) : i;
            const ib = indice ? indice.getX(i + 1) : i + 1;
            const ic = indice ? indice.getX(i + 2) : i + 2;

            const va = new Vector3().fromBufferAttribute(pos, ia).applyMatrix4(obj.matrixWorld);
            const vb = new Vector3().fromBufferAttribute(pos, ib).applyMatrix4(obj.matrixWorld);
            const vc = new Vector3().fromBufferAttribute(pos, ic).applyMatrix4(obj.matrixWorld);

            normalMundo
                .fromBufferAttribute(nor, ia)
                .transformDirection(obj.matrixWorld);

            // La cámara mira desde +Z: lo que apunta para el otro lado no se ve.
            if (normalMundo.z <= 0.0001) continue;

            const claveNormal = `${normalMundo.x.toFixed(2)},${normalMundo.y.toFixed(2)},${normalMundo.z.toFixed(2)}`;
            const clave = `${obj.uuid}|${claveNormal}`;

            let grupo = grupos.get(clave);
            if (!grupo) {
                grupo = {
                    tris: [],
                    normal: normalMundo.clone(),
                    color: sombrear(color, normalMundo),
                };
                grupos.set(clave, grupo);
            }
            grupo.tris.push([va, vb, vc]);
        }
    });

    const salida: Poligono[] = [];
    const aPoligono = (verts: Vector3[], color: string): Poligono => ({
        puntos: verts.map((v) => [v.x, v.y] as [number, number]),
        color,
        // Painter: se pinta de atrás para adelante. Con caras planas separadas
        // el promedio en Z alcanza; no hay geometría que se interpenetre.
        profundidad: verts.reduce((s, v) => s + v.z, 0) / verts.length,
    });

    for (const grupo of grupos.values()) {
        const anillo = unirCoplanares(grupo.tris);
        if (anillo) {
            salida.push(aPoligono(anillo, grupo.color));
        } else {
            for (const tri of grupo.tris) salida.push(aPoligono(tri, grupo.color));
        }
    }

    salida.sort((a, b) => a.profundidad - b.profundidad);
    return salida;
}

// ── Generación de la hoja ────────────────────────────────────────────────────

const cuadros = Array.from({ length: ANGULOS }, (_, i) =>
    poligonosPara((360 / ANGULOS) * i),
);

// El cuadro tiene que ser cuadrado y estar centrado en el origen del modelo,
// que es el punto GPS: así el ancla del marcador es siempre el centro de la
// celda, sin importar hacia dónde mire el bondi.
let alcance = 0;
for (const cuadro of cuadros) {
    for (const p of cuadro) {
        for (const [x, y] of p.puntos) {
            alcance = Math.max(alcance, Math.abs(x), Math.abs(y));
        }
    }
}
const CELDA = Math.ceil(alcance * PX_POR_METRO + MARGEN) * 2;
const CENTRO = CELDA / 2;
const FILAS = Math.ceil(ANGULOS / COLUMNAS);

const partes: string[] = [];
partes.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CELDA * COLUMNAS}" height="${CELDA * FILAS}" viewBox="0 0 ${CELDA * COLUMNAS} ${CELDA * FILAS}">`,
);
partes.push(
    `<!-- Generado por scripts/render-bus-sprites.ts — no editar a mano. ${ANGULOS} orientaciones, ${360 / ANGULOS}° entre cuadros. -->`,
);

cuadros.forEach((cuadro, i) => {
    const col = i % COLUMNAS;
    const fila = Math.floor(i / COLUMNAS);
    const ox = col * CELDA + CENTRO;
    const oy = fila * CELDA + CENTRO;

    partes.push(`<g id="b${i}">`);
    for (const p of cuadro) {
        const d = p.puntos
            .map(([x, y], j) => {
                // El eje Y del modelo apunta hacia arriba y el del SVG hacia
                // abajo, de ahí el signo.
                const sx = (ox + x * PX_POR_METRO).toFixed(1);
                const sy = (oy - y * PX_POR_METRO).toFixed(1);
                return `${j === 0 ? "M" : "L"}${sx} ${sy}`;
            })
            .join("");
        // El borde del mismo color tapa las costuras que deja el antialiasing
        // entre polígonos vecinos.
        partes.push(
            `<path d="${d}Z" fill="${p.color}" stroke="${p.color}" stroke-width=".5"/>`,
        );
    }
    partes.push(`</g>`);
});

partes.push("</svg>");

const svg = partes.join("");
const destinoSvg = resolve(process.cwd(), "public", "bondi-sprites.svg");
writeFileSync(destinoSvg, svg, "utf8");

// El marcador necesita saber cómo está armada la hoja para elegir el cuadro y
// escalarlo. Se emite desde acá en vez de hardcodearlo del otro lado: si
// cambian las proporciones del modelo o la cantidad de ángulos, las dos puntas
// se mueven juntas y el desfasaje es imposible.
const meta = `// Generado por scripts/render-bus-sprites.ts — no editar a mano.
// Regenerar con: bun run render-sprites

/** Cómo está armado \`public/bondi-sprites.svg\`. */
export const SPRITE = {
    url: "/bondi-sprites.svg",
    /** Orientaciones en la hoja, empezando por el norte y en sentido horario. */
    angulos: ${ANGULOS},
    columnas: ${COLUMNAS},
    filas: ${FILAS},
    /** Lado de cada cuadro, en píxeles de autoría. */
    celda: ${CELDA},
    /** Largo del bondi dentro del cuadro, en píxeles de autoría. */
    largoBus: ${(BUS_LARGO_MODELO * PX_POR_METRO).toFixed(2)},
} as const;
`;
const destinoMeta = resolve(process.cwd(), "shared", "map", "bus", "spriteMeta.ts");
writeFileSync(destinoMeta, meta, "utf8");

const polis = cuadros.reduce((s, c) => s + c.length, 0);
console.log(`${destinoSvg}`);
console.log(`  ${ANGULOS} orientaciones · celda ${CELDA}px · ${polis} polígonos`);
console.log(`  ${(svg.length / 1024).toFixed(1)} KB sin comprimir`);
console.log(`${destinoMeta}`);
