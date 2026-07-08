import type { HTMLAttributes } from "react";
import { cn } from "@shared/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "card",
                className,
            )}
            {...props}
        />
    );
}
