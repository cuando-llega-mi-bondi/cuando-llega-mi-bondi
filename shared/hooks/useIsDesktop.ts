"use client";

import { useSyncExternalStore } from "react";

/**
 * True cuando el viewport es ≥1024px (breakpoint `lg` de Tailwind).
 *
 * Usar SOLO donde el árbol de componentes difiere entre mobile y desktop
 * (ej: bottom-sheet vs panel docked). Para layout puro preferir clases `lg:`.
 *
 * El snapshot de servidor es `false` (mobile-first): los componentes que
 * dependen de este hook se montan tras interacción del usuario, por lo que
 * no hay mismatch de hidratación visible.
 */

const QUERY = "(min-width: 1024px)";

function subscribe(onStoreChange: () => void): () => void {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onStoreChange);
    return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
    return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
    return false;
}

export function useIsDesktop(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
