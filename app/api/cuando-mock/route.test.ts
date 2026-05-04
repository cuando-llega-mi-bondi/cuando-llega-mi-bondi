import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeReq(body: string, scenario?: string): NextRequest {
    const qs = scenario ? `?scenario=${scenario}` : "";
    const url = new URL(`http://localhost/api/cuando-mock${qs}`);
    return new NextRequest(url, {
        method: "POST",
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
    });
}

describe("POST /api/cuando-mock", () => {
    it("happy path returns shape for known accion", async () => {
        const res = await POST(makeReq("accion=RecuperarLineaPorCuandoLlega"));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.CodigoEstado).toBe(0);
        expect(Array.isArray(json.lineas)).toBe(true);
        expect(json.lineas[0]).toHaveProperty("Descripcion");
    });

    it("returns 501 with hint for unknown accion", async () => {
        const res = await POST(makeReq("accion=NoExiste"));
        expect(res.status).toBe(501);
        const json = await res.json();
        expect(json).toHaveProperty("hint");
    });

    it("empty scenario returns empty arrays", async () => {
        const res = await POST(
            makeReq("accion=RecuperarLineaPorCuandoLlega", "empty"),
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.lineas).toEqual([]);
        expect(json.arribos).toEqual([]);
    });

    it("error scenario reproduces cache-poisoning shape (200 + error body)", async () => {
        const res = await POST(
            makeReq("accion=RecuperarProximosArribosW", "error"),
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty("error");
    });

    it("cf-block scenario returns 403 HTML", async () => {
        const res = await POST(
            makeReq("accion=RecuperarProximosArribosW", "cf-block"),
        );
        expect(res.status).toBe(403);
        expect(res.headers.get("content-type")).toContain("text/html");
    });

    it("session-expired scenario returns 503", async () => {
        const res = await POST(makeReq("accion=Foo", "session-expired"));
        expect(res.status).toBe(503);
        const json = await res.json();
        expect(json.error).toBeTruthy();
    });

    it("no-data scenario returns CodigoEstado -1", async () => {
        const res = await POST(
            makeReq("accion=RecuperarProximosArribosW", "no-data"),
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.CodigoEstado).toBe(-1);
    });

    it("logunidadnodespachada returns descripcion + ok status", async () => {
        const res = await POST(makeReq("accion=logunidadnodespachada"));
        const json = await res.json();
        expect(json).toHaveProperty("descripcion");
        expect(json.CodigoEstado).toBe(0);
    });
});
