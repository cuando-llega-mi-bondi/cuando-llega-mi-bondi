import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { env } from "../env.js";

const isProd = env.NODE_ENV === "production";

export function setAuthCookie(c: Context, token: string): void {
    setCookie(c, env.AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        // SameSite=None requiere Secure; lo usamos en prod para cross-site (Vercel ↔ aeterna.red).
        // En dev (http://localhost) usamos Lax para que la cookie viaje en mismo origin.
        sameSite: isProd ? "None" : "Lax",
        path: "/",
        maxAge: env.AUTH_TOKEN_TTL_SECONDS,
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
    });
}

export function clearAuthCookie(c: Context): void {
    deleteCookie(c, env.AUTH_COOKIE_NAME, {
        path: "/",
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
    });
}

export function readAuthCookie(c: Context): string | undefined {
    return getCookie(c, env.AUTH_COOKIE_NAME);
}
