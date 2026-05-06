import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

type FavoritoRow = {
    id: string;
    parada_id: string;
    apodo: string;
    emoji: string | null;
    posicion: number;
    created_at: string;
    updated_at: string;
};

const createSchema = z.object({
    parada_id: z.string().min(1).max(64),
    apodo: z.string().min(1).max(80),
    emoji: z.string().max(8).optional().nullable(),
});

const updateSchema = z.object({
    apodo: z.string().min(1).max(80).optional(),
    emoji: z.string().max(8).nullable().optional(),
    posicion: z.number().int().min(0).optional(),
});

export const favoritosRoutes = new Hono();

favoritosRoutes.use("*", requireAuth);

favoritosRoutes.get("/", async (c) => {
    const u = c.get("user");
    const { rows } = await query<FavoritoRow>(
        `select id, parada_id, apodo, emoji, posicion, created_at, updated_at
         from bondi.favoritos
         where user_id = $1
         order by posicion asc, created_at asc`,
        [u.sub],
    );
    return c.json({ favoritos: rows });
});

favoritosRoutes.post("/", zValidator("json", createSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");

    try {
        const { rows } = await query<FavoritoRow>(
            `insert into bondi.favoritos (user_id, parada_id, apodo, emoji, posicion)
             values ($1, $2, $3, $4,
                     coalesce((select max(posicion) + 1 from bondi.favoritos where user_id = $1), 0))
             returning id, parada_id, apodo, emoji, posicion, created_at, updated_at`,
            [u.sub, body.parada_id, body.apodo, body.emoji ?? null],
        );
        return c.json({ favorito: rows[0] }, 201);
    } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === "23505") {
            return c.json({ error: "already_favorited" }, 409);
        }
        throw e;
    }
});

favoritosRoutes.patch("/:id", zValidator("json", updateSchema), async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (body.apodo !== undefined) {
        sets.push(`apodo = $${i++}`);
        params.push(body.apodo);
    }
    if (body.emoji !== undefined) {
        sets.push(`emoji = $${i++}`);
        params.push(body.emoji);
    }
    if (body.posicion !== undefined) {
        sets.push(`posicion = $${i++}`);
        params.push(body.posicion);
    }
    if (sets.length === 0) return c.json({ error: "no_fields" }, 400);

    params.push(id, u.sub);
    const { rows } = await query<FavoritoRow>(
        `update bondi.favoritos
         set ${sets.join(", ")}
         where id = $${i++} and user_id = $${i++}
         returning id, parada_id, apodo, emoji, posicion, created_at, updated_at`,
        params,
    );
    if (rows.length === 0) return c.json({ error: "not_found" }, 404);
    return c.json({ favorito: rows[0] });
});

favoritosRoutes.delete("/:id", async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const { rowCount } = await query(
        `delete from bondi.favoritos where id = $1 and user_id = $2`,
        [id, u.sub],
    );
    if (rowCount === 0) return c.json({ error: "not_found" }, 404);
    return c.body(null, 204);
});
