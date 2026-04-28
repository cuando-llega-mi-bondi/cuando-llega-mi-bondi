import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-skeleton-shimmer rounded-lg bg-[linear-gradient(90deg,var(--color-surface-2)_0%,rgba(255,255,255,0.06)_50%,var(--color-surface-2)_100%)] bg-[length:220%_100%]",
                className,
            )}
            {...props}
        />
    );
}
