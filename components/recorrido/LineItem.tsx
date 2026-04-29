import type { Linea } from "@/lib/types";

interface LineItemProps {
    line: Linea;
    onSelect: (line: Linea) => void;
}

export function LineItem({ line, onSelect }: LineItemProps) {
    const desc = line.Descripcion.trim();

    return (
        <button
            onClick={() => onSelect(line)}
            className="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-xl bg-card border border-border px-3.5 py-3 text-left transition hover:-translate-y-px hover:bg-muted hover:border-secondary hover:shadow-sm"
        >
            <div className="flex h-10 min-w-[52px] flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted font-display text-[17px] font-medium tracking-tight text-foreground">
                {line.CodigoLineaParada}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-sm font-semibold text-foreground">
                    {desc}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    Ver recorrido en mapa
                </div>
            </div>

            <svg
                className="shrink-0 text-muted-foreground"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </button>
    );
}
