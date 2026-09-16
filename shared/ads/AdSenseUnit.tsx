"use client";

import { useEffect, useRef } from "react";
import { cn } from "@shared/utils";
import { ADSENSE_CLIENT, AdSenseScript } from "./AdSenseScript";

declare global {
    interface Window {
        adsbygoogle?: unknown[];
    }
}

export type AdSenseFormat = "auto" | "horizontal" | "rectangle" | "fluid";

/**
 * Bloque manual de AdSense (`<ins class="adsbygoogle">`). Sin `slot` no
 * renderiza nada ni carga el script: se prende recién cuando AdSense aprueba
 * el sitio y el bloque existe en el panel.
 *
 * `horizontal` pide banners bajos (mejor en mobile / form). `auto` deja que
 * Google elija y a menudo cae en cuadrados ~300–400px de alto.
 */
export function AdSenseUnit({
    slot,
    className,
    format = "auto",
}: {
    slot: string | undefined;
    className?: string;
    format?: AdSenseFormat;
}) {
    const insRef = useRef<HTMLModElement>(null);

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
                className={cn("adsbygoogle block data-[ad-status=unfilled]:hidden!", className)}
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </>
    );
}
