import { describe, expect, it } from "vitest";
import { validateComment, validateDisplayName } from "./validation";

describe("validateComment", () => {
    it("acepta texto normal con acentos y puntuación", () => {
        expect(validateComment("Buen recorrido, ¡llegó rápido! ¿Lo recomendás?")).toBeNull();
    });

    it("acepta emojis", () => {
        expect(validateComment("Buenísimo " + String.fromCodePoint(0x1f68c))).toBeNull();
    });

    it("rechaza texto más largo que el máximo", () => {
        expect(validateComment("a".repeat(501))).not.toBeNull();
    });

    it("rechaza caracteres de control", () => {
        expect(validateComment("hola" + String.fromCodePoint(0x00) + "mundo")).not.toBeNull();
    });

    it("rechaza marcas de override bidi (spoofing)", () => {
        expect(validateComment("normal " + String.fromCodePoint(0x202e) + "texto")).not.toBeNull();
    });
});

describe("validateDisplayName", () => {
    it("acepta un nombre normal", () => {
        expect(validateDisplayName("Rocío")).toBeNull();
    });

    it("rechaza vacío", () => {
        expect(validateDisplayName("   ")).not.toBeNull();
    });

    it("rechaza más largo que el máximo", () => {
        expect(validateDisplayName("a".repeat(41))).not.toBeNull();
    });
});
