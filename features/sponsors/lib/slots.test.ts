import { describe, expect, it } from "vitest";
import { isAdSlotId } from "./slots";

describe("isAdSlotId", () => {
  it("acepta los dos lugares de Consultar", () => {
    expect(isAdSlotId("consultar")).toBe(true);
    expect(isAdSlotId("consultar-2")).toBe(true);
  });

  it("rechaza un id inventado", () => {
    expect(isAdSlotId("consultar-99")).toBe(false);
    expect(isAdSlotId("")).toBe(false);
  });
});
