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
            className="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-left transition hover:-translate-y-px hover:bg-white/3 hover:shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px]"
        >
            <div className="flex h-10 min-w-[52px] flex-shrink-0 items-center justify-center rounded-full border border-accent/45 bg-accent/15 font-display text-[17px] font-semibold tracking-[-0.03em] text-accent">
                {line.CodigoLineaParada}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-sm font-semibold text-text">
                    {desc}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                    Ver recorrido en mapa
                </div>
            </div>

            <svg
                className="shrink-0 text-text-muted"
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
