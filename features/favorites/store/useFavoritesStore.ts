import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Favorito } from "@features/favorites/types";

interface FavoritesState {
    favoritos: Favorito[];
    addFavorito: (fav: Favorito) => void;
    removeFavorito: (id: string) => void;
    renameFavorito: (id: string, name: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favoritos: [],
            addFavorito: (fav) => {
                const { favoritos } = get();
                if (!favoritos.some((f) => f.id === fav.id)) {
                    set({ favoritos: [...favoritos, fav] });
                }
            },
            removeFavorito: (id) => {
                set((state) => ({
                    favoritos: state.favoritos.filter((f) => f.id !== id),
                }));
            },
            renameFavorito: (id, name) => {
                set((state) => ({
                    favoritos: state.favoritos.map((f) =>
                        f.id === id ? { ...f, nombre: name } : f
                    ),
                }));
            },
        }),
        {
            name: "cuandollega_favoritos",
        }
    )
);
