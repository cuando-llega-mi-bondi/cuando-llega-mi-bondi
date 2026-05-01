import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
    children: ReactNode;
    className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
    return (
        <main
            className={cn(
                "mx-auto w-full max-w-[520px] flex-1 text-foreground",
                className,
            )}
        >
            {children}
        </main>
    );
}
