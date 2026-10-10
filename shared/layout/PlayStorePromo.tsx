"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconX } from "@shared/icons/IconX";
import { Modal } from "@shared/ui/Modal";
import {
    PLAY_STORE_BANNER_SNOOZE_KEY,
    PLAY_STORE_MODAL_SNOOZE_KEY,
    PLAY_STORE_URL,
    isAndroidBrowser,
    isSnoozed,
    migrateLegacyPlayStoreDismiss,
    snooze,
} from "@shared/play/playStore";

const MODAL_DELAY_MS = 1400;
const MODAL_SNOOZE_DAYS = 14;
const BANNER_SNOOZE_DAYS = 7;

/**
 * Android: modal de lanzamiento (vuelve a los 14 días) + banner sticky
 * sobre el bottom nav (vuelve a los 7). El chip del header/sidebar es permanente.
 */
export function PlayStorePromo() {
    const pathname = usePathname();
    const [modalOpen, setModalOpen] = useState(false);
    const [bannerOpen, setBannerOpen] = useState(false);

    useEffect(() => {
        if (pathname === "/android") {
            setModalOpen(false);
            setBannerOpen(false);
            return;
        }
        if (!isAndroidBrowser()) return;

        migrateLegacyPlayStoreDismiss();

        const showBanner = !isSnoozed(PLAY_STORE_BANNER_SNOOZE_KEY);
        setBannerOpen(showBanner);

        if (isSnoozed(PLAY_STORE_MODAL_SNOOZE_KEY)) return;

        const id = window.setTimeout(() => setModalOpen(true), MODAL_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [pathname]);

    const dismissModal = () => {
        setModalOpen(false);
        snooze(PLAY_STORE_MODAL_SNOOZE_KEY, MODAL_SNOOZE_DAYS);
    };

    const dismissBanner = () => {
        setBannerOpen(false);
        snooze(PLAY_STORE_BANNER_SNOOZE_KEY, BANNER_SNOOZE_DAYS);
    };

    return (
        <>
            <Modal open={modalOpen} onClose={dismissModal} className="animate-slide-up">
                <button
                    type="button"
                    onClick={dismissModal}
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
                        onClick={dismissModal}
                        className="btn-pill btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-[15px] font-semibold"
                    >
                        Abrir en Google Play
                    </a>
                    <button
                        type="button"
                        onClick={dismissModal}
                        className="btn-pill btn-ghost inline-flex min-h-11 w-full items-center justify-center px-5 text-[13px] font-medium text-muted-foreground"
                    >
                        Seguir en la web
                    </button>
                </div>
            </Modal>

            {bannerOpen && !modalOpen ? (
                <div
                    className="fixed inset-x-0 z-[90] px-3 lg:hidden"
                    style={{
                        bottom:
                            "calc(var(--nav-height) + max(env(safe-area-inset-bottom, 0px), var(--safe-bottom-live, 0px)) + 8px)",
                    }}
                    role="region"
                    aria-label="Descargar Bondi MDP en Google Play"
                >
                    <div className="mx-auto flex max-w-[520px] items-center gap-2 rounded-2xl border border-amarillo/35 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-md">
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1"
                        >
                            <p className="truncate font-sans text-[13px] font-semibold text-foreground">
                                App en Google Play
                            </p>
                            <p className="truncate font-sans text-[11px] text-muted-foreground">
                                Descargala gratis · tocá acá
                            </p>
                        </a>
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-pill btn-primary shrink-0 px-3.5 text-[12px] font-bold"
                        >
                            Instalar
                        </a>
                        <button
                            type="button"
                            onClick={dismissBanner}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Ocultar aviso por ahora"
                        >
                            <IconX size={16} />
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
