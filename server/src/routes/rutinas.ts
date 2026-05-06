import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

type RutinaRow = {
    id: string;
    kind: "arrival_watch" | "daily_reminder";
    nombre: string;
    active_dows: number[] | null;
    origen_lat: number | null;
    origen_lng: number | null;
    destino_lat: number | null;
    destino_lng: number | null;
    destino_label: string | null;
    parada_id: string | null;
    linea_id: string | null;
    threshold_min: number | null;
    cooldown_min: number | null;
    fire_at: string | null;
    tz: string | null;
    enabled: boolean;
    last_fired_at: string | null;
    last_fired_on: string | null;
    created_at: string;
    updated_at: string;
};

const dowsSchema = z.array(z.number().int().min(1).max(7)).min(1).max(7).optional().nullable();
const latSchema = z.number().gte(-90).lte(90);
const lngSchema = z.number().gte(-180).lte(180);
const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "fire_at debe ser HH:MM");

const arrivalWatchSchema = z.object({
    kind: z.literal("arrival_watch"),
    nombre: z.string().min(1).max(120),
    active_dows: dowsSchema,
    parada_id: z.string().min(1).max(64),
    linea_id: z.string().min(1).max(32),
    threshold_min: z.number().int().min(1).max(60),
    cooldown_min: z.number().int().min(1).max(720).default(30),
    enabled: z.boolean().default(true),
});

const dailyReminderSchema = z.object({
    kind: z.literal("daily_reminder"),
    nombre: z.string().min(1).max(120),
    active_dows: dowsSchema,
    fire_at: hhmmSchema,
    tz: z.string().max(64).default("America/Argentina/Buenos_Aires"),
    origen_lat: latSchema.optional().nullable(),
    origen_lng: lngSchema.optional().nullable(),
    destino_lat: latSchema.optional().nullable(),
    destino_lng: lngSchema.optional().nullable(),
    destino_label: z.string().max(200).optional().nullable(),
    enabled: z.boolean().default(true),
});

const createSchema = z.discriminatedUnion("kind", [arrivalWatchSchema, dailyReminderSchema]);

const updateSchema = z.object({
    nombre: z.string().min(1).max(120).optional(),
    active_dows: dowsSchema,
    threshold_min: z.number().int().min(1).max(60).optional(),
    cooldown_min: z.number().int().min(1).max(720).optional(),
    fire_at: hhmmSchema.optional(),
    enabled: z.boolean().optional(),
});

export const rutinasRoutes = new Hono();

rutinasRoutes.use("*", requireAuth);

rutinasRoutes.get("/", async (c) => {
    const u = c.get("user");
    const { rows } = await query<RutinaRow>(
        `select id, kind, nombre, active_dows, origen_lat, origen_lng,
                destino_lat, destino_lng, destino_label, parada_id, linea_id,
                threshold_min, cooldown_min, fire_at, tz, enabled,
                last_fired_at, last_fired_on, created_at, updated_at
         from bondi.rutinas
         where user_id = $1
         order by enabled desc, created_at desc`,
        [u.sub],
    );
    return c.json({ rutinas: rows });
});

rutinasRoutes.post("/", zValidator("json", createSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");

    if (body.kind === "arrival_watch") {
        const { rows } = await query<RutinaRow>(
            `insert into bondi.rutinas
                (user_id, kind, nombre, active_dows, parada_id, linea_id,
                 threshold_min, cooldown_min, enabled)
             values ($1, 'arrival_watch', $2, $3, $4, $5, $6, $7, $8)
             returning id, kind, nombre, active_dows, origen_lat, origen_lng,
                       destino_lat, destino_lng, destino_label, parada_id, linea_id,
                       threshold_min, cooldown_min, fire_at, tz, enabled,
                       last_fired_at, last_fired_on, created_at, updated_at`,
            [
                u.sub,
                body.nombre,
                body.active_dows ?? null,
                body.parada_id,
                body.linea_id,
                body.threshold_min,
                body.cooldown_min,
                body.enabled,
            ],
        );
        return c.json({ rutina: rows[0] }, 201);
    }

    const { rows } = await query<RutinaRow>(
        `insert into bondi.rutinas
            (user_id, kind, nombre, active_dows, fire_at, tz,
             origen_lat, origen_lng, destino_lat, destino_lng, destino_label, enabled)
         values ($1, 'daily_reminder', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         returning id, kind, nombre, active_dows, origen_lat, origen_lng,
                   destino_lat, destino_lng, destino_label, parada_id, linea_id,
                   threshold_min, cooldown_min, fire_at, tz, enabled,
                   last_fired_at, last_fired_on, created_at, updated_at`,
        [
            u.sub,
            body.nombre,
            body.active_dows ?? null,
            body.fire_at,
            body.tz,
            body.origen_lat ?? null,
            body.origen_lng ?? null,
            body.destino_lat ?? null,
            body.destino_lng ?? null,
            body.destino_label ?? null,
            body.enabled,
        ],
    );
    return c.json({ rutina: rows[0] }, 201);
});

rutinasRoutes.patch("/:id", zValidator("json", updateSchema), async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(body)) {
        if (v === undefined) continue;
        sets.push(`${k} = $${i++}`);
        params.push(v);
    }
    if (sets.length === 0) return c.json({ error: "no_fields" }, 400);

    params.push(id, u.sub);
    const { rows } = await query<RutinaRow>(
        `update bondi.rutinas set ${sets.join(", ")}
         where id = $${i++} and user_id = $${i++}
         returning id, kind, nombre, active_dows, origen_lat, origen_lng,
                   destino_lat, destino_lng, destino_label, parada_id, linea_id,
                   threshold_min, cooldown_min, fire_at, tz, enabled,
                   last_fired_at, last_fired_on, created_at, updated_at`,
        params,
    );
    if (rows.length === 0) return c.json({ error: "not_found" }, 404);
    return c.json({ rutina: rows[0] });
});

rutinasRoutes.delete("/:id", async (c) => {
    const u = c.get("user");
    const id = c.req.param("id");
    const { rowCount } = await query(
        `delete from bondi.rutinas where id = $1 and user_id = $2`,
        [id, u.sub],
    );
    if (rowCount === 0) return c.json({ error: "not_found" }, 404);
    return c.body(null, 204);
});
