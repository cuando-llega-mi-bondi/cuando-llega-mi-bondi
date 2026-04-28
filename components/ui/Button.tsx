import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-accent text-black border border-accent hover:opacity-90 active:scale-[0.99]",
    secondary:
        "bg-surface-2 text-text border border-border hover:border-accent/50 hover:text-accent",
    ghost:
        "bg-transparent text-text-dim border border-transparent hover:text-text hover:bg-surface-2/70",
    danger:
        "bg-danger/10 text-danger border border-danger/50 hover:bg-danger/15",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-base",
    icon: "h-11 w-11 p-0",
};

export function Button({
    variant = "secondary",
    size = "md",
    leftIcon,
    rightIcon,
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg font-display font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60",
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        >
            {leftIcon}
            {children}
            {rightIcon}
        </button>
    );
}
