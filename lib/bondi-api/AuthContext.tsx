"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import * as authApi from "./auth";
import { ApiError, type AuthUser } from ".";

type AuthState =
    | { status: "loading"; user: null }
    | { status: "anonymous"; user: null }
    | { status: "authenticated"; user: AuthUser };

type AuthCtx = {
    state: AuthState;
    login(email: string, password: string): Promise<void>;
    logout(): Promise<void>;
    refresh(): Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function BondiAuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({ status: "loading", user: null });

    const refresh = useCallback(async () => {
        try {
            const { user } = await authApi.getMe();
            setState({ status: "authenticated", user });
        } catch (e) {
            if (e instanceof ApiError && (e.status === 401 || e.status === 0)) {
                setState({ status: "anonymous", user: null });
                return;
            }
            // Otros errores: tratamos como anonymous para no bloquear la UI.
            setState({ status: "anonymous", user: null });
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const login = useCallback(
        async (email: string, password: string) => {
            const { user } = await authApi.login(email, password);
            setState({ status: "authenticated", user });
        },
        [],
    );

    const logout = useCallback(async () => {
        await authApi.logout().catch(() => undefined);
        setState({ status: "anonymous", user: null });
    }, []);

    const value = useMemo<AuthCtx>(
        () => ({ state, login, logout, refresh }),
        [state, login, logout, refresh],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBondiAuth(): AuthCtx {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useBondiAuth requiere <BondiAuthProvider>");
    return ctx;
}
