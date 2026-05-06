import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const subscribeSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
    user_agent: z.string().max(500).optional(),
});

export const subscribeRoutes = new Hono();

subscribeRoutes.use("*", requireAuth);

subscribeRoutes.post("/", zValidator("json", subscribeSchema), async (c) => {
    const u = c.get("user");
    const body = c.req.valid("json");

    const { rows } = await query<{ id: string }>(
        `insert into bondi.subscriptions
            (user_id, endpoint, p256dh, auth, user_agent)
         values ($1, $2, $3, $4, $5)
         on conflict (endpoint) do update set
            user_id = excluded.user_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_agent = excluded.user_agent,
            last_seen_at = now(),
            disabled_at = null
         returning id`,
        [u.sub, body.endpoint, body.keys.p256dh, body.keys.auth, body.user_agent ?? null],
    );
    return c.json({ id: rows[0]?.id });
});

subscribeRoutes.delete("/", async (c) => {
    const u = c.get("user");
    const endpoint = c.req.query("endpoint");
    if (!endpoint) return c.json({ error: "endpoint_required" }, 400);
    const { rowCount } = await query(
        `delete from bondi.subscriptions where user_id = $1 and endpoint = $2`,
        [u.sub, endpoint],
    );
    return c.json({ deleted: rowCount });
});
