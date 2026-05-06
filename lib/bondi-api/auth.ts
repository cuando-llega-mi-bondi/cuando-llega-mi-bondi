import { apiFetch } from "./client";
import type { AuthUser } from "./types";

export function login(email: string, password: string) {
    return apiFetch<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        json: { email, password },
    });
}

export function logout() {
    return apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
}

export function getMe() {
    return apiFetch<{ user: AuthUser }>("/auth/me");
}
