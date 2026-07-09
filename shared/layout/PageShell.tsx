import type { ReactNode } from "react";
import { cn } from "@shared/utils";

interface PageShellProps {
    children: ReactNode;
    className?: string;
    /**
     * Desktop de ancho completo y alto fijo (layouts de columnas con panes que
     * scrollean por su cuenta). cn() no resuelve conflictos de Tailwind, así
     * que el ancho máximo se decide acá y no vía className.
     */
    fluid?: boolean;
    /** Desktop ancho (max-w-7xl) para layouts multi-columna. */
    wide?: boolean;
}

/**
 * Shell de página. Métricas desktop compartidas por TODAS las pantallas para
 * mantener consistencia: contenido alineado a la izquierda de la sidebar con
 * 32px de padding (--shell-px) y pt-8. En mobile: columna centrada de 520px
 * con 20px + safe areas.
 */
export function PageShell({ children, className, fluid = false, wide = false }: PageShellProps) {
    return (
        <main
            className={cn(
                "mx-auto w-full max-w-[520px] flex-1 [--shell-px:20px] px-[calc(var(--shell-px)+var(--safe-left))] pt-5 pb-nav pr-[calc(var(--shell-px)+var(--safe-right))] text-foreground lg:[--shell-px:32px] lg:mx-0 lg:pt-8",
                fluid
                    ? // flex-col para que el layout interno llene el alto con flex-1
                      // (la cadena de height:100% no resuelve: main es flex item).
                      "lg:flex lg:h-dvh lg:min-h-0 lg:max-w-none lg:flex-col lg:overflow-hidden lg:pb-8"
                    : wide
                      ? "lg:max-w-7xl lg:pb-10"
                      : "lg:max-w-4xl lg:pb-10",
                className,
            )}
        >
            {children}
        </main>
    );
}
