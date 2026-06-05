"use client";

import { useEffect, useState } from "react";
import { useFavoritesStore } from "../store/useFavoritesStore";

export function useFavoritos() {
    const favoritos = useFavoritesStore(s => s.favoritos);
    const addFavorito = useFavoritesStore(s => s.addFavorito);
    const removeFavorito = useFavoritesStore(s => s.removeFavorito);
    const renameFavorito = useFavoritesStore(s => s.renameFavorito);
    
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return {
        favoritos: isHydrated ? favoritos : [],
        addFavorito,
        removeFavorito,
        renameFavorito,
    };
}
