import { supabase } from "@shared/infra/supabase";
import { MOCK_REVIEWS_ENABLED, mockDeleteAccount } from "@features/reviews/mockReviews";
import { useMockAuthStore } from "@features/reviews/mockAuthStore";

export async function signOut(): Promise<void> {
    if (MOCK_REVIEWS_ENABLED) {
        useMockAuthStore.getState().setSignedIn(false);
        return;
    }
    await supabase.auth.signOut();
}

/** Anonimiza tus reseñas y borra la cuenta. Ver `app/api/account/delete/route.ts`. */
export async function deleteAccount(): Promise<void> {
    if (MOCK_REVIEWS_ENABLED) {
        mockDeleteAccount();
        useMockAuthStore.getState().setSignedIn(false);
        return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("No hay sesión activa");

    const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "No pudimos eliminar la cuenta");
    }
    await supabase.auth.signOut();
}
