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
            className="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition hover:border-accent/50 hover:bg-accent/5"
        >
            <div className="flex h-10 min-w-[52px] flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-display text-[17px] font-black tracking-[0.5px] text-accent">
                {line.CodigoLineaParada}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-sm font-semibold text-text">
                    {desc}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-text-dim">
                    Ver recorrido en mapa
                </div>
            </div>

            <svg
                className="shrink-0 text-border"
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
