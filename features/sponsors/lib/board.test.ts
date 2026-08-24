import { describe, expect, it } from "vitest";
import { compareAdBids, minToEnterArs, minToLeadArs } from "./board";

const FLOOR = 1_000;
const STEP = 100;

describe("minToEnterArs", () => {
  it("cobra el piso mientras quede un puesto libre", () => {
    expect(minToEnterArs([], FLOOR, STEP)).toBe(FLOOR);
    expect(minToEnterArs([2_750], FLOOR, STEP)).toBe(FLOOR);
  });

  it("con el podio lleno hay que superar al último", () => {
    expect(minToEnterArs([2_750, 2_200], FLOOR, STEP)).toBe(2_300);
  });

  it("nunca baja del piso aunque el último haya pagado menos", () => {
    expect(minToEnterArs([900, 500], FLOOR, STEP)).toBe(FLOOR);
  });
});

describe("minToLeadArs", () => {
  it("es el piso si no hay nadie", () => {
    expect(minToLeadArs([], FLOOR, STEP)).toBe(FLOOR);
  });

  it("supera al primero, no al último", () => {
    expect(minToLeadArs([2_750, 2_200], FLOOR, STEP)).toBe(2_850);
  });
});

describe("compareAdBids", () => {
  it("ordena por monto de mayor a menor", () => {
    const bids = [
      { amountArs: 1_500, since: "2026-08-23T00:30:08Z" },
      { amountArs: 2_750, since: "2026-08-24T13:29:19Z" },
      { amountArs: 2_200, since: "2026-08-22T10:00:00Z" },
    ];
    expect([...bids].sort(compareAdBids).map((b) => b.amountArs)).toEqual([2_750, 2_200, 1_500]);
  });

  it("a igual monto gana el que pagó primero", () => {
    const early = { amountArs: 2_300, since: "2026-08-24T10:00:00Z" };
    const late = { amountArs: 2_300, since: "2026-08-24T10:00:01Z" };
    expect([late, early].sort(compareAdBids)).toEqual([early, late]);
  });
});
