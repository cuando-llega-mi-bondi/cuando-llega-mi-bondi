import type { Favorito } from "@/lib/types";

const FAV_KEY = "cuandollega_favoritos";

export function getFavoritos(): Favorito[] {
    if (typeof window === "undefined") return [];

    try {
        return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
    } catch {
        return [];
    }
}

export function saveFavorito(fav: Favorito): void {
    const favs = getFavoritos();
    if (favs.some((f) => f.id === fav.id)) return;

    localStorage.setItem(FAV_KEY, JSON.stringify([...favs, fav]));
}

export function removeFavorito(id: string): void {
    localStorage.setItem(
        FAV_KEY,
        JSON.stringify(getFavoritos().filter((f) => f.id !== id)),
    );
}

export function updateFavorito(id: string, name: string): void {
    localStorage.setItem(
        FAV_KEY,
        JSON.stringify(
            getFavoritos().map((f) => (f.id === id ? { ...f, nombre: name } : f)),
        ),
    );
}

export function isFavorito(id: string): boolean {
    return getFavoritos().some((f) => f.id === id);
}
