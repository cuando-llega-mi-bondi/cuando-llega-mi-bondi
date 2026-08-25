/**
 * Wrapper cross-browser sobre la View Transitions API.
 *
 * Captura snapshots del DOM antes y después del cambio de state y anima la
 * transición vía CSS (`::view-transition-old(root)` / `::view-transition-new(root)`).
 *
 * Soporte: Chrome 111+, Edge 111+, Safari 18+. En navegadores sin soporte
 * (Firefox <= 138 al momento de escribir esto) ejecuta el callback sin
 * animación — degradación silenciosa.
 *
 * `flushSync` fuerza el commit dentro del callback de `startViewTransition`
 * para que el browser tome el snapshot "después" con el DOM ya actualizado.
 */

import { flushSync } from "react-dom";

type ViewTransition = {
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    finished: Promise<void>;
};
type StartViewTransition = (cb: () => void | Promise<void>) => ViewTransition;

export function withViewTransition(updater: () => void): void {
    if (typeof document === "undefined") {
        updater();
        return;
    }
    const start = (
        document as unknown as { startViewTransition?: StartViewTransition }
    ).startViewTransition;
    if (typeof start === "function") {
        // El browser puede abortar la transición en curso — dos clicks rápidos
        // que disparan withViewTransition seguido, o el viewport cambiando de
        // tamaño a mitad de camino (ej. el teclado abriéndose/cerrándose en
        // mobile). Cuando eso pasa, `ready` rechaza con InvalidStateError
        // ("Skipping view transition...") aunque `finished` siga resolviendo
        // bien — es un abort esperado, no un bug, así que ninguna de las
        // promesas del objeto debe quedar como unhandled rejection.
        const transition = start.call(document, () => {
            flushSync(updater);
        });
        transition.ready.catch(() => {});
        transition.updateCallbackDone.catch(() => {});
        transition.finished.catch(() => {});
    } else {
        updater();
    }
}
