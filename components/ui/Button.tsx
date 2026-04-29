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
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-destructive",
    accent: "btn-secondary",
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
                "btn-pill inline-flex items-center justify-center gap-2 font-sans font-medium tracking-tight",
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
