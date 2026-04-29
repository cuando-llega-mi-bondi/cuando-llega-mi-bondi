import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "neutral" | "success" | "danger";

const badgeVariants: Record<BadgeVariant, string> = {
    accent: "bg-primary text-primary-foreground",
    neutral: "border border-border bg-muted text-muted-foreground",
    success: "border border-success/45 bg-success/15 text-success",
    danger: "border border-error/45 bg-error/15 text-error",
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
