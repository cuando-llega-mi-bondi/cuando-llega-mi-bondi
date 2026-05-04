import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fixtureMode, readFixture, writeFixture } from "./fixtures";

describe("fixtureMode", () => {
    const original = process.env.MGP_USE_FIXTURES;
    afterEach(() => {
        if (original === undefined) delete process.env.MGP_USE_FIXTURES;
        else process.env.MGP_USE_FIXTURES = original;
    });

    it("returns null when env is unset", () => {
        delete process.env.MGP_USE_FIXTURES;
        expect(fixtureMode()).toBe(null);
    });

    it("returns 'record' / 'replay' case-insensitive and trimmed", () => {
        process.env.MGP_USE_FIXTURES = "  RECORD  ";
        expect(fixtureMode()).toBe("record");
        process.env.MGP_USE_FIXTURES = "Replay";
        expect(fixtureMode()).toBe("replay");
    });

    it("returns null for unrecognized values", () => {
        process.env.MGP_USE_FIXTURES = "on";
        expect(fixtureMode()).toBe(null);
    });
});

describe("read/writeFixture", () => {
    let tmp: string;
    const originalDir = process.env.FIXTURES_DIR;

    beforeEach(async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), "fixtures-test-"));
        process.env.FIXTURES_DIR = tmp;
    });

    afterEach(async () => {
        if (originalDir === undefined) delete process.env.FIXTURES_DIR;
        else process.env.FIXTURES_DIR = originalDir;
        await fs.rm(tmp, { recursive: true, force: true });
    });

    it("returns null when fixture missing", async () => {
        expect(await readFixture("accion=Foo&x=1")).toBe(null);
    });

    it("returns null when JSON is malformed", async () => {
        const dir = path.join(tmp, "Foo");
        await fs.mkdir(dir, { recursive: true });
        // Build the same hash the helper computes for this body
        const body = "accion=Foo&x=1";
        const { createHash } = await import("node:crypto");
        const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
        await fs.writeFile(path.join(dir, `${hash}.json`), "{ not json", "utf-8");
        expect(await readFixture(body)).toBe(null);
    });

    it("write then read roundtrips data", async () => {
        const body = "accion=RecuperarLineaPorCuandoLlega&token=abc";
        const data = { CodigoEstado: 0, lineas: [{ id: 1 }] };
        await writeFixture(body, data);
        expect(await readFixture(body)).toEqual(data);
    });

    it("groups files by accion and uses sha-prefixed name", async () => {
        await writeFixture("accion=Foo&q=1", { ok: true });
        const files = await fs.readdir(path.join(tmp, "Foo"));
        expect(files).toHaveLength(1);
        expect(files[0]).toMatch(/^[0-9a-f]{16}\.json$/);
    });

    it("persists meta with accion, params and recordedAt", async () => {
        const body = "accion=Bar&codigoLinea=541";
        await writeFixture(body, { ok: true });
        const [file] = await fs.readdir(path.join(tmp, "Bar"));
        const raw = JSON.parse(await fs.readFile(path.join(tmp, "Bar", file), "utf-8"));
        expect(raw._meta.accion).toBe("Bar");
        expect(raw._meta.params).toEqual({ accion: "Bar", codigoLinea: "541" });
        expect(typeof raw._meta.recordedAt).toBe("string");
        expect(raw.data).toEqual({ ok: true });
    });

    it("same body overwrites; different bodies produce distinct files", async () => {
        await writeFixture("accion=X&a=1", { v: 1 });
        await writeFixture("accion=X&a=1", { v: 2 });
        await writeFixture("accion=X&a=2", { v: 3 });
        const files = await fs.readdir(path.join(tmp, "X"));
        expect(files).toHaveLength(2);
    });

    it("uses _unknown when accion param is missing", async () => {
        await writeFixture("foo=bar", { ok: 1 });
        const files = await fs.readdir(path.join(tmp, "_unknown"));
        expect(files).toHaveLength(1);
    });
});
