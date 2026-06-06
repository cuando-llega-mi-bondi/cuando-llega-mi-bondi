"use client";

import { usePersistHydration } from "@shared/hooks/usePersistHydration";
import { useFavoritesStore } from "../store/useFavoritesStore";

export function useFavoritos() {
    const hydrated = usePersistHydration(useFavoritesStore);
    const favoritos = useFavoritesStore((s) => s.favoritos);
    const addFavorito = useFavoritesStore((s) => s.addFavorito);
    const removeFavorito = useFavoritesStore((s) => s.removeFavorito);
    const renameFavorito = useFavoritesStore((s) => s.renameFavorito);

    return {
        favoritos: hydrated ? favoritos : [],
        addFavorito,
        removeFavorito,
        renameFavorito,
        isHydrated: hydrated,
    };
}
