"use client";

import { useEffect, useLayoutEffect } from "react";

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

/** Altura útil real; en la 1.ª pintura iOS a vece innerHeight y visualViewport difieren. */
function syncAppHeight(): void {
    const ih = window.innerHeight;
    const vvh = window.visualViewport?.height ?? 0;
    const clientH = document.documentElement.clientHeight;
    const h = Math.max(ih, vvh, clientH);
    document.documentElement.style.setProperty("--app-height", `${h}px`);
    void document.documentElement.offsetHeight;
}

/** env(safe-area-inset-bottom) puede ir en 0 en el primer frame; medimos con el mismo env en un nodo. */
function syncSafeBottomProbe(): void {
    const el = document.createElement("div");
    el.setAttribute(
        "style",
        "position:fixed;bottom:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;z-index:-1;padding-bottom:env(safe-area-inset-bottom,0px);",
    );
    document.body.appendChild(el);
    const pb = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    document.body.removeChild(el);
    document.documentElement.style.setProperty("--safe-bottom-live", `${pb}px`);
}

export function PwaViewportSync() {
    useLayoutEffect(() => {
        if (!isStandalone()) return;

        syncAppHeight();

        const bump = () => {
            syncAppHeight();
            syncSafeBottomProbe();
        };

        const raf1 = requestAnimationFrame(() => {
            bump();
            requestAnimationFrame(bump);
        });

        const timeouts = [0, 16, 50, 120, 280].map((ms) => window.setTimeout(bump, ms));

        const onResize = () => bump();
        window.addEventListener("resize", onResize);
        const vv = window.visualViewport;
        vv?.addEventListener("resize", onResize);
        vv?.addEventListener("scroll", onResize);
        window.addEventListener("orientationchange", onResize);

        const onLoad = () => bump();
        window.addEventListener("load", onLoad);
        if (document.readyState === "complete") queueMicrotask(bump);

        return () => {
            cancelAnimationFrame(raf1);
            timeouts.forEach(clearTimeout);
            window.removeEventListener("resize", onResize);
            vv?.removeEventListener("resize", onResize);
            vv?.removeEventListener("scroll", onResize);
            window.removeEventListener("orientationchange", onResize);
            window.removeEventListener("load", onLoad);
        };
    }, []);

    useEffect(() => {
        if (!isStandalone()) return;
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                syncAppHeight();
                syncSafeBottomProbe();
            }
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    return null;
}
