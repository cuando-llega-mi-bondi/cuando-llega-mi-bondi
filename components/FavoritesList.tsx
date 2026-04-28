import { memo } from "react";
import { IconX } from "./icons/IconX";
import type { Favorito } from "@/lib/types";
import { Button, Card } from "@/components/ui";

interface FavoritesListProps {
    favoritos: Favorito[];
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
    onRename: (fav: Favorito) => void;
}

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const FavoritesList = memo(function FavoritesList({ favoritos, onView, onRemove, onRename }: FavoritesListProps) {
    if (favoritos.length === 0) {
        return (
            <div className="mt-10 text-center font-mono text-[13px] tracking-[1px] text-text-dim">
                <div className="mb-4 flex justify-center text-text-muted">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </div>
                <div>Guardá paradas como favoritas</div>
                <div className="mt-1.5 text-[11px] text-text-muted">
                    Presioná el ícono de estrella en cualquier arribo para guardar
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5">
            {favoritos.map(fav => (
                <Card key={fav.id} className="flex items-center gap-3 rounded-[10px] px-4 py-3.5">
                    <div className="min-w-14 flex-shrink-0 rounded-md bg-accent px-2.5 py-1 text-center font-display text-lg font-black text-black">
                        {fav.descripcionLinea}
                    </div>
                    <div className="flex-1">
                        <div className="mb-0.5 font-display text-[15px] font-bold text-text">
                            {fav.nombre}
                        </div>
                        <div className="font-mono text-[11px] text-text-dim">
                            {fav.identificadorParada}
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <Button
                            onClick={() => onRename(fav)}
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 rounded-md border-border p-0 text-text-dim"
                            title="Editar nombre"
                        >
                            <IconEdit />
                        </Button>
                        <Button
                            onClick={() => onView(fav)}
                            variant="primary"
                            size="sm"
                            className="rounded-md px-3 text-[13px]"
                        >
                            VER
                        </Button>
                        <Button
                            onClick={() => onRemove(fav.id)}
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 rounded-md border-border p-0 text-text-dim"
                            title="Eliminar"
                        >
                            <IconX />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
});
