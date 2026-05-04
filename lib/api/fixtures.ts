import { promises as fs } from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

function fixturesDir(): string {
    return process.env.FIXTURES_DIR ?? path.join(process.cwd(), "fixtures");
}

export type FixtureMode = "record" | "replay" | null;

export function fixtureMode(): FixtureMode {
    const v = process.env.MGP_USE_FIXTURES?.toLowerCase().trim();
    if (v === "record") return "record";
    if (v === "replay") return "replay";
    return null;
}

function fixturePath(body: string): { dir: string; file: string; accion: string } {
    const params = new URLSearchParams(body);
    const accion = params.get("accion") ?? "_unknown";
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
    const dir = path.join(fixturesDir(), accion);
    return { dir, file: path.join(dir, `${hash}.json`), accion };
}

export async function readFixture(body: string): Promise<unknown | null> {
    const { file } = fixturePath(body);
    try {
        const raw = await fs.readFile(file, "utf-8");
        const parsed = JSON.parse(raw) as { data?: unknown };
        return parsed.data ?? parsed;
    } catch {
        return null;
    }
}

export async function writeFixture(body: string, data: unknown): Promise<void> {
    const { dir, file, accion } = fixturePath(body);
    await fs.mkdir(dir, { recursive: true });
    const params = new URLSearchParams(body);
    const meta = {
        accion,
        params: Object.fromEntries(params.entries()),
        recordedAt: new Date().toISOString(),
    };
    await fs.writeFile(
        file,
        JSON.stringify({ _meta: meta, data }, null, 2),
        "utf-8",
    );
}
