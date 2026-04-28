import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-surface shadow-[0_6px_22px_rgba(0,0,0,0.22)]",
                className,
            )}
            {...props}
        />
    );
}
