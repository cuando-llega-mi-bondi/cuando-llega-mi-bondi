import type { ElementType, ReactNode } from "react";
import { cn } from "@shared/utils";

interface PageHeaderProps {
    title: string;
    /** Palabra del título en color acento (ej: Explorar «Recorridos»). */
    highlight?: string;
    subtitle?: string;
    /** Acciones a la derecha del título (chips, botones). */
    actions?: ReactNode;
    className?: string;
    /** Nivel del heading: usar "h2" en páginas que ya tienen un h1 de SEO. */
    as?: ElementType;
}

/** Header de página compartido: mismo título/subtítulo en todas las pantallas. */
export function PageHeader({
    title,
    highlight,
    subtitle,
    actions,
    className,
    as: Heading = "h1",
}: PageHeaderProps) {
    return (
        <div className={cn("flex items-start justify-between gap-3", className)}>
            <div className="min-w-0">
                <Heading className="font-display text-[24px] font-semibold tracking-[-0.04em] text-text">
                    {title}
                    {highlight ? (
                        <>
                            {" "}
                            <span className="text-accent">{highlight}</span>
                        </>
                    ) : null}
                </Heading>
                {subtitle ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[1.4px] text-muted-foreground">
                        {subtitle}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}
