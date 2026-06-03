"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLOR_LIGHT = "#f7f7f4";
const THEME_COLOR_DARK = "#0f2d4a";

/** Actualiza theme-color para que coincida con el tema resuelto (p. ej. barra del navegador en móvil). */
export function ThemeColorMeta() {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!resolvedTheme) return;
        const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
        let meta = document.querySelector(
            'meta[name="theme-color"][data-bondimdp-resolved="true"]'
        ) as HTMLMetaElement | null;
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            meta.setAttribute("data-bondimdp-resolved", "true");
            document.head.appendChild(meta);
        }
        meta.content = color;
    }, [resolvedTheme]);

    return null;
}
