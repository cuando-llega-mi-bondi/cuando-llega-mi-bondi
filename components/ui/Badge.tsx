import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "neutral" | "success" | "danger";

const badgeVariants: Record<BadgeVariant, string> = {
    accent: "border border-accent/45 bg-accent/18 text-accent",
    neutral: "border border-white/12 bg-white/8 text-text-dim",
    success: "border border-success/45 bg-success/14 text-success",
    danger: "border border-danger/45 bg-danger/14 text-danger",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[11px] font-medium tracking-[-0.01em]",
                badgeVariants[variant],
                className,
            )}
            {...props}
        />
    );
}
