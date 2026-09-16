"use client";

import { useEffect, useRef } from "react";
import { cn } from "@shared/utils";
import { ADSENSE_CLIENT, AdSenseScript } from "./AdSenseScript";

declare global {
    interface Window {
        adsbygoogle?: unknown[];
    }
}

/**
 * Bloque manual de AdSense. Sin `slot` no renderiza ni carga el script.
 *
 * - `banner`: alto fijo 100px (mobile banner). Evita los cuadrados ~400px que
 *   `auto` + full-width-responsive suelen servir en pantallas angostas.
 * - `auto`: deja que Google elija (puede ser grande; útil en fichas largas).
 */
export function AdSenseUnit({
    slot,
    className,
    variant = "auto",
}: {
    slot: string | undefined;
    className?: string;
    variant?: "auto" | "banner";
}) {
    const insRef = useRef<HTMLModElement>(null);
    const banner = variant === "banner";

    useEffect(() => {
        const ins = insRef.current;
        // Pedir de nuevo un <ins> ya procesado tira error (StrictMode, remount).
        if (!slot || !ins || ins.dataset.adsbygoogleStatus) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // Bloqueador de anuncios o script caído: el bloque queda vacío.
        }
    }, [slot]);

    if (!slot) return null;

    return (
        <>
            <AdSenseScript />
            <ins
                ref={insRef}
                className={cn("adsbygoogle data-[ad-status=unfilled]:hidden!", className)}
                style={
                    banner
                        ? { display: "block", width: "100%", height: "100px", minHeight: "100px", maxHeight: "100px" }
                        : { display: "block" }
                }
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={slot}
                data-ad-format={banner ? "horizontal" : "auto"}
                data-full-width-responsive={banner ? "false" : "true"}
            />
        </>
    );
}
