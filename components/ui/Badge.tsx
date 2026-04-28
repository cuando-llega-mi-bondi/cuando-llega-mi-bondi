import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "neutral" | "success" | "danger";

const badgeVariants: Record<BadgeVariant, string> = {
    accent: "bg-accent/15 text-accent border border-accent/40",
    neutral: "bg-surface-2 text-text-dim border border-border",
    success: "bg-success/15 text-success border border-success/40",
    danger: "bg-danger/15 text-danger border border-danger/40",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                badgeVariants[variant],
                className,
            )}
            {...props}
        />
    );
}
