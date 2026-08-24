import { describe, expect, it } from "vitest";
import { parseAdHref } from "./href";

describe("parseAdHref", () => {
  it("completa https si falta el protocolo", () => {
    expect(parseAdHref("instagram.com/tu.cuenta")).toBe("https://instagram.com/tu.cuenta");
  });

  it("rechaza javascript:", () => {
    expect(() => parseAdHref("javascript:alert(1)")).toThrow();
  });
});
