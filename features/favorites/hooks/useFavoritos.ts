"use client";

import { useEffect, useState } from "react";
import { useFavoritesStore } from "../store/useFavoritesStore";

export function useFavoritos() {
    const store = useFavoritesStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return {
        favoritos: isHydrated ? store.favoritos : [],
        addFavorito: store.addFavorito,
        removeFavorito: store.removeFavorito,
        renameFavorito: store.renameFavorito,
    };
}
