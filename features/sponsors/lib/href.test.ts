import { describe, expect, it } from "vitest";
import { minNextAmountArs } from "./pricing";
import { parseAdHref } from "./href";

describe("minNextAmountArs", () => {
  it("usa el piso si el lugar está libre", () => {
    expect(minNextAmountArs(0)).toBe(1_000);
  });

  it("suma el incremento sobre el ocupante actual", () => {
    expect(minNextAmountArs(1_000)).toBe(2_000);
  });
});

describe("parseAdHref", () => {
  it("completa https si falta el protocolo", () => {
    expect(parseAdHref("instagram.com/tu.cuenta")).toBe("https://instagram.com/tu.cuenta");
  });

  it("rechaza javascript:", () => {
    expect(() => parseAdHref("javascript:alert(1)")).toThrow();
  });
});
