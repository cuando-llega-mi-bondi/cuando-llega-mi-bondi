import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
};

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
    return (
        <span
            className={cn(
                "font-black uppercase italic tracking-tighter",
                sizeMap[size],
                className
            )}
        >
            BONDI<span className="text-amarillo">MDP</span>
        </span>
    );
}