"use client";

import { useState, useCallback } from "react";
import type { Arribo } from "@/lib/types";
import { cn } from "@/lib/utils";

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

    if (arribos.length === 0) return null;

    const isIdle = status === "idle";

    return (
        <button
            id="share-parada-btn"
            onClick={handleShare}
            title="Compartir por WhatsApp"
            aria-label="Compartir próximos arribos"
            className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 font-sans text-[12px] font-medium tracking-[-0.01em] transition",
                isIdle
                    ? "border-border bg-muted text-muted-foreground hover:border-secondary hover:text-foreground"
                    : "border-success/50 bg-success/10 text-success",
            )}
        >
            <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="shrink-0"
            >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>

            {status === "idle"
                ? "COMPARTIR"
                : status === "copied"
                ? "✓ COPIADO"
                : "✓ ENVIADO"}
        </button>
    );
}
