import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.resetModules()` + import dinámico hacen que `shared/api/errors` se
// reevalúe junto con `shared/api/client` en cada test; importar las clases de
// error de forma estática acá crearía una instancia de módulo distinta y
// rompería los `instanceof`. Por eso se importan dinámicamente en cada test.
async function importFresh() {
    const client = await import("@shared/api/client");
    const errors = await import("@shared/api/errors");
    return { ...client, ...errors };
}

function mockResponse(
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (name: string) => headers[name] ?? null },
        json: async () => body,
    } as unknown as Response;
}

describe("postWithMeta (camino proxy)", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NEXT_PUBLIC_CUANDO_API_URL = "https://proxy.example.com";
        // RecuperarProximosArribosW no está en STATIC_REFERENCE_ACCIONES: siempre va al proxy.
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.NEXT_PUBLIC_CUANDO_API_URL;
    });

    it("CodigoEstado: 0 + X-Cache: HIT se trata como éxito", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockResponse(200, { CodigoEstado: 0, arribos: [{ Arribo: "5" }] }, { "X-Cache": "HIT" }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        const result = await postWithMeta("RecuperarProximosArribosW", { identificadorParada: "P1" });

        expect(result.data).toEqual({ CodigoEstado: 0, arribos: [{ Arribo: "5" }] });
        expect(result.meta).toEqual({ cache: "HIT", staleReason: null });
    });

    it("CodigoEstado != 0 lanza MgpBusinessError con el MensajeEstado real", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockResponse(200, { CodigoEstado: -1, MensajeEstado: "La parada no corresponde a la linea" }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpBusinessError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpBusinessError);
            expect((err as InstanceType<typeof MgpBusinessError>).codigoEstado).toBe(-1);
            expect((err as InstanceType<typeof MgpBusinessError>).mensajeEstado).toBe(
                "La parada no corresponde a la linea",
            );
            return true;
        });
    });

    it("X-Cache: STALE + X-Stale-Reason se propagan en meta", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockResponse(
                200,
                { CodigoEstado: 0, arribos: [] },
                { "X-Cache": "STALE", "X-Stale-Reason": "circuit_open" },
            ),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        const result = await postWithMeta("RecuperarProximosArribosW", {});

        expect(result.meta).toEqual({ cache: "STALE", staleReason: "circuit_open" });
    });

    it.each([
        ["circuit_open: breaker tripped", "slow"],
        ["bridge_busy: queue full", "fast"],
        ["webWS.php devolvió 429", "normal"],
    ] as const)("502 con message %s clasifica retriable=%s", async (message, retriable) => {
        const fetchMock = vi.fn().mockResolvedValue(mockResponse(502, { error: "mgp_unavailable", message }));
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpUnavailableError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpUnavailableError);
            expect((err as InstanceType<typeof MgpUnavailableError>).retriable).toBe(retriable);
            expect((err as InstanceType<typeof MgpUnavailableError>).status).toBe(502);
            return true;
        });
    });

    it("fallo de red (TypeError) lanza MgpNetworkError no-timeout", async () => {
        const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpNetworkError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpNetworkError);
            expect((err as InstanceType<typeof MgpNetworkError>).isTimeout).toBe(false);
            return true;
        });
    });

    it("timeout (AbortSignal.timeout) lanza MgpNetworkError con isTimeout=true", async () => {
        const timeoutError = new DOMException("The operation timed out.", "TimeoutError");
        const fetchMock = vi.fn().mockRejectedValue(timeoutError);
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpNetworkError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpNetworkError);
            expect((err as InstanceType<typeof MgpNetworkError>).isTimeout).toBe(true);
            return true;
        });
    });
});

describe("postWithMeta (failover entre backends)", () => {
    const A = "https://a.example.com";
    const B = "https://b.example.com";
    const OK = { CodigoEstado: 0, arribos: [] };

    type FetchMock = { mock: { calls: unknown[][] } };
    const hostsOf = (fetchMock: FetchMock) =>
        fetchMock.mock.calls.map((call) => new URL(String(call[0])).origin);

    /** fetch que responde distinto según el host al que se le pega. */
    function fetchByHost(handlers: Record<string, () => Promise<Response>>) {
        return vi.fn().mockImplementation((url: string) => {
            const origin = new URL(url).origin;
            const handler = handlers[origin];
            if (!handler) throw new Error(`host inesperado: ${origin}`);
            return handler();
        });
    }

    beforeEach(() => {
        vi.resetModules();
        process.env.NEXT_PUBLIC_CUANDO_API_URL = A;
        process.env.NEXT_PUBLIC_PROXY_API_URL = B;
        // Orden determinista: primero A, después B.
        vi.spyOn(Math, "random").mockReturnValue(0);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        delete process.env.NEXT_PUBLIC_CUANDO_API_URL;
        delete process.env.NEXT_PUBLIC_PROXY_API_URL;
    });

    it("fallo de red en el primer host reintenta en el segundo", async () => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.reject(new TypeError("Failed to fetch")),
            [B]: () => Promise.resolve(mockResponse(200, OK, { "X-Cache": "MISS" })),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        const result = await postWithMeta("RecuperarProximosArribosW", { identificadorParada: "P1" });

        expect(result.data).toEqual(OK);
        expect(result.meta.cache).toBe("MISS");
        expect(hostsOf(fetchMock)).toEqual([A, B]);
    });

    it("timeout propio en el primer host reintenta en el segundo", async () => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.reject(new DOMException("The operation timed out.", "TimeoutError")),
            [B]: () => Promise.resolve(mockResponse(200, OK)),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).resolves.toBeTruthy();
        expect(hostsOf(fetchMock)).toEqual([A, B]);
    });

    it.each([
        [502, { error: "mgp_unavailable", message: "circuit_open: breaker tripped" }],
        [503, { error: "unavailable" }],
    ])("HTTP %s en el primer host reintenta en el segundo", async (status, body) => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.resolve(mockResponse(status, body)),
            [B]: () => Promise.resolve(mockResponse(200, OK)),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        const result = await postWithMeta("RecuperarProximosArribosW", {});

        expect(result.data).toEqual(OK);
        expect(hostsOf(fetchMock)).toEqual([A, B]);
    });

    it("si fallan todos los hosts propaga el error del último", async () => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.reject(new TypeError("Failed to fetch")),
            [B]: () =>
                Promise.resolve(
                    mockResponse(502, { error: "mgp_unavailable", message: "bridge_busy: queue full" }),
                ),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpUnavailableError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpUnavailableError);
            expect((err as InstanceType<typeof MgpUnavailableError>).retriable).toBe("fast");
            return true;
        });
        expect(hostsOf(fetchMock)).toEqual([A, B]);
    });

    it("4xx no hace failover", async () => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.resolve(mockResponse(404, { error: "not_found" })),
            [B]: () => Promise.resolve(mockResponse(200, OK)),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpUnavailableError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toSatisfy((err: unknown) => {
            expect(err).toBeInstanceOf(MgpUnavailableError);
            expect((err as InstanceType<typeof MgpUnavailableError>).status).toBe(404);
            return true;
        });
        expect(hostsOf(fetchMock)).toEqual([A]);
    });

    it("error de negocio (CodigoEstado != 0) no hace failover", async () => {
        const fetchMock = fetchByHost({
            [A]: () => Promise.resolve(mockResponse(200, { CodigoEstado: -1, MensajeEstado: "Parada inexistente" })),
            [B]: () => Promise.resolve(mockResponse(200, OK)),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpBusinessError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toBeInstanceOf(MgpBusinessError);
        expect(hostsOf(fetchMock)).toEqual([A]);
    });

    it("cancelación del caller no hace failover", async () => {
        const controller = new AbortController();
        const fetchMock = fetchByHost({
            [A]: () => {
                controller.abort();
                return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
            },
            [B]: () => Promise.resolve(mockResponse(200, OK)),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpNetworkError } = await importFresh();
        await expect(
            postWithMeta("RecuperarProximosArribosW", {}, { signal: controller.signal }),
        ).rejects.toBeInstanceOf(MgpNetworkError);
        expect(hostsOf(fetchMock)).toEqual([A]);
    });

    it("el host inicial se elige al azar y el otro queda como failover", async () => {
        vi.spyOn(Math, "random").mockReturnValue(0.9); // arranca por B
        const fetchMock = fetchByHost({
            [A]: () => Promise.resolve(mockResponse(200, OK)),
            [B]: () => Promise.reject(new TypeError("Failed to fetch")),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).resolves.toBeTruthy();
        expect(hostsOf(fetchMock)).toEqual([B, A]);
    });

    it("con un solo backend configurado hay un solo intento", async () => {
        delete process.env.NEXT_PUBLIC_PROXY_API_URL;
        const fetchMock = fetchByHost({
            [A]: () => Promise.reject(new TypeError("Failed to fetch")),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta, MgpNetworkError } = await importFresh();
        await expect(postWithMeta("RecuperarProximosArribosW", {})).rejects.toBeInstanceOf(MgpNetworkError);
        expect(hostsOf(fetchMock)).toEqual([A]);
    });
});

describe("postWithMeta (camino /api/reference)", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NEXT_PUBLIC_USE_STATIC_REFERENCE = "true";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.NEXT_PUBLIC_USE_STATIC_REFERENCE;
    });

    it("no chequea CodigoEstado y siempre devuelve meta nula", async () => {
        // El dump estático no tiene CodigoEstado/X-Cache; un body cualquiera sirve.
        const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { lineas: [{ Codigo: "93" }] }));
        vi.stubGlobal("fetch", fetchMock);

        const { postWithMeta } = await importFresh();
        const result = await postWithMeta("RecuperarLineaPorCuandoLlega", {});

        expect(result.data).toEqual({ lineas: [{ Codigo: "93" }] });
        expect(result.meta).toEqual({ cache: null, staleReason: null });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain("/api/reference");
    });
});
