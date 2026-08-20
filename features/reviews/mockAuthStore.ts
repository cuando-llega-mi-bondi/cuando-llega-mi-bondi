import { create } from "zustand";

/** Sesión fake en modo mock — permite probar los estados logueado/deslogueado sin Supabase. */
interface MockAuthState {
    signedIn: boolean;
    setSignedIn: (signedIn: boolean) => void;
}

export const useMockAuthStore = create<MockAuthState>((set) => ({
    signedIn: true,
    setSignedIn: (signedIn) => set({ signedIn }),
}));
