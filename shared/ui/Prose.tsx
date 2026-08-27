import type { ReactNode } from "react";
import { cn } from "@shared/utils";

/**
 * Wrapper de cuerpo largo — implementa la escala "Body Readable" de DESIGN.md
 * §3 (14px/400/line-height 1.6) para contenido tipo blog/artículo.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "max-w-[660px] text-[14px] leading-[1.6] text-muted-foreground",
                "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground",
                "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground",
                "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
                "[&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-foreground",
                "[&_strong]:text-foreground [&_strong]:font-semibold",
                className,
            )}
        >
            {children}
        </div>
    );
}
