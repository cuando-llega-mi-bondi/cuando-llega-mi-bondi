import { describe, expect, it } from "vitest";

import {
    MgpBusinessError,
    MgpNetworkError,
    MgpUnavailableError,
    classifyUnavailableMessage,
    describeMgpError,
    nextRetryDelayMs,
} from "@shared/api/errors";

describe("classifyUnavailableMessage", () => {
    it("clasifica circuit_open como slow", () => {
        expect(classifyUnavailableMessage("circuit_open: breaker tripped")).toBe("slow");
    });

    it("clasifica bridge_busy como fast", () => {
        expect(classifyUnavailableMessage("bridge_busy: queue full")).toBe("fast");
    });

    it("clasifica cualquier otro mensaje como normal", () => {
        expect(classifyUnavailableMessage("webWS.php devolvió 429")).toBe("normal");
        expect(classifyUnavailableMessage("bridge_timeout")).toBe("normal");
    });
});

describe("describeMgpError", () => {
    it("da retriable=none, severity=info y usa MensajeEstado para errores de negocio", () => {
        const err = new MgpBusinessError(-1, "La parada no corresponde a la linea");
        const info = describeMgpError(err);
        expect(info.kind).toBe("business");
        expect(info.retriable).toBe("none");
        expect(info.severity).toBe("info");
        expect(info.message).toContain("La parada no corresponde a la linea");
    });

    it("distingue circuit_open (slow/warning) de bridge_busy (fast/info) de otros 502 (normal/warning)", () => {
        const slow = describeMgpError(new MgpUnavailableError("circuit_open", "slow", 502));
        expect(slow.retriable).toBe("slow");
        expect(slow.severity).toBe("warning");

        const fast = describeMgpError(new MgpUnavailableError("bridge_busy", "fast", 502));
        expect(fast.retriable).toBe("fast");
        expect(fast.severity).toBe("info");

        const normal = describeMgpError(new MgpUnavailableError("webWS.php devolvió 429", "normal", 502));
        expect(normal.retriable).toBe("normal");
        expect(normal.severity).toBe("warning");
    });

    it("da un mensaje de red/timeout (severity=warning) para MgpNetworkError", () => {
        const info = describeMgpError(new MgpNetworkError("Failed to fetch", false));
        expect(info.kind).toBe("network");
        expect(info.retriable).toBe("normal");
        expect(info.severity).toBe("warning");
    });

    it("cae en unknown para errores no reconocidos", () => {
        const info = describeMgpError(new Error("algo raro"));
        expect(info.kind).toBe("unknown");
    });
});

describe("nextRetryDelayMs", () => {
    it("devuelve Infinity para errores de negocio (no reintentar)", () => {
        const err = new MgpBusinessError(-1, "Parada inexistente");
        expect(nextRetryDelayMs(err, 1)).toBe(Infinity);
    });

    it("crece exponencialmente con techo 30s para normal/network", () => {
        const err = new MgpUnavailableError("bridge_timeout", "normal", 502);
        expect(nextRetryDelayMs(err, 1)).toBe(2_000);
        expect(nextRetryDelayMs(err, 2)).toBe(4_000);
        expect(nextRetryDelayMs(err, 3)).toBe(8_000);
        expect(nextRetryDelayMs(err, 10)).toBe(30_000);
    });

    it("arranca más bajo y crece más rápido para bridge_busy (fast)", () => {
        const err = new MgpUnavailableError("bridge_busy", "fast", 502);
        expect(nextRetryDelayMs(err, 1)).toBe(1_000);
        expect(nextRetryDelayMs(err, 2)).toBe(2_000);
        expect(nextRetryDelayMs(err, 10)).toBe(30_000);
    });

    it("arranca alto y techa en 60s para circuit_open (slow)", () => {
        const err = new MgpUnavailableError("circuit_open", "slow", 502);
        expect(nextRetryDelayMs(err, 1)).toBe(30_000);
        expect(nextRetryDelayMs(err, 2)).toBe(60_000);
        expect(nextRetryDelayMs(err, 10)).toBe(60_000);
    });
});
