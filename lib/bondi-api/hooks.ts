"use client";

import useSWR, { useSWRConfig } from "swr";
import { useCallback } from "react";
import * as favoritosApi from "./favoritos";
import * as rutinasApi from "./rutinas";
import type { CreateRutinaInput, Favorito, Rutina } from "./types";
import { ApiError } from "./client";
import { useBondiAuth } from "./AuthContext";

const KEY_FAVORITOS = "bondi:/favoritos";
const KEY_RUTINAS = "bondi:/rutinas";

function fetcher<T>(fn: () => Promise<T>): () => Promise<T> {
    return fn;
}

/** SWR no debe pegar a la API si el user no está autenticado. */
function useAuthGate(): boolean {
    const { state } = useBondiAuth();
    return state.status === "authenticated";
}

// --- Favoritos -----------------------------------------------------------

export function useFavoritos() {
    const ready = useAuthGate();
    const { mutate: globalMutate } = useSWRConfig();

    const swr = useSWR<Favorito[], ApiError>(
        ready ? KEY_FAVORITOS : null,
        fetcher(async () => (await favoritosApi.listFavoritos()).favoritos),
        { revalidateOnFocus: false },
    );

    const create = useCallback(
        async (input: { parada_id: string; apodo: string; emoji?: string | null }) => {
            const { favorito } = await favoritosApi.createFavorito(input);
            await globalMutate<Favorito[]>(
                KEY_FAVORITOS,
                (prev) => [...(prev ?? []), favorito],
                { revalidate: false },
            );
            return favorito;
        },
        [globalMutate],
    );

    const update = useCallback(
        async (
            id: string,
            patch: Partial<Pick<Favorito, "apodo" | "emoji" | "posicion">>,
        ) => {
            // optimistic
            await globalMutate<Favorito[]>(
                KEY_FAVORITOS,
                (prev) =>
                    (prev ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
                { revalidate: false },
            );
            try {
                const { favorito } = await favoritosApi.updateFavorito(id, patch);
                await globalMutate<Favorito[]>(
                    KEY_FAVORITOS,
                    (prev) =>
                        (prev ?? []).map((f) => (f.id === id ? favorito : f)),
                    { revalidate: false },
                );
                return favorito;
            } catch (e) {
                await globalMutate(KEY_FAVORITOS); // refetch para deshacer
                throw e;
            }
        },
        [globalMutate],
    );

    const remove = useCallback(
        async (id: string) => {
            await globalMutate<Favorito[]>(
                KEY_FAVORITOS,
                (prev) => (prev ?? []).filter((f) => f.id !== id),
                { revalidate: false },
            );
            try {
                await favoritosApi.deleteFavorito(id);
            } catch (e) {
                await globalMutate(KEY_FAVORITOS);
                throw e;
            }
        },
        [globalMutate],
    );

    return {
        favoritos: swr.data ?? [],
        loading: swr.isLoading,
        error: swr.error,
        ready,
        refresh: () => globalMutate(KEY_FAVORITOS),
        create,
        update,
        remove,
    };
}

// --- Rutinas -------------------------------------------------------------

export function useRutinas() {
    const ready = useAuthGate();
    const { mutate: globalMutate } = useSWRConfig();

    const swr = useSWR<Rutina[], ApiError>(
        ready ? KEY_RUTINAS : null,
        fetcher(async () => (await rutinasApi.listRutinas()).rutinas),
        { revalidateOnFocus: false },
    );

    const create = useCallback(
        async (input: CreateRutinaInput) => {
            const { rutina } = await rutinasApi.createRutina(input);
            await globalMutate<Rutina[]>(
                KEY_RUTINAS,
                (prev) => [rutina, ...(prev ?? [])],
                { revalidate: false },
            );
            return rutina;
        },
        [globalMutate],
    );

    const update = useCallback(
        async (
            id: string,
            patch: Partial<
                Pick<
                    Rutina,
                    | "nombre"
                    | "active_dows"
                    | "threshold_min"
                    | "cooldown_min"
                    | "fire_at"
                    | "enabled"
                >
            >,
        ) => {
            await globalMutate<Rutina[]>(
                KEY_RUTINAS,
                (prev) =>
                    (prev ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
                { revalidate: false },
            );
            try {
                const { rutina } = await rutinasApi.updateRutina(id, patch);
                await globalMutate<Rutina[]>(
                    KEY_RUTINAS,
                    (prev) => (prev ?? []).map((r) => (r.id === id ? rutina : r)),
                    { revalidate: false },
                );
                return rutina;
            } catch (e) {
                await globalMutate(KEY_RUTINAS);
                throw e;
            }
        },
        [globalMutate],
    );

    const remove = useCallback(
        async (id: string) => {
            await globalMutate<Rutina[]>(
                KEY_RUTINAS,
                (prev) => (prev ?? []).filter((r) => r.id !== id),
                { revalidate: false },
            );
            try {
                await rutinasApi.deleteRutina(id);
            } catch (e) {
                await globalMutate(KEY_RUTINAS);
                throw e;
            }
        },
        [globalMutate],
    );

    return {
        rutinas: swr.data ?? [],
        loading: swr.isLoading,
        error: swr.error,
        ready,
        refresh: () => globalMutate(KEY_RUTINAS),
        create,
        update,
        remove,
    };
}
