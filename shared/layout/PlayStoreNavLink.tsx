"use client";

import { PLAY_STORE_URL } from "@shared/play/playStore";
import { useIsAndroidBrowser } from "@shared/play/useIsAndroidBrowser";
import { cn } from "@shared/utils";

type PlayStoreNavLinkProps = {
    /** `compact` = chip del header mobile; `row` = ítem de sidebar. */
    variant?: "compact" | "row";
    className?: string;
};

/**
 * Acceso permanente a Google Play (solo Android browser).
 * No se oculta al cerrar el modal/banner.
 */
export function PlayStoreNavLink({ variant = "compact", className }: PlayStoreNavLinkProps) {
    const android = useIsAndroidBrowser();
    if (!android) return null;

    if (variant === "row") {
        return (
            <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "flex items-center gap-3.5 rounded-xl px-4 py-3 font-sans text-[14px] font-medium tracking-tight text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
                    className,
                )}
            >
                <PlayGlyph className="h-[22px] w-[22px] shrink-0 text-amarillo" />
                <span>Google Play</span>
            </a>
        );
    }

    return (
        <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Descargar en Google Play"
            title="Google Play"
            className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-amarillo/40 bg-amarillo/10 px-3 font-sans text-[12px] font-bold tracking-tight text-foreground transition-colors hover:border-amarillo hover:bg-amarillo/20",
                className,
            )}
        >
            <PlayGlyph className="h-3.5 w-3.5 text-amarillo" />
            Play
        </a>
    );
}

function PlayGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
            <path d="M8 5.14v13.72c0 .55.6.9 1.07.62l11.03-6.86a.72.72 0 000-1.24L9.07 4.52A.72.72 0 008 5.14z" />
        </svg>
    );
}
