import Link from "next/link";
import type { Linea } from "@shared/types";
import { lineaNumero } from "@features/route/lineaNumero";
import { lineaToSlug } from "@/lib/server/lineaSlug";

interface LineItemProps {
    line: Linea;
}

export function LineItem({ line }: LineItemProps) {
    const desc = line.Descripcion.trim();
    const numero = lineaNumero(line);

    return (
        <Link
            href={`/recorrido/${lineaToSlug(line.Descripcion)}`}
            title={desc}
            aria-label={`Línea ${numero} — ${desc} — ver reseñas y recorrido`}
            className="flex aspect-[3/4] w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
        >
            <div className="h-[16%] w-full shrink-0 bg-rosa" />
            <div className="h-[10%] w-full shrink-0 bg-amarillo" />
            <div className="flex flex-1 items-center justify-center bg-turquesa">
                <span className="font-display text-3xl font-bold tracking-[-0.03em] text-white">
                    {numero}
                </span>
            </div>
        </Link>
    );
}
