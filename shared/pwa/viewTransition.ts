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

type StartViewTransition = (
    cb: () => void | Promise<void>,
) => { finished: Promise<void> };

export function withViewTransition(updater: () => void): void {
    if (typeof document === "undefined") {
        updater();
        return;
    }
    const start = (
        document as unknown as { startViewTransition?: StartViewTransition }
    ).startViewTransition;
    if (typeof start === "function") {
        start.call(document, () => {
            flushSync(updater);
        });
    } else {
        updater();
    }
}
