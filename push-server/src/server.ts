import { Hono } from 'hono';
import { env } from './env';
import { sql } from './db/client';
import { runMigrations } from './db/migrate';

await runMigrations();

const app = new Hono();

app.get('/health', async (c) => {
  const [row] = await sql<{ now: Date }[]>`select now()`;
  return c.json({ ok: true, db: row.now });
});

console.log(`[push-server] listening on :${env.port}`);

export default { port: env.port, fetch: app.fetch };
