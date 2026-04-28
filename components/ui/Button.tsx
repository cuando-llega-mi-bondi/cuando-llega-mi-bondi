import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border border-white bg-white text-black hover:bg-white/90 active:scale-[0.99]",
    secondary:
        "border border-white/10 bg-white/10 text-white hover:border-white/20 hover:bg-white/15 active:scale-[0.99]",
    ghost:
        "border border-transparent bg-transparent text-text-dim hover:bg-[rgba(255,255,255,0.06)] hover:text-text",
    danger:
        "border border-danger/50 bg-danger/15 text-danger hover:bg-danger/20 active:scale-[0.99]",
    accent:
        "border border-accent bg-accent text-white hover:bg-accent/90 active:scale-[0.99]",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
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
                "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium tracking-[-0.01em] transition disabled:cursor-not-allowed disabled:opacity-60",
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
