import { describe, expect, it } from "vitest";
import { acceptsNeitherMarkdownNorHtml, prefersMarkdown } from "./acceptNegotiation";

describe("prefersMarkdown", () => {
    it("prefiere markdown cuando es el único tipo pedido", () => {
        expect(prefersMarkdown("text/markdown")).toBe(true);
    });

    it("no prefiere markdown para un browser típico", () => {
        expect(
            prefersMarkdown(
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            ),
        ).toBe(false);
    });

    it("respeta q=0 explícito sobre html a favor de markdown", () => {
        expect(prefersMarkdown("text/html;q=0, */*;q=1")).toBe(true);
    });

    it("sin Accept header no prefiere markdown", () => {
        expect(prefersMarkdown(null)).toBe(false);
        expect(prefersMarkdown(undefined)).toBe(false);
        expect(prefersMarkdown("")).toBe(false);
    });

    it("un match exacto de html le gana a un comodín de markdown", () => {
        // No aplica hoy (markdown nunca se pide con comodín en la práctica),
        // pero cubre la regla de especificidad de RFC 9110 igual.
        expect(prefersMarkdown("text/html, */*;q=0.1")).toBe(false);
    });

    it("q más alto para markdown gana aunque html también esté listado", () => {
        expect(prefersMarkdown("text/markdown;q=1, text/html;q=0.5")).toBe(true);
    });

    it("q más alto para html gana cuando markdown pide menos", () => {
        expect(prefersMarkdown("text/markdown;q=0.3, text/html;q=0.9")).toBe(false);
    });

    it("un Accept de imagen genérico (og:image, favicons) no dispara markdown", () => {
        // Ambos solo matchean por el comodín final, mismo empate: gana html
        // (el default seguro). Regresión: esto rompía /opengraph-image antes.
        expect(
            prefersMarkdown("image/avif,image/webp,image/apng,image/svg+xml,*/*;q=0.8"),
        ).toBe(false);
        expect(prefersMarkdown("*/*")).toBe(false);
    });
});

describe("acceptsNeitherMarkdownNorHtml", () => {
    it("true cuando el cliente solo acepta JSON", () => {
        expect(acceptsNeitherMarkdownNorHtml("application/json")).toBe(true);
    });

    it("false cuando hay comodín", () => {
        expect(acceptsNeitherMarkdownNorHtml("*/*")).toBe(false);
    });

    it("false sin Accept header (nada que rechazar)", () => {
        expect(acceptsNeitherMarkdownNorHtml(null)).toBe(false);
    });
});
