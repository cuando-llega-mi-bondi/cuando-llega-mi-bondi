import { apiFetch } from "./client";
import type { Favorito } from "./types";

export function listFavoritos() {
    return apiFetch<{ favoritos: Favorito[] }>("/favoritos");
}

export function createFavorito(input: {
    parada_id: string;
    apodo: string;
    emoji?: string | null;
}) {
    return apiFetch<{ favorito: Favorito }>("/favoritos", {
        method: "POST",
        json: input,
    });
}

export function updateFavorito(
    id: string,
    patch: Partial<Pick<Favorito, "apodo" | "emoji" | "posicion">>,
) {
    return apiFetch<{ favorito: Favorito }>(`/favoritos/${id}`, {
        method: "PATCH",
        json: patch,
    });
}

export function deleteFavorito(id: string) {
    return apiFetch<void>(`/favoritos/${id}`, { method: "DELETE" });
}
