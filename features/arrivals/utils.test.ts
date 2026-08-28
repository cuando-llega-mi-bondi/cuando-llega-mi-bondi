import { describe, expect, it } from "vitest";

import { getArriboColor } from "@features/arrivals/utils";

describe("getArriboColor", () => {
    it("marca como llegando (verde) el arribo inminente", () => {
        expect(getArriboColor("Arribando..")).toBe("#22c55e");
        expect(getArriboColor("Llegando")).toBe("#22c55e");
        expect(getArriboColor("1 min. aprox.")).toBe("#22c55e");
    });

    it("marca como próximo (azul) 2 o 3 minutos", () => {
        expect(getArriboColor("2 min. aprox.")).toBe("#0099ff");
        expect(getArriboColor("3 min. aprox.")).toBe("#0099ff");
    });

    it("no confunde minutos de dos dígitos con el dígito final", () => {
        expect(getArriboColor("12 min. aprox.")).toBe("#ffffff");
        expect(getArriboColor("21 min. aprox.")).toBe("#ffffff");
        expect(getArriboColor("23 min. aprox.")).toBe("#ffffff");
    });

    it("usa blanco para arribos lejanos", () => {
        expect(getArriboColor("43 min. aprox.")).toBe("#ffffff");
    });
});
