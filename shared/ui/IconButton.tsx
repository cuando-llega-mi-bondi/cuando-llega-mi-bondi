import type { ButtonHTMLAttributes } from "react";
import { cn } from "@shared/utils";

type IconButtonTone = "default" | "active" | "success";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    tone?: IconButtonTone;
}

const toneClasses: Record<IconButtonTone, string> = {
    default:
        "border-border bg-card text-muted-foreground hover:border-secondary hover:text-foreground",
    active: "border-secondary/30 bg-secondary/10 text-secondary",
    success: "border-success/50 bg-success/10 text-success",
};

/**
 * Botón circular de ícono único (44px, el mínimo táctil del design system).
 * Un solo tamaño/tratamiento para que cerrar, guardar, compartir y refrescar
 * se lean como el mismo lenguaje visual — sólo cambia el ícono y el tono.
 */
export function IconButton({ tone = "default", className, type = "button", ...props }: IconButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border p-0 transition-colors active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
                toneClasses[tone],
                className,
            )}
            {...props}
        />
    );
}
