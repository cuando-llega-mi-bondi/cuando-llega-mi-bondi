"use client";

import { memo, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { IconStar } from "@shared/icons/IconStar";
import { IconSearch } from "@shared/icons/IconSearch";
import type { Favorito } from "@features/favorites/types";
import { Button } from "@shared/ui/Button";
import { toast } from "@shared/ui/store/useToastStore";
import { SwipeableRow, type SwipeAction } from "@shared/gestures";
import { IconEdit } from "@shared/icons/IconEdit";
import { IconTrash } from "@shared/icons/IconTrash";
import { IconRoad } from "@shared/icons/IconRoad";
import { IconCrossroads } from "@shared/icons/IconCrossroads";

// ─── Action configs (static — no re-renders) ─────────────────────────────────

const LEFT_ACTION: SwipeAction = {
    color: "#d97706",
    commitColor: "#b45309",
    icon: <IconEdit size={18} />,
    label: "Editar",
};

const RIGHT_ACTION: SwipeAction = {
    color: "#e24b4a",
    commitColor: "#a32d2d",
    icon: <IconTrash size={18} />,
    label: "Borrar",
};

// ─── FavoritoRow ──────────────────────────────────────────────────────────────

interface FavoritoRowProps {
    fav: Favorito;
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
    onUndoRemove?: (fav: Favorito) => void;
    onRename: (fav: Favorito) => void;
    index: number;
}

const FavoritoRow = memo(function FavoritoRow({
    fav,
    onView,
    onRemove,
    onUndoRemove,
    onRename,
    index,
}: FavoritoRowProps) {
    // Strip redundant line prefix from nombre (e.g. "562 — AL HIPODROMO" → "Al Hipódromo")
    const rawName = fav.nombre;
    const prefixRe = /^\S+\s*[—\-–]\s*/;
    const displayName = prefixRe.test(rawName)
        ? rawName.replace(prefixRe, "").trim() || rawName
        : rawName;

    const handleRemove = useCallback(() => {
        onRemove(fav.id);
        toast({
            description: `Se eliminó "${displayName}" de favoritos.`,
            action: onUndoRemove ? {
                label: "Deshacer",
                onClick: () => onUndoRemove(fav)
            } : undefined
        });
    }, [onRemove, onUndoRemove, fav, displayName]);

    const handleExtraKey = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "e" || e.key === "E" || e.key === "F2") {
                e.preventDefault();
                onRename(fav);
            }
        },
        [fav, onRename],
    );

    return (
        <SwipeableRow
            leftAction={LEFT_ACTION}
            rightAction={RIGHT_ACTION}
            onSwipeRight={() => onRename(fav)}
            onSwipeLeft={handleRemove}
            onTap={() => onView(fav)}
            onExtraKeyDown={handleExtraKey}
            ariaLabel={`${fav.nombre}, línea ${fav.lineaLabel ?? fav.codigoLineaParada}. Deslizar derecha: editar, izquierda: borrar.`}
            focusRingColor="#d97706"
            index={index}
        >
            {(() => {
                // Resolve badge label
                const lineLabel =
                    fav.lineaLabel?.trim() ||
                    fav.descripcionLinea?.trim() ||
                    (fav.codigoLineaParada !== "undefined" && fav.codigoLineaParada) ||
                    (() => { const c = fav.id.split("_")[1]; return c !== "undefined" ? c : "—"; })();

                // Strip redundant line prefix from nombre (e.g. "562 — AL HIPODROMO" → "Al Hipódromo")
                return (
                    <div className="flex items-center gap-3">
                        {/* Line badge */}
                        <div className="flex h-10 min-w-11 flex-shrink-0 items-center justify-center rounded-xl bg-foreground/[0.07] px-2.5 font-display text-[15px] font-bold tabular-nums tracking-tight text-foreground">
                            {lineLabel}
                        </div>

                        {/* Content — clear hierarchy */}
                        <div className="flex-1 min-w-0">
                            <div className="truncate text-[14px] font-semibold leading-snug tracking-tight text-foreground">
                                {displayName}
                            </div>

                            {(fav.calleLabel || fav.interseccionLabel) && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    {fav.calleLabel && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground/70">
                                            <IconRoad size={11} />
                                            <span className="truncate text-[11px] leading-tight">{fav.calleLabel}</span>
                                        </div>
                                    )}
                                    {fav.interseccionLabel && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground/70">
                                            <IconCrossroads size={11} />
                                            <span className="truncate text-[11px] leading-tight">{fav.interseccionLabel}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </SwipeableRow>
    );
});

// ─── FavoritesList ─────────────────────────────────────────────────────────────

interface FavoritesListProps {
    favoritos: Favorito[];
    onView: (fav: Favorito) => void;
    onRemove: (id: string) => void;
    onUndoRemove?: (fav: Favorito) => void;
    onRename: (fav: Favorito) => void;
    onGoToSearch?: () => void;
}

export const FavoritesList = memo(function FavoritesList({
    favoritos,
    onView,
    onRemove,
    onUndoRemove,
    onRename,
    onGoToSearch,
}: FavoritesListProps) {
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
            <AnimatePresence mode="popLayout" initial={false}>
                {favoritos.map((fav, i) => (
                    <FavoritoRow
                        key={fav.id}
                        fav={fav}
                        onView={onView}
                        onRemove={onRemove}
                        onUndoRemove={onUndoRemove}
                        onRename={onRename}
                        index={i}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});
