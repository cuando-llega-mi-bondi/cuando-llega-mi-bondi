import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { env } from "../env.js";

// La API siempre se sirve por HTTPS (cloudflared termina TLS) y los frontends
// (Vercel bondimdp.com.ar, dev en localhost:3000) son de otro origin → cookie
// cross-site requiere SameSite=None + Secure. El browser igual la guarda
// porque la respuesta llega por HTTPS, y la manda en cualquier fetch HTTPS
// hacia este dominio con `credentials: 'include'`.
export function setAuthCookie(c: Context, token: string): void {
    setCookie(c, env.AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: env.AUTH_TOKEN_TTL_SECONDS,
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
    });
}

export function clearAuthCookie(c: Context): void {
    deleteCookie(c, env.AUTH_COOKIE_NAME, {
        path: "/",
        secure: true,
        sameSite: "None",
        ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
    });
}

export function readAuthCookie(c: Context): string | undefined {
    return getCookie(c, env.AUTH_COOKIE_NAME);
}
