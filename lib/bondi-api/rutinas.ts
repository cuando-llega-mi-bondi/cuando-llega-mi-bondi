import { apiFetch } from "./client";
import type { CreateRutinaInput, Rutina } from "./types";

export function listRutinas() {
    return apiFetch<{ rutinas: Rutina[] }>("/rutinas");
}

export function createRutina(input: CreateRutinaInput) {
    return apiFetch<{ rutina: Rutina }>("/rutinas", {
        method: "POST",
        json: input,
    });
}

export function updateRutina(
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
) {
    return apiFetch<{ rutina: Rutina }>(`/rutinas/${id}`, {
        method: "PATCH",
        json: patch,
    });
}

export function deleteRutina(id: string) {
    return apiFetch<void>(`/rutinas/${id}`, { method: "DELETE" });
}
