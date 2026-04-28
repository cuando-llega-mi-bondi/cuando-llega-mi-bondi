"use client";

import { useCallback, useState } from "react";
import type { Favorito } from "@/lib/types";
import {
    getFavoritos,
    isFavorito,
    removeFavorito,
    saveFavorito,
    updateFavorito,
} from "@/lib/storage/favoritos";

export function useFavoritos() {
    const [favoritos, setFavoritos] = useState<Favorito[]>(() => getFavoritos());

    const refresh = useCallback(() => {
        setFavoritos(getFavoritos());
    }, []);

    const add = useCallback(
        (fav: Favorito) => {
            saveFavorito(fav);
            refresh();
        },
        [refresh],
    );

    const remove = useCallback(
        (id: string) => {
            removeFavorito(id);
            refresh();
        },
        [refresh],
    );

    const rename = useCallback(
        (id: string, name: string) => {
            updateFavorito(id, name);
            refresh();
        },
        [refresh],
    );

    return {
        favoritos,
        refreshFavoritos: refresh,
        addFavorito: add,
        removeFavorito: remove,
        renameFavorito: rename,
        isFavorito,
    };
}
