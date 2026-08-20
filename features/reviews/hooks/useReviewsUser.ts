"use client";

import { useSupabaseUser } from "@shared/hooks/useSupabaseUser";
import { MOCK_REVIEWS_ENABLED, MOCK_USER } from "../mockReviews";
import { useMockAuthStore } from "../mockAuthStore";

interface ReviewsUser {
    id: string;
    email?: string;
}

/**
 * Como `useSupabaseUser`, pero en modo mock devuelve un usuario fake — así se
 * puede probar la UI de reseñas (crear/editar/borrar la propia, cerrar
 * sesión, eliminar cuenta) sin pasar por el flujo real de magic link.
 */
export function useReviewsUser(): { user: ReviewsUser | null; loading: boolean } {
    const real = useSupabaseUser();
    const mockSignedIn = useMockAuthStore((s) => s.signedIn);
    if (MOCK_REVIEWS_ENABLED) return { user: mockSignedIn ? MOCK_USER : null, loading: false };
    return real;
}
