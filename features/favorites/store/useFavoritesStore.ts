import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Favorito } from "@features/favorites/types";

interface FavoritesState {
    favoritos: Favorito[];
    addFavorito: (fav: Favorito) => void;
    removeFavorito: (id: string) => void;
    renameFavorito: (id: string, name: string) => void;
}

function mergeFavoritos(
    fromStorage: Favorito[],
    inMemory: Favorito[],
): Favorito[] {
    const byId = new Map(fromStorage.map((f) => [f.id, f]));
    for (const fav of inMemory) {
        byId.set(fav.id, fav);
    }
    return Array.from(byId.values());
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set) => ({
            favoritos: [],
            addFavorito: (fav) => {
                set((state) => {
                    if (state.favoritos.some((f) => f.id === fav.id)) {
                        return state;
                    }
                    return { favoritos: [...state.favoritos, fav] };
                });
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
            partialize: (state) => ({ favoritos: state.favoritos }),
            merge: (persisted, current) => {
                const stored = persisted as Partial<FavoritesState> | undefined;
                return {
                    ...current,
                    favoritos: mergeFavoritos(
                        stored?.favoritos ?? [],
                        current.favoritos,
                    ),
                };
            },
        }
    )
);
