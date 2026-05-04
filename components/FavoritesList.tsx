import { memo } from "react";
import { IconX } from "./icons/IconX";
import { IconStar } from "./icons/IconStar";
import { IconSearch } from "./icons/IconSearch";
import type { Favorito } from "@/lib/types";
import { Button, Card } from "@/components/ui";

interface FavoritesListProps {
    favoritos: Favorito[];
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
    onRename: (fav: Favorito) => void;
    onGoToSearch?: () => void;
}

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const FavoritesList = memo(function FavoritesList({ favoritos, onView, onRemove, onRename, onGoToSearch }: FavoritesListProps) {
    if (favoritos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-slide-up">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                    <IconStar filled={false} className="h-10 w-10 stroke-[1.5]" />
                </div>
                
                <h3 className="mb-2 font-display text-2xl font-black tracking-tight text-foreground uppercase">
                    Sin favoritos
                </h3>
                
                <p className="mb-10 max-w-[240px] text-[16px] leading-relaxed text-muted-foreground">
                    Guarda tus paradas favoritas para acceso rápido
                </p>

                {onGoToSearch && (
                    <Button 
                        variant="primary" 
                        size="lg"
                        onClick={onGoToSearch}
                        className="h-14 px-8 text-lg font-bold shadow-sm"
                        leftIcon={<IconSearch className="h-5 w-5" />}
                    >
                        Buscar colectivo
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5">
            {favoritos.map(fav => (
                <Card key={fav.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="min-w-14 flex-shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-center font-display text-lg font-medium tracking-tight text-foreground">
                        {fav.lineaLabel?.trim() ||
                            fav.descripcionLinea?.trim() ||
                            fav.codigoLineaParada}
                    </div>
                    <div className="flex-1">
                        <div className="mb-0.5 font-sans text-[15px] font-medium tracking-tight text-foreground">
                            {fav.nombre}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                            {fav.identificadorParada}
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <Button
                            onClick={() => onRename(fav)}
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-secondary"
                            title="Editar nombre"
                        >
                            <IconEdit />
                        </Button>
                        <Button
                            onClick={() => onView(fav)}
                            variant="primary"
                            size="sm"
                            className="px-3 text-[13px]"
                        >
                            VER
                        </Button>
                        <Button
                            onClick={() => onRemove(fav.id)}
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
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
