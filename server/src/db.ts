import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
    console.error("[pg] idle client error", err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
): Promise<pg.QueryResult<T>> {
    return pool.query<T>(text, params as never[] | undefined);
}

export async function withTx<T>(
    fn: (q: <R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]) => Promise<pg.QueryResult<R>>) => Promise<T>,
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn((text, params) => client.query(text, params as never[] | undefined));
        await client.query("COMMIT");
        return result;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}
