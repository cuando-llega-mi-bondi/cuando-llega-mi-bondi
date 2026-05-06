import type { Context, MiddlewareHandler } from "hono";
import { verify, type JwtPayload } from "./jwt.js";
import { readAuthCookie } from "./cookie.js";

declare module "hono" {
    interface ContextVariableMap {
        user: JwtPayload;
    }
}

/**
 * Middleware que rechaza con 401 si no hay JWT válido.
 * Acepta el token vía cookie httpOnly o header Authorization: Bearer.
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
    const token = extractToken(c);
    if (!token) return c.json({ error: "unauthenticated" }, 401);

    const payload = await verify(token);
    if (!payload) return c.json({ error: "invalid_token" }, 401);

    c.set("user", payload);
    await next();
};

function extractToken(c: Context): string | null {
    const cookie = readAuthCookie(c);
    if (cookie) return cookie;
    const auth = c.req.header("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) {
        return auth.slice(7).trim();
    }
    return null;
}
