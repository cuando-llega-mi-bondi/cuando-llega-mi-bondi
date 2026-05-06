import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import { sign } from "../auth/jwt.js";
import { setAuthCookie, clearAuthCookie } from "../auth/cookie.js";
import { requireAuth } from "../auth/middleware.js";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1).max(200),
});

type CredentialRow = {
    id: string;
    email: string;
    password_hash: string;
    persona_id: string | null;
    nombre: string | null;
};

export const authRoutes = new Hono();

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const { rows } = await query<CredentialRow>(
        `select c.id, c.email, c.password_hash, c.persona_id, p.nombre
         from public.auth_credentials c
         left join public.personas p on p.id = c.persona_id
         where lower(c.email) = lower($1)
         limit 1`,
        [email],
    );

    const cred = rows[0];
    // Tiempo constante: si no existe el user, hacemos un compare dummy igual.
    const ok = cred
        ? await bcrypt.compare(password, cred.password_hash)
        : await bcrypt.compare(password, "$2a$10$0000000000000000000000.00000000000000000000000000000000");

    if (!cred || !ok) return c.json({ error: "invalid_credentials" }, 401);

    const token = await sign({
        sub: cred.id,
        email: cred.email,
        nombre: cred.nombre ?? undefined,
        persona_id: cred.persona_id ?? undefined,
    });
    setAuthCookie(c, token);

    return c.json({
        user: {
            id: cred.id,
            email: cred.email,
            nombre: cred.nombre,
        },
    });
});

authRoutes.post("/logout", (c) => {
    clearAuthCookie(c);
    return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, (c) => {
    const u = c.get("user");
    return c.json({
        user: { id: u.sub, email: u.email, nombre: u.nombre ?? null },
    });
});
