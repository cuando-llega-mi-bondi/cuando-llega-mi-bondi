import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl bg-surface shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px,0_10px_28px_rgba(0,0,0,0.45)]",
                className,
            )}
            {...props}
        />
    );
}
