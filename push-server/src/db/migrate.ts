import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from './client';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, 'migrations');

export async function runMigrations() {
  await sql`create table if not exists _migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )`;
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const appliedRows = await sql<{ filename: string }[]>`select filename from _migrations`;
  const applied = new Set(appliedRows.map((r) => r.filename));
  for (const f of files) {
    if (applied.has(f)) continue;
    const content = await readFile(join(migrationsDir, f), 'utf8');
    console.log(`[migrate] applying ${f}`);
    await sql.unsafe(content);
    await sql`insert into _migrations (filename) values (${f})`;
  }
}
