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
 * - `banner`: 100px fijos (mobile). Sin full-width-responsive para no inflar.
 * - `auto`: Google elige el tamaño (fichas largas / recorrido).
 *
 * Importante: este nodo tiene que quedarse montado. Remount = nuevo push =
 * parpadeo / unfilled. No lo gates con loading de datos.
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
    const pushedRef = useRef(false);
    const banner = variant === "banner";

    useEffect(() => {
        if (!slot) return;
        const ins = insRef.current;
        if (!ins || pushedRef.current || ins.dataset.adsbygoogleStatus) return;

        const push = () => {
            if (pushedRef.current || !insRef.current) return;
            if (insRef.current.dataset.adsbygoogleStatus) {
                pushedRef.current = true;
                return;
            }
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushedRef.current = true;
            } catch {
                // Adblock / script aún no listo — reintentamos en el listener.
            }
        };

        push();

        const script = document.querySelector<HTMLScriptElement>(
            'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
        );
        script?.addEventListener("load", push);
        // Por si el script ya estaba cacheado y `load` no vuelve a disparar.
        const retry = window.setTimeout(push, 500);

        return () => {
            script?.removeEventListener("load", push);
            window.clearTimeout(retry);
        };
    }, [slot]);

    if (!slot) return null;

    return (
        <>
            <AdSenseScript />
            <ins
                ref={insRef}
                className={cn(
                    "adsbygoogle",
                    // Solo ocultar el <ins> vacío; el rail padre decide el layout.
                    "data-[ad-status=unfilled]:hidden!",
                    className,
                )}
                style={
                    banner
                        ? {
                              display: "block",
                              width: "100%",
                              height: "100px",
                              maxHeight: "100px",
                          }
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

/**
 * Rail estable con label. Reserva 100px para no saltar el layout mientras carga.
 * Si Google no tiene anuncio (`unfilled`), se oculta entero.
 */
export function AdSenseRail({
    slot,
    className,
}: {
    slot: string | undefined;
    className?: string;
}) {
    if (!slot) return null;

    return (
        <aside
            aria-label="Publicidad"
            className={cn(
                "mt-5 space-y-2 has-[[data-ad-status=unfilled]]:hidden",
                className,
            )}
        >
            <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
                PUBLICIDAD
            </p>
            <div className="min-h-[100px] overflow-hidden">
                <AdSenseUnit slot={slot} variant="banner" />
            </div>
        </aside>
    );
}
