/**
 * Malla low-poly del bondi, construida proceduralmente.
 *
 * Sin GLTF ni texturas a propósito: un modelo externo agregaría el loader
 * (~15KB) más un fetch bloqueante antes de poder dibujar el primer arribo.
 * A este tamaño en pantalla (30-90px) la geometría por código se ve igual y
 * arranca en el mismo frame en que se crea la escena.
 *
 * Sistema de coordenadas local, en metros:
 *   +X = trompa (adelante)   +Y = lado izquierdo   +Z = arriba
 * El piso queda en Z=0, así el bondi se apoya sobre el punto GPS.
 */

import {
    BoxGeometry,
    CylinderGeometry,
    Group,
    Mesh,
    MeshLambertMaterial,
    type BufferGeometry,
    type Material,
} from "three";

/**
 * Proporciones caricaturizadas, no reales.
 *
 * Un urbano de verdad mide 12m × 2,55m: una relación de 4,7 a 1 que a 60px en
 * pantalla se lee como un tablón, y que mirando de frente o de contramano se
 * reduce a una tira vertical irreconocible. Achatando la relación a ~2,8 a 1 y
 * subiendo el techo, el bondi se sigue leyendo como bondi en las 16
 * orientaciones. Las unidades son arbitrarias: lo único que importa es la
 * proporción, porque el runtime escala el largo del modelo a píxeles.
 */
const LARGO = 8.4;
const ANCHO = 3;
const ALTO_CAJA = 2.9;
const RUEDA_R = 0.72;
const RUEDA_ANCHO = 0.36;
/** El piso de la carrocería arranca arriba de las ruedas. */
const PISO = RUEDA_R * 2 - 0.12;

// Paleta de DESIGN.md. Amarillo como carrocería: es el color de marca y el
// único que se lee de un vistazo sobre el mapa oscuro (#090909) sin competir
// con el azul del recorrido.
const AMARILLO = 0xf9cd4a;
// El techo es la superficie más grande que se ve desde arriba: si además del
// sombreado lleva un amarillo más oscuro, el bondi entero se lee anaranjado.
// Va el mismo color que la carrocería y la diferencia la hace la luz.
const AMARILLO_TECHO = 0xf9cd4a;
const NAVY = 0x0f2d4a;
const NEGRO = 0x121212;
const BLANCO = 0xf0f4f8;
const ROJO = 0xef4444;

/**
 * Geometrías y materiales se comparten entre todos los bondis de la escena:
 * son idénticos y crear uno por marcador multiplicaría las llamadas de dibujo
 * sin cambiar un pixel. Se crean en el primer uso y se liberan con
 * `disposeBusResources()` cuando se destruye el overlay.
 */
type Recursos = {
    geo: Record<string, BufferGeometry>;
    mat: Record<string, Material>;
};

let recursos: Recursos | null = null;
/**
 * Cuántos overlays están usando los recursos compartidos. Sin esto, un mapa
 * que se desmonta liberaría la geometría que otro sigue dibujando (pasa al
 * navegar entre /consultar y /recorrido con los dos mapas vivos un instante).
 */
let usuarios = 0;

function getRecursos(): Recursos {
    if (recursos) return recursos;

    const geo: Record<string, BufferGeometry> = {
        caja: new BoxGeometry(LARGO, ANCHO, ALTO_CAJA),
        techo: new BoxGeometry(LARGO - 0.45, ANCHO - 0.22, 0.2),
        // Dos ventanas por lado en vez de un ventanal corrido: a 60px una
        // banda oscura larga se lee como una franja de pintura, no como
        // vidrios. El corte del medio es lo que da la lectura de "ómnibus".
        ventana: new BoxGeometry((LARGO - 3.2) / 2, 0.07, 1.15),
        parabrisas: new BoxGeometry(0.09, ANCHO - 0.72, 1.25),
        franja: new BoxGeometry(LARGO - 0.25, 0.06, 0.2),
        faro: new BoxGeometry(0.11, 0.5, 0.34),
        // 10 lados alcanzan a este tamaño y bajan el conteo de polígonos del
        // sprite, que es lo que domina el peso del archivo.
        rueda: new CylinderGeometry(RUEDA_R, RUEDA_R, RUEDA_ANCHO, 10),
    };

    const mat: Record<string, Material> = {
        carroceria: new MeshLambertMaterial({ color: AMARILLO }),
        techo: new MeshLambertMaterial({ color: AMARILLO_TECHO }),
        vidrio: new MeshLambertMaterial({ color: NAVY }),
        franja: new MeshLambertMaterial({ color: NAVY }),
        goma: new MeshLambertMaterial({ color: NEGRO }),
        // `emissive` para que los faros no se apaguen en la cara que queda a
        // contraluz: son puntos de 3px, si dependen del direccional desaparecen.
        faro: new MeshLambertMaterial({ color: BLANCO, emissive: BLANCO, emissiveIntensity: 0.55 }),
        baliza: new MeshLambertMaterial({ color: ROJO, emissive: ROJO, emissiveIntensity: 0.45 }),
    };

    recursos = { geo, mat };
    return recursos;
}

/** Un bondi listo para agregar a la escena. Comparte geometría con el resto. */
export function createBusMesh(): Group {
    const { geo, mat } = getRecursos();
    const bus = new Group();

    const centroCaja = PISO + ALTO_CAJA / 2;

    const caja = new Mesh(geo.caja, mat.carroceria);
    caja.position.z = centroCaja;
    bus.add(caja);

    const techo = new Mesh(geo.techo, mat.techo);
    techo.position.z = PISO + ALTO_CAJA + 0.06;
    bus.add(techo);

    // Ventanas: dos por lado, apenas por fuera de la carrocería para que no
    // haya z-fighting con la cara de la caja.
    const anchoVentana = (LARGO - 3.2) / 2;
    for (const lado of [1, -1]) {
        for (const signo of [1, -1]) {
            const ventana = new Mesh(geo.ventana, mat.vidrio);
            ventana.position.set(
                -0.35 + signo * (anchoVentana / 2 + 0.22),
                (lado * (ANCHO + 0.07)) / 2,
                centroCaja + 0.48,
            );
            bus.add(ventana);
        }

        const franja = new Mesh(geo.franja, mat.franja);
        franja.position.set(0, (lado * (ANCHO + 0.05)) / 2, PISO + 0.46);
        bus.add(franja);
    }

    const parabrisas = new Mesh(geo.parabrisas, mat.vidrio);
    parabrisas.position.set(LARGO / 2 + 0.02, 0, centroCaja + 0.48);
    bus.add(parabrisas);

    // Luneta. Sin ella el cuadro del bondi yendo al norte —donde se le ve la
    // cola— queda como un bloque amarillo liso, y las calles norte-sur son
    // media Mar del Plata.
    const luneta = new Mesh(geo.parabrisas, mat.vidrio);
    luneta.position.set(-LARGO / 2 - 0.02, 0, centroCaja + 0.48);
    bus.add(luneta);

    // Faros adelante, balizas atrás.
    for (const lado of [1, -1]) {
        const faro = new Mesh(geo.faro, mat.faro);
        faro.position.set(LARGO / 2 + 0.02, (lado * (ANCHO - 0.7)) / 2, PISO + 0.34);
        bus.add(faro);

        const baliza = new Mesh(geo.faro, mat.baliza);
        baliza.position.set(-LARGO / 2 - 0.02, (lado * (ANCHO - 0.7)) / 2, PISO + 0.34);
        bus.add(baliza);
    }

    // Cuatro ruedas. El cilindro nace con el eje en +Y, que es justo el eje
    // transversal del bondi, así que no hace falta rotarlo.
    for (const x of [LARGO / 2 - 1.5, -LARGO / 2 + 1.7]) {
        for (const lado of [1, -1]) {
            const rueda = new Mesh(geo.rueda, mat.goma);
            rueda.position.set(x, (lado * (ANCHO - RUEDA_ANCHO)) / 2, RUEDA_R);
            bus.add(rueda);
        }
    }

    return bus;
}

/**
 * Largo del modelo en sus propias unidades. El render de sprites lo usa para
 * fijar la escala de autoría, y el marcador para saber a cuántos píxeles
 * corresponde. No son metros: ver el comentario de las proporciones.
 */
export const BUS_LARGO_MODELO = LARGO;

/** Registra un overlay como usuario de los recursos compartidos. */
export function acquireBusResources(): void {
    usuarios++;
    getRecursos();
}

/**
 * Libera geometrías y materiales compartidos cuando no queda ningún overlay
 * usándolos. Los `Group` que devuelve `createBusMesh` no son dueños de nada:
 * alcanza con sacarlos de la escena.
 */
export function releaseBusResources(): void {
    usuarios = Math.max(0, usuarios - 1);
    if (usuarios > 0 || !recursos) return;
    for (const g of Object.values(recursos.geo)) g.dispose();
    for (const m of Object.values(recursos.mat)) m.dispose();
    recursos = null;
}
