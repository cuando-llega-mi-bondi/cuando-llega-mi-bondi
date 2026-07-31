"use client";

import { IconX } from "@shared/icons/IconX";
import { IconAlertTriangle } from "@shared/icons/IconAlertTriangle";

interface ErrorBannerProps {
    message: string;
    onClose: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <div
            className="flex animate-slide-up items-start gap-3 rounded-xl border border-error/35 bg-error/12 px-4 py-3.5"
            role="status"
            aria-live="polite"
        >
            <span className="mt-0.5 shrink-0 text-error" aria-hidden>
                <IconAlertTriangle width={20} height={20} />
            </span>
            <div className="flex-1">
                <div className="mb-1 font-sans text-sm font-semibold tracking-[-0.01em] text-error">
                    El servidor no responde
                </div>
                <div className="font-sans text-xs leading-relaxed text-error/90">
                    {message}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center bg-transparent p-0 text-error/70 transition-colors hover:text-error"
                aria-label="Cerrar error"
            >
                <IconX />
            </button>
        </div>
    );
}