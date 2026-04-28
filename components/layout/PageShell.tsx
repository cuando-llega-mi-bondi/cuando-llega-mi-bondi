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
                "mx-auto w-full max-w-[520px] flex-1 px-[calc(20px+env(safe-area-inset-left,0px))] pt-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pr-[calc(20px+env(safe-area-inset-right,0px))] text-text",
                className,
            )}
        >
            {children}
        </main>
    );
}
