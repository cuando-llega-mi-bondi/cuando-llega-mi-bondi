"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconX } from "@shared/icons/IconX";
import { Modal } from "@shared/ui/Modal";
import { PLAY_STORE_URL } from "@shared/play/playStore";

const STORAGE_KEY = "bondi:play-store-promo-v1";
const SHOW_DELAY_MS = 1400;

/** Android Chrome/Firefox/etc. Excluye WebViews (app nativa ya instalada). */
function isAndroidBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    if (!/Android/i.test(ua)) return false;
    // Chrome WebView marca `; wv)` — no molestar si ya están en la app.
    if (/; wv\)/i.test(ua)) return false;
    return true;
}

function wasDismissed(): boolean {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return true;
    }
}

function persistDismiss(): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
        // modo privado / cuota: igual cerramos esta sesión
    }
}

/**
 * Aviso one-shot para Android: ya estamos en Google Play.
 * Se oculta en /android, en WebViews nativos y si el usuario lo cerró.
 */
export function PlayStorePromo() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (pathname === "/android") return;
        if (!isAndroidBrowser()) return;
        if (wasDismissed()) return;

        const id = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [pathname]);

    const dismiss = () => {
        setOpen(false);
        persistDismiss();
    };

    return (
        <Modal open={open} onClose={dismiss} className="animate-slide-up">
            <button
                type="button"
                onClick={dismiss}
                className="absolute right-4 top-4 cursor-pointer rounded-full border border-border bg-muted p-1 text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                aria-label="Cerrar"
            >
                <IconX size={20} />
            </button>

            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amarillo">
                Novedad
            </p>
            <h2 className="mb-2 pr-8 font-display text-[22px] font-medium tracking-[-1px] text-foreground">
                Bondi MDP ya está en Google Play
            </h2>
            <p className="mb-6 font-sans text-sm leading-relaxed text-muted-foreground">
                Descargá la app nativa gratis. Seguí pudiendo usar la web o instalarla como PWA
                desde el navegador.
            </p>

            <div className="flex flex-col gap-2.5">
                <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={dismiss}
                    className="btn-pill btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-[15px] font-semibold"
                >
                    Abrir en Google Play
                </a>
                <button
                    type="button"
                    onClick={dismiss}
                    className="btn-pill btn-ghost inline-flex min-h-11 w-full items-center justify-center px-5 text-[13px] font-medium text-muted-foreground"
                >
                    Seguir en la web
                </button>
            </div>
        </Modal>
    );
}
