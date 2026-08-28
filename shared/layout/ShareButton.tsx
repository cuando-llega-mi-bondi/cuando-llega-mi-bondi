"use client";

import { useState, useCallback } from "react";
import type { Arribo } from "@features/arrivals/types";
import { IconWhatsApp } from "@shared/icons/IconWhatsApp";
import { IconCheck } from "@shared/icons/IconCheck";
import { IconButton } from "@shared/ui/IconButton";

interface ShareButtonProps {
    arribos: Arribo[];
    calleLabel?: string;        // e.g. "Independencia"
    interseccionLabel?: string; // e.g. "San Martín"
}

function buildShareText(
    arribos: Arribo[],
    calleLabel?: string,
    interseccionLabel?: string
): string {
    if (arribos.length === 0) return "";

    const ubicacion =
        calleLabel && interseccionLabel
            ? `${calleLabel} y ${interseccionLabel}`
            : calleLabel ?? "";

    const lines = arribos.slice(0, 3).map((a) => {
        const linea = a.DescripcionLinea;
        const destino = a.DescripcionCartelBandera ?? a.DescripcionBandera ?? "";
        const arribo = a.Arribo; // e.g. "8 min" or "Llegando"
        return `• Línea ${linea} (${destino}): ${arribo}`;
    });

    const header = ubicacion
        ? `Próximos colectivos en ${ubicacion}:\n`
        : `Próximos colectivos:\n`;

    // Deep-link so the recipient can check live arrivals themselves
    const url = typeof window !== "undefined" ? window.location.href : "";
    const linkLine = url ? `\nVer en vivo: ${url}` : "";

    return header + lines.join("\n") + linkLine;
}

export function ShareButton({ arribos, calleLabel, interseccionLabel }: ShareButtonProps) {
    const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

    const handleShare = useCallback(async () => {
        const text = buildShareText(arribos, calleLabel, interseccionLabel);
        if (!text) return;

        // Try native share (mobile) first
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({ text });
                setStatus("shared");
                setTimeout(() => setStatus("idle"), 2500);
                return;
            } catch {
                // User cancelled — don't fall through to clipboard
                return;
            }
        }

        // Clipboard fallback (desktop)
        try {
            await navigator.clipboard.writeText(text);
            setStatus("copied");
            setTimeout(() => setStatus("idle"), 2500);
        } catch {
            // Last-resort: prompt with text
            window.prompt("Copiá este texto:", text);
        }
    }, [arribos, calleLabel, interseccionLabel]);

    const isIdle = status === "idle";
    const isDisabled = arribos.length === 0;

    const title = isDisabled
        ? "No hay arribos para compartir"
        : status === "idle"
          ? "Compartir por WhatsApp"
          : status === "copied"
            ? "Copiado"
            : "Enviado";

    return (
        <IconButton
            id="share-parada-btn"
            onClick={handleShare}
            disabled={isDisabled}
            title={title}
            aria-label="Compartir próximos arribos"
            tone={isIdle ? "default" : "success"}
        >
            {isIdle ? <IconWhatsApp width={16} height={16} /> : <IconCheck className="h-4 w-4" />}
        </IconButton>
    );
}
