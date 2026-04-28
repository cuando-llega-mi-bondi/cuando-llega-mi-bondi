"use client";

import { useCallback, useEffect, useState } from "react";
import { IconBus } from "./icons/IconBus";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua);
    const iPadOS = ua.includes("mac") && "ontouchend" in document;
    return iOS || iPadOS;
}

function wasRecentlyDismissed(): boolean {
    try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        const at = Number(raw);
        if (!Number.isFinite(at)) return false;
        return Date.now() - at < DISMISS_TTL_MS;
    } catch {
        return false;
    }
}

export function InstallPwaPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIosHint, setShowIosHint] = useState(false);
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        if (wasRecentlyDismissed()) return;

        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        const onInstalled = () => {
            setVisible(false);
            setDeferred(null);
            try {
                localStorage.removeItem(DISMISS_KEY);
            } catch {
                // ignore
            }
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);

        if (isIos()) {
            const t = window.setTimeout(() => {
                setShowIosHint(true);
                setVisible(true);
            }, 1500);
            return () => {
                window.clearTimeout(t);
                window.removeEventListener("beforeinstallprompt", onBeforeInstall);
                window.removeEventListener("appinstalled", onInstalled);
            };
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
        try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            // ignore
        }
    }, []);

    const install = useCallback(async () => {
        if (!deferred) return;
        setInstalling(true);
        try {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === "accepted") {
                setVisible(false);
            } else {
                dismiss();
            }
        } finally {
            setDeferred(null);
            setInstalling(false);
        }
    }, [deferred, dismiss]);

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Instalar aplicación"
            className="fixed inset-x-3 bottom-3 z-1000 mx-auto max-w-md rounded-2xl border border-border bg-surface/95 p-3 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:bottom-4 sm:left-auto sm:w-88"
        >
            <div className="flex items-start gap-3">
                <div
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-2"
                >
                    <IconBus />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-display text-[0.95rem] font-semibold leading-tight text-text">
                        Instalá CuándoLlega
                    </p>
                    {showIosHint ? (
                        <p className="mt-1 text-[0.8rem] leading-snug text-text-dim">
                            Tocá{" "}
                            <span className="font-medium text-text">Compartir</span> y luego{" "}
                            <span className="font-medium text-text">
                                Agregar a pantalla de inicio
                            </span>
                            .
                        </p>
                    ) : (
                        <p className="mt-1 text-[0.8rem] leading-snug text-text-dim">
                            Sumala a tu pantalla de inicio para abrirla más rápido y verla
                            sin barras del navegador.
                        </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                        {!showIosHint && (
                            <button
                                type="button"
                                onClick={install}
                                disabled={installing || !deferred}
                                className="rounded-full bg-accent px-3 py-1.5 text-[0.8rem] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {installing ? "Instalando…" : "Instalar"}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={dismiss}
                            className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-text-dim transition hover:text-text"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={dismiss}
                    className="-mr-1 -mt-1 rounded-md p-1 text-text-muted transition hover:text-text"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
